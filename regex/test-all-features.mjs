import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to run conversion via command line
async function transformPhpToJs(phpCode, filename) {
    const testInputPath = path.join(__dirname, 'test-input', filename);
    const testOutputPath = path.join(__dirname, 'test-input', filename.replace('.php', '.js'));
    
    // Ensure test-input directory exists
    await fs.mkdir(path.join(__dirname, 'test-input'), { recursive: true });
    
    // Write PHP code to file
    await fs.writeFile(testInputPath, phpCode, 'utf8');
    
    // Run converter
    try {
        execSync(`node convert.mjs --src test-input --dst test-input --no-recurse`, {
            cwd: __dirname,
            stdio: 'pipe'
        });
    } catch (err) {
        // Ignore errors, we'll check the output
    }
    
    // Read result
    try {
        const result = await fs.readFile(testOutputPath, 'utf8');
        // Clean up
        await fs.unlink(testInputPath);
        await fs.unlink(testOutputPath);
        return result;
    } catch (err) {
        // Clean up input file even if output doesn't exist
        try {
            await fs.unlink(testInputPath);
        } catch {}
        throw new Error(`Failed to read output: ${err.message}`);
    }
}

// Test suite
const tests = [];
let passed = 0;
let failed = 0;

function test(name, phpCode, expectedPatterns, notExpectedPatterns = []) {
    tests.push({ name, phpCode, expectedPatterns, notExpectedPatterns });
}

async function runTests() {
    const output = [];
    output.push('Running PHP to JS Converter Tests\n');
    output.push('='.repeat(80));
    
    let testIndex = 0;
    for (const { name, phpCode, expectedPatterns, notExpectedPatterns } of tests) {
        try {
            const result = await transformPhpToJs(phpCode, `test${testIndex++}.php`);
            
            let testPassed = true;
            const errors = [];
            
            // Check expected patterns
            for (const pattern of expectedPatterns) {
                if (typeof pattern === 'string') {
                    if (!result.includes(pattern)) {
                        testPassed = false;
                        errors.push(`  ✗ Missing expected: "${pattern}"`);
                    }
                } else if (pattern instanceof RegExp) {
                    if (!pattern.test(result)) {
                        testPassed = false;
                        errors.push(`  ✗ Missing expected pattern: ${pattern}`);
                    }
                }
            }
            
            // Check not expected patterns
            for (const pattern of notExpectedPatterns) {
                if (typeof pattern === 'string') {
                    if (result.includes(pattern)) {
                        testPassed = false;
                        errors.push(`  ✗ Found unexpected: "${pattern}"`);
                    }
                } else if (pattern instanceof RegExp) {
                    if (pattern.test(result)) {
                        testPassed = false;
                        errors.push(`  ✗ Found unexpected pattern: ${pattern}`);
                    }
                }
            }
            
            if (testPassed) {
                output.push(`✓ ${name}`);
                passed++;
            } else {
                output.push(`✗ ${name}`);
                errors.forEach(err => output.push(err));
                output.push('\n--- Generated Output ---');
                output.push(result);
                output.push('--- End Output ---\n');
                failed++;
            }
        } catch (err) {
            output.push(`✗ ${name}`);
            output.push(`  Error: ${err.message}`);
            failed++;
        }
    }
    
    output.push('='.repeat(80));
    output.push(`\nTests: ${passed} passed, ${failed} failed, ${tests.length} total`);
    
    // Write to file
    await fs.writeFile(path.join(__dirname, 'test-results.txt'), output.join('\n'), 'utf8');
    console.log(output.join('\n'));
    
    if (failed > 0) {
        process.exit(1);
    }
}

// ============================================================================
// TEST CASES
// ============================================================================

// 1. Variable name conversion
test('Variable names - strip $', 
    '$variable = "value";',
    ['variable = "value";'],
    ['$variable']
);

// 2. String concatenation - basic
test('String concatenation - basic',
    '$name = "John" . " " . "Doe";',
    ['name = "John" + " " + "Doe";'],
    ['name = "John" . " " . "Doe";']
);

// 3. String concatenation - with constants
test('String concatenation - constants',
    'if ( file_exists( ABSPATH . \'wp-config.php\' ) ) {',
    ['if ( file_exists( ABSPATH + \'wp-config.php\' ) ) {'],
    ['ABSPATH . \'wp-config.php\'']
);

// 4. String concatenation - dots inside strings should NOT be converted
test('String concatenation - preserve dots in strings',
    '$msg = "There doesn\'t seem to be a file. It is needed.";',
    ['"There doesn\'t seem to be a file. It is needed."'],
    ['"There doesn\'t seem to be a file + It is needed + "', 'file + It']
);

// 5. String concatenation - multi-line with dots in strings
test('String concatenation - multi-line with dots in strings',
    `$die = '<p>' . sprintf(
    __( "There doesn't seem to be a %s file. It is needed before the installation can continue." ),
    '<code>wp-config.php</code>'
) . '</p>';`,
    [
        'die = \'<p>\' + sprintf(',
        '"There doesn\'t seem to be a %s file. It is needed before the installation can continue."',
        '\'<code>wp-config.php</code>\'',
        ') + \'</p>\';'
    ],
    [
        'file + It',
        'wp-config + php',
        'continue + "'
    ]
);

// 6. String concatenation - dots in comments should NOT be converted
test('String concatenation - preserve dots in comments',
    `// Die with an error message.
$var = 'test';`,
    ['// Die with an error message.'],
    ['// Die with an error message +', 'message + ']
);

// 7. Object operator -> conversion
test('Object operator conversion',
    '$user->getName();',
    ['user.getName();'],
    ['user->getName()']
);

// 8. Static operator :: conversion
test('Static operator conversion',
    'User::getInstance();',
    ['User.getInstance();'],
    ['User::getInstance()']
);

// 9. foreach - key => value
test('foreach - key value pairs',
    'foreach ( $crons as $timestamp => $cronhooks ) {',
    ['for (const [timestamp, cronhooks] of Object.entries(crons)) {'],
    ['foreach']
);

// 10. foreach - value only
test('foreach - value only',
    'foreach ( $items as $item ) {',
    ['for (const item of items) {'],
    ['foreach']
);

// 11. elseif conversion
test('elseif conversion',
    'if ($a) { } elseif ($b) { } else { }',
    ['else if (b)'],
    ['elseif']
);

// 12. global keyword
test('global keyword - variable hoisting',
    `function test() {
    global $wpdb;
    $result = $wpdb->query();
}`,
    [
        'let wpdb;',
        '// (global variables hoisted to IIFE scope)'
    ],
    ['global $wpdb;']
);

// 13. Error control operator @
test('Error control operator',
    '@unlink($file);',
    ['/* @suppress-errors */ unlink(file);'],
    ['@unlink']
);

// 14. Error control operator - not in comments
test('Error control operator - preserve in comments',
    '/* @param string $var */',
    ['/* @param string $var */'],
    ['/* @suppress-errors */param']
);

// 15. die/exit conversion
test('die/exit conversion',
    'die("Error message");',
    ['throw new Error("Error message");'],
    ['die(']
);

// 16. die/exit - not $die variable
test('die variable should not convert',
    '$die = "message";',
    ['die = "message";'],
    ['throw new Error']
);

// 17. define() conversion
test('define() conversion',
    'define("MY_CONSTANT", "value");',
    ['export const MY_CONSTANT = "value";'],
    ['define(']
);

// 18. Function declarations
test('function declarations',
    'function myFunction($param1, $param2) {',
    ['export function myFunction(param1, param2) {'],
    ['$param']
);

// 19. Class declarations
test('class declarations',
    'class MyClass extends BaseClass {',
    ['export class MyClass extends BaseClass {']
);

// 20. echo/print conversion
test('echo conversion',
    'echo $message;',
    ['console.log(message);'],
    ['echo ']
);

// 21. Magic constants
test('magic constants',
    '$dir = __DIR__; $file = __FILE__;',
    ['dir = __dirname;', 'file = __filename;'],
    ['__DIR__', '__FILE__']
);

// 22. Array conversion
test('array() conversion',
    '$arr = array(1, 2, 3);',
    ['arr = [ 1, 2, 3 ];'],
    ['array(']
);

// 23. Associative array conversion
test('associative array conversion',
    '$arr = array("key" => "value");',
    [/\{\s*"key"\s*:\s*"value"\s*\}/],  // Allow spaces around colon
    ['array(', '=>']
);

// 24. Comments - # to //
test('comment conversion',
    '# This is a comment',
    ['// This is a comment'],
    ['# This']
);

// 25. Decimal numbers - preserve dots
test('decimal numbers - preserve dots',
    '$pi = 3.14;',
    ['pi = 3.14;'],
    ['3 + 14']
);

// 26. Compound assignment .=
test('compound assignment .=',
    '$str .= " more";',
    ['str += " more";'],
    ['str .=']
);

// 27. require/include conversion
test('require conversion',
    'require "config.php";',
    ['import \'./config.js\';'],
    ['require ']
);

// 27b. require_once conversion
test('require_once conversion',
    `require_once 'functions.php';
require_once __DIR__ . '/includes/class.php';
require_once __DIR__ . '/wp-load.php';
require_once ABSPATH . 'wp-includes/version.php';`,
    [
        'import \'./functions.js\';',
        'import \'./includes/class.js\';',
        'import \'./wp-load.js\';',
        /\/\/ TODO: import equivalent of ABSPATH [\.\+] 'wp-includes\/version\.php' \(from require_once\)/
    ],
    ['require_once __dirname']
);

// 28. Complex string concatenation with block comments
test('String concatenation with block comments',
    `$die = '<p>' . sprintf(
    /* translators: %s: wp-config.php */
    __( "message" )
) . '</p>';`,
    [
        'die = \'<p>\' + sprintf(',
        '/* translators: %s: wp-config.php */',
        '__( "message" )',
        ') + \'</p>\';'
    ],
    ['wp-config + php', 'translators: %s: wp-config + php']
);

// 29. String concatenation after function call
test('String concatenation after function call',
    `$path = wp_guess_url() . '/wp-admin/setup-config.php';`,
    [`path = wp_guess_url() + '/wp-admin/setup-config.php';`],
    [`wp_guess_url() . '/`]
);

// 30. Alternative syntax - if/endif
test('Alternative syntax - if/endif',
    `if ($condition):
    echo "true";
endif;`,
    ['if (condition) {', '}'],
    ['endif']
);

// 31. Alternative syntax - if/else/endif
test('Alternative syntax - if/else/endif',
    `if ($a):
    echo "a";
else:
    echo "b";
endif;`,
    ['if (a) {', '} else {', '}'],
    ['endif', 'else:']
);

// 32. Alternative syntax - foreach/endforeach (simple)
test('Alternative syntax - foreach/endforeach simple',
    `foreach ($items as $item):
    echo $item;
endforeach;`,
    ['for (const item of items) {', '}'],
    ['endforeach', 'foreach']
);

// 32b. Alternative syntax - foreach/endforeach (key-value)
test('Alternative syntax - foreach/endforeach key-value',
    `foreach ($items as $key => $value):
    echo $key;
endforeach;`,
    ['for (const [key, value] of Object.entries(items)) {', '}'],
    ['endforeach', 'foreach']
);

// 33. Alternative syntax - while/endwhile
test('Alternative syntax - while/endwhile',
    `while ($condition):
    echo "loop";
endwhile;`,
    ['while (condition) {', '}'],
    ['endwhile']
);

// 34. Type casts should be removed
test('Type casts removal',
    `$arr = (array) $data;
$num = (int) $value;
$str = (string) $obj;`,
    [
        'arr =  data;',
        'num =  value;',
        'str =  obj;'
    ],
    ['(array)', '(int)', '(string)']
);

// 35. Property access after -> conversion should not become concatenation
test('Property access preservation',
    `$title = $bookmark->link_name;
$url = $bookmark->link_url;`,
    [
        'title = bookmark.link_name;',
        'url = bookmark.link_url;'
    ],
    ['bookmark + link', 'link + name', 'link + url']
);

// 36. in_array() should not be converted to in_[]
test('in_array function preservation',
    `if ( ! in_array( $link_cat, array( 'all', '0' ), true ) ) {
    $link_cat = absint( urldecode( $link_cat ) );
}`,
    [
        /if \( ! in_array\( link_cat, \[\s*'all',\s*'0'\s*\], true \) \) \{/,
        'link_cat = absint( urldecode( link_cat ) );'
    ],
    ['in_[', 'in_array[']
);

// 37. Superglobals should use _ parameter
test('Superglobals conversion',
    `$name = $_GET['name'];
$email = $_POST['email'];
$host = $_SERVER['HTTP_HOST'];`,
    [
        'name = _.GET[\'name\'];',
        'email = _.POST[\'email\'];',
        'host = _.SERVER[\'HTTP_HOST\'];',
        '(function(_) {'
    ],
    ['$_GET', '$_POST', '$_SERVER']
);

// 38. Array append operator
test('Array append operator',
    `$items = array();
$items[] = 'first';
$items[] = 'second';
$results[] = $value;`,
    [
        /items = \[\s*\];/,
        'items.push(\'first\');',
        'items.push(\'second\');',
        'results.push(value);'
    ],
    ['items[] =', 'results[] =']
);

// 39. String concatenation with string literals
test('String literal concatenation',
    `$home_url  = 'http://' . $domain . $path;
$login_url = 'http://' . $domain . $path . 'wp-login.php';`,
    [
        /home_url\s*=\s*'http:\/\/' \+ domain \+ path;/,
        /login_url\s*=\s*'http:\/\/' \+ domain \+ path \+ 'wp-login\.php';/
    ],
    ["'http://' . ", '. $domain', '. $path']
);

// 40. Equality operators conversion
test('Equality operators',
    `if ($a == $b) {
    echo "equal";
}
if ($x != $y) {
    echo "not equal";
}
if ($p === $q) {
    echo "strict equal";
}
if ($m !== $n) {
    echo "strict not equal";
}`,
    [
        'if (a === b) {',
        'if (x !== y) {',
        'if (p === q) {',
        'if (m !== n) {'
    ],
    [] // No negative checks - the positive checks are sufficient
);

// 41. Nested arrays
test('Nested arrays',
    `$config = array(
    'type' => 'info',
    'classes' => array('message', 'register'),
);`,
    [
        /\{\s*'type'\s*:\s*'info'/,
        /'classes'\s*:\s*\[\s*'message',\s*'register'\s*\]/
    ],
    ['array(']
);

// 42. String concatenation with block comments
test('String concatenation with block comment in function',
    `printf(
    /* translators: %s: Admin email address. */
    __( 'Current administration email: %s' ),
    '<strong>' . esc_html( $admin_email ) . '</strong>'
);`,
    [
        /'<strong>' \+ esc_html\( admin_email \) \+ '<\/strong>'/,
        '/* translators: %s: Admin email address. */'
    ],
    ["'<strong>' . ", '. esc_html']
);

// 43. Blank lines preservation
test('Blank lines preservation',
    `$a = 1;

$b = 2;


$c = 3;`,
    [
        'a = 1;',
        /a = 1;\n\nb = 2;/,
        /b = 2;\n\n\nc = 3;/
    ],
    []
);

// 44. foreach with method call
test('foreach with method call',
    `foreach ( $wp_error->get_error_codes() as $code ) {
    echo $code;
}`,
    [
        'for (const code of wp_error.get_error_codes()) {',
        'console.log(code);'
    ],
    ['foreach']
);

// 45. Single quote in single-line comment should not affect concatenation
test('Single quote in single-line comment',
    `// This comment has a single quote: don't
$result = 'First' . 'Second';
// Another comment: it's working
$value = 'A' . 'B' . 'C';`,
    [
        "// This comment has a single quote: don't",
        "result = 'First' + 'Second';",
        "// Another comment: it's working",
        "value = 'A' + 'B' + 'C';"
    ],
    ["'First' . 'Second'", "'A' . 'B'", "'B' . 'C'"]
);

// 46. Comments with quotes should not affect string concatenation
test('Comments with quotes',
    `// Comment with quote: don't
$message = 'Hello' . ' ' . 'World';
/* Block comment: "don't" and 'test' */
$name = 'A' . 'B';`,
    [
        "// Comment with quote: don't",
        "message = 'Hello' + ' ' + 'World';",
        '/* Block comment: "don\'t" and \'test\' */',
        "name = 'A' + 'B';"
    ],
    [". ' '", ". 'B'"]
);

// 47. require_once after comment with quote
test('require_once after comment with quote',
    `// Comment with quote: don't
require_once 'config.php';
/* Block: "it's" */
include_once 'header.php';`,
    [
        "// Comment with quote: don't",
        "import './config.js';",
        '/* Block: "it\'s" */',
        "import './header.js';"
    ],
    ['require_once', 'include_once']
);

// 48. Array destructuring with list()
test('Array destructuring with list()',
    `list($a, $b, $c) = $array;
list($first, , $third) = $data;`,
    [
        '[a, b, c] = array;',
        '[first, , third] = data;'
    ],
    ['list(']
);

// 49. define() scope handling
test('define() scope handling',
    `define('GLOBAL_CONST', 'value');
function test() {
    define('LOCAL_CONST', 123);
}`,
    [
        "export const GLOBAL_CONST = 'value';",
        'const LOCAL_CONST = 123;'
    ],
    ['define(']
);

// 50. Array key named 'include' should not be converted
test('Array key named include',
    `if ( empty( $link_cat ) ) {
    $cats = get_categories(
        array(
            'taxonomy'     => 'link_category',
            'hierarchical' => 0,
        )
    );
} else {
    $cats = get_categories(
        array(
            'taxonomy'     => 'link_category',
            'hierarchical' => 0,
            'include'      => $link_cat,
        )
    );
}`,
    [
        'cats = get_categories(',
        /['"]taxonomy['"]\s*:\s*['"]link_category['"]/,
        /['"]include['"]\s*:\s*link_cat/
    ],
    ['// TODO: import', '(from include)']
);

// 51. HTML entity semicolons in echo statements
test('HTML entity semicolons in echo statements',
    `echo '<label for="user_email">' . __( 'Email&nbsp;Address:' ) . '</label>';`,
    [
        "console.log('<label for=\"user_email\">'  + __( 'Email&nbsp;Address:' )  + '</label>');",
        'Email&nbsp;Address:'
    ],
    ['Email&nbsp);Address:', 'nbsp);']
);

// 52. Multiple HTML entities in single echo
test('Multiple HTML entities in echo',
    `echo '<p>Hello&nbsp;World&mdash;Test&copy;</p>';`,
    [
        "console.log('<p>Hello&nbsp;World&mdash;Test&copy;</p>');",
        '&nbsp;',
        '&mdash;',
        '&copy;'
    ],
    ['&nbsp);', '&mdash);', '&copy);']
);

// 53. HTML comments in string literals
test('HTML comments in string literals',
    `$content = '<!-- wp:cover {"align":"full"} -->
<div class="wp-block-cover">
<!-- /wp:cover -->';`,
    [
        "content = '<!-- wp:cover",
        '-->',
        '<!-- /wp:cover -->'
    ],
    ['-.', '-. ']
);

// 54. HTML comments with object operators
test('HTML comments should not be corrupted by -> conversion',
    `echo '<!-- wp:navigation {"layout":{"type":"flex"}} -->';`,
    [
        'console.log(',
        '<!-- wp:navigation',
        'type'
    ],
    ['<!--.', '-.>', '-. >', 'wp:navigation -.', '{"layout":-.}']
);

// 55. String concatenation with string literals
test('String concatenation - dot followed by string literal',
    `echo '<div>' . '</div>';`,
    [
        "console.log('<div>'  + '</div>');",
    ],
    ["console.log('<div>' . '</div>');"]
);

// 56. String concatenation with function calls and strings
test('String concatenation - mixed function calls and strings',
    `echo '<label>' . __('Text') . '</label>';`,
    [
        "console.log('<label>'  + __('Text')  + '</label>');",
    ],
    [". '</label>'", ". __"]
);

// 57. Echo with nested function calls and HTML entities
test('Echo with nested function calls and HTML entities',
    `echo '<span>' . sprintf(__('Hello&nbsp;%s'), $name) . '</span>';`,
    [
        "console.log('<span>'  + sprintf(__('Hello&nbsp;%s'), name)  + '</span>');",
        'Hello&nbsp;%s'
    ],
    ['Hello&nbsp);', 'nbsp);%s']
);

// 58. Object operator in regular code (not in strings)
test('Object operator conversion in regular statements',
    `$errmsg = $errors->get_error_message('user_name');`,
    [
        'errmsg = errors.get_error_message(',
        "('user_name')"
    ],
    ['errors->get_error_message', '->']
);

// 59. Multiple object operators in one line
test('Multiple object operators in one line',
    `$result = $user->profile->getName();`,
    [
        'result = user.profile.getName();'
    ],
    ['user->profile', 'profile->getName']
);

// 60. Object operators should be preserved in strings
test('Object operators preserved in strings',
    `$code = 'Use $object->method() to call';`,
    [
        "code = 'Use object->method() to call';",
        '->method()'
    ],
    ['object.method()']
);

// Run all tests
runTests();
