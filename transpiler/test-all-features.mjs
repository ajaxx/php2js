import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { transpile } from './transpiler.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to run AST transpiler directly and return JS result
async function transformPhpToJs(phpCode, filename) {
  // Directly call transpile without touching filesystem
  const result = await transpile(phpCode, { filename });
  return result;
}

// Simple test harness
const tests = [];
let passed = 0;
let failed = 0;

function test(name, phpCode, expectedPatterns, notExpectedPatterns = []) {
  tests.push({ name, phpCode, expectedPatterns, notExpectedPatterns });
}

function include(strOrRegex, haystack) {
  if (typeof strOrRegex === 'string') return haystack.includes(strOrRegex);
  if (strOrRegex instanceof RegExp) return strOrRegex.test(haystack);
  return false;
}

async function runTests() {
  const output = [];
  output.push('Running AST Transpiler Tests');
  output.push('='.repeat(80));

  let idx = 0;
  for (const { name, phpCode, expectedPatterns, notExpectedPatterns } of tests) {
    try {
      const result = await transformPhpToJs(phpCode, `ast${idx++}.php`);
      let ok = true;
      const errors = [];

      for (const pat of expectedPatterns) {
        if (!include(pat, result)) {
          ok = false;
          errors.push(`  ✗ Missing expected: ${pat.toString()}`);
        }
      }
      for (const pat of notExpectedPatterns) {
        if (include(pat, result)) {
          ok = false;
          errors.push(`  ✗ Found unexpected: ${pat.toString()}`);
        }
      }

      if (ok) {
        output.push(`✓ ${name}`);
        passed++;
      } else {
        output.push(`✗ ${name}`);
        errors.push('\n--- Generated Output ---');
        errors.push(result);
        errors.push('--- End Output ---\n');
        errors.forEach(e => output.push(e));
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
  await fs.writeFile(path.join(__dirname, 'test-results.txt'), output.join('\n'), 'utf8');
  console.log(output.join('\n'));
  if (failed > 0) process.exit(1);
}

// ============================================================================
// TEST CASES (derived from regex tests, adjusted for AST output)
// ============================================================================

// 1. Variable names - strip $
test('Variables - strip $',
  '$variable = "value"; $x = 1;',
  [ 'variable = "value";', 'x = 1;' ],
  [ '$variable', '$x' ]
);

// 2. String concatenation - basic
test('Concat - basic',
  '$name = "John" . " " . "Doe";',
  [ 'name = "John" + " " + "Doe";' ],
  [ '. " " .' ]
);

// 3. Echo to console.log
test('Echo -> console.log',
  'echo "Hello";',
  [ 'console.log("Hello");' ]
);

// 4. Object operator -> property access
test('Object operator',
  '$user->getName();',
  [ 'user.getName();' ],
  [ 'user->getName' ]
);

// 5. Static operator :: -> property access
test('Static operator',
  'User::instance();',
  [ 'User.instance();' ],
  [ 'User::instance' ]
);

// 6. Function declaration export
test('Function declaration (export)',
  'function greet($name) { echo $name; }',
  [ 'export function greet(name) {', 'console.log(name);' ]
);

// 7. Class declaration export + method
test('Class declaration (export) + method',
  'class User { public function getName() { return $this->name; } }',
  [ 'export class User {', 'getName() {', 'return this.name;' ]
);

// 8. Foreach - value only
test('Foreach - value only',
  'foreach ($items as $item) { echo $item; }',
  [ 'for (const item of items) {', 'console.log(item);' ]
);

// 9. Foreach - key/value
test('Foreach - key/value',
  'foreach ($map as $k => $v) { echo $k; echo $v; }',
  [ 'for (const [k, v] of Object.entries(map)) {', 'console.log(k);', 'console.log(v);' ]
);

// 10. If/else
test('If/else',
  'if ($x) { echo "A"; } else { echo "B"; }',
  [ 'if (x) {', 'console.log("A");', '} else {', 'console.log("B");' ]
);

// 11. Arrays - indexed
test('Arrays - indexed',
  '$arr = array(1, 2, 3);',
  [ 'arr = [1, 2, 3];' ]
);

// 12. Arrays - associative
test('Arrays - associative',
  "$map = array('a' => 1, 'b' => 2);",
  [ /map\s*=\s*\{\s*'a'\s*:\s*1,\s*'b'\s*:\s*2\s*\}/ ]
);

// 13. String interpolation (encapsed)
test('Interpolated string',
  '$name = "John"; $msg = "Hello, $name";',
  [ 'name = "John";', /msg\s*=\s*`Hello, \$\{name\}`/ ]
);

// 14. Return statement
test('Return statement',
  'function ok() { return true; }',
  [ 'export function ok() {', 'return true;' ]
);

// 15. Inline HTML -> __outputHtml
test('Inline HTML',
  '<?php ?>\n<div>Hi</div>\n<?php echo "X"; ?>',
  [ '__outputHtml([', '`<div>Hi</div>`', 'console.log("X");' ]
);

// 16. Equality operators
test('Equality operators',
  '$ok1 = (1 == 1); $ok2 = (2 != 3);',
  [ 'ok1 = (1 === 1);', 'ok2 = (2 !== 3);' ]
);

// 17. Property chain
test('Property chain',
  '$result = $user->profile->getName();',
  [ 'result = user.profile.getName();' ]
);

// 18. Concat with function call
test('Concat with function call',
  'echo "<label>" . foo() . "</label>";',
  [ 'console.log("<label>" + foo() + "</label>");' ]
);

// 19. Nested arrays (indexed inside associative)
test('Nested arrays',
  "$map = array('list' => array(1,2,3), 'x' => 5);",
  [ /map\s*=\s*\{\s*'list'\s*:\s*\[1, 2, 3\],\s*'x'\s*:\s*5\s*\}/ ]
);

// 20. Multiple statements and returns
test('Multiple statements and return',
  'function add($a, $b) { $c = $a + $b; return $c; }',
  [ 'export function add(a, b) {', 'c = a + b;', 'return c;' ]
);

// Run tests
runTests();
