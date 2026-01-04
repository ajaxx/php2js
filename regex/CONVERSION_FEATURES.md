# PHP to JavaScript Converter - Features

## Recent Enhancements

### 1. Nested Array Support
Properly handles nested `array()` calls by processing from innermost to outermost:

**Example:**
```php
$config = array(
    'type' => 'info',
    'classes' => array('message', 'register'),
    'data' => array(
        'nested' => array('a', 'b', 'c')
    )
);
```
Converts to:
```javascript
config = { 
    'type' : 'info',
    'classes' : [ 'message', 'register' ],
    'data' : { 
        'nested' : [ 'a', 'b', 'c' ]
     }
 };
```

### 2. Equality Operators
Converts PHP's loose equality operators to JavaScript's strict operators for better type safety:
- `==` → `===`
- `!=` → `!==`
- `===` → `===` (unchanged)
- `!==` → `!==` (unchanged)

**Example:**
```php
if ($a == $b) { }
if ($x != $y) { }
```
Converts to:
```javascript
if (a === b) { }
if (x !== y) { }
```

### 3. Array Append Operator
Converts PHP's array append syntax to JavaScript's `push()` method:
- `$array[] = value;` → `array.push(value);`

**Example:**
```php
$items = array();
$items[] = 'first';
$items[] = 'second';
foreach ($data as $item) {
    $results[] = $item;
}
```
Converts to:
```javascript
items = [];
items.push('first');
items.push('second');
for (const item of data) {
    results.push(item);
}
```

### 4. PHP Superglobals via `_` Parameter
PHP superglobals are converted to use the `_` parameter passed to the IIFE:
- `$_GET` → `_.GET`
- `$_POST` → `_.POST`
- `$_SERVER` → `_.SERVER`
- `$_COOKIE` → `_.COOKIE`
- `$_SESSION` → `_.SESSION`
- `$_REQUEST` → `_.REQUEST`
- `$_FILES` → `_.FILES`
- `$_ENV` → `_.ENV`

**Example:**
```php
$name = $_GET['name'];
$email = $_POST['email'];
```
Converts to:
```javascript
name = _.GET['name'];
email = _.POST['email'];
```

### 5. HTML Embedding Support
Converts embedded HTML blocks in PHP files using a helper function:
- Detects HTML between `?>` and `<?php` tags
- Converts inline PHP expressions: `<?php echo $var; ?>` → `${var}`
- Converts short echo tags: `<?= $var ?>` → `${var}`
- **Collects all lines into an array** and passes to `__outputHtml()` function

**Example:**
```php
<?php $title = "Hello"; ?>
<h1><?= $title ?></h1>
<p>Welcome to the site</p>
```
Converts to:
```javascript
title = "Hello";
__outputHtml([
  `<h1>${title}</h1>`,
  `<p>Welcome to the site</p>`
]);
```

**Helper Function:**
```javascript
function __outputHtml(lines) {
  console.log(lines.join('\n'));
}
```

**Note:** The `__outputHtml()` helper function is automatically added to each converted file.

### 6. String Concatenation Operators
Converts PHP string concatenation to JavaScript:
- `.=` operator → `+=` operator
- `.` operator → `+` operator (context-aware to avoid breaking decimals and method calls)

**Important:** The conversion runs BEFORE `$` stripping and does NOT convert `->` method calls, ensuring object method access remains intact.

**Example:**
```php
$name = "John" . " " . "Doe";
$message = "Hello";
$message .= " World";
$user->getName();  // Method call preserved
```
Converts to:
```javascript
name = "John" + " " + "Doe";
message = "Hello";
message += " World";
user->getName();  // Still has -> at this stage (converted later in expressions)
```

### 7. Enhanced Require/Include Handling
Improved conversion of PHP require/include statements:
- Simple string literals: `require 'file.php'` → `import './file.js';`
- `__DIR__` patterns: `require __DIR__ . '/file.php'` → `import './file.js';`
- Complex constants: Generates TODO comments for manual handling
- Supports all variants: `require`, `require_once`, `include`, `include_once`

**Example:**
```php
require __DIR__ . '/config.php';
require_once ABSPATH . WPINC . '/class.php';
```
Converts to:
```javascript
import './config.js';
// TODO: import equivalent of ABSPATH + WPINC + '/class.php' (from require_once)
```

### 8. Magic Constants
Converts PHP magic constants to Node.js equivalents:
- `__DIR__` → `__dirname`
- `__FILE__` → `__filename`

### 9. Object and Static Operators
Converts PHP object access operators to JavaScript:
- `->` operator → `.` operator (object member access)
- `::` operator → `.` operator (static member access)

**Example:**
```php
$user->getName();
$user->email;
User::getInstance();
```
Converts to:
```javascript
user.getName();
user.email;
User.getInstance();
```

**Note:** This conversion happens AFTER string concatenation to avoid conflicts.

## Existing Features

### Core Conversions
- **Variables**: `$variable` → `variable`
- **Functions**: `function name()` → `export function name()`
- **Classes**: `class Name` → `export class Name`
- **Constants**: `define('NAME', value)` → `export const NAME = value;`
- **Echo/Print**: `echo $var;` → `console.log(var);`
- **Die/Exit**: `die('message');` → `throw new Error('message');`
- **Comments**: `# comment` → `// comment`
- **Arrays**: `array(1, 2)` → `[1, 2]`
- **Associative Arrays**: `array('key' => 'val')` → `{ key: 'val' }`
- **Boolean/Null**: `TRUE/FALSE/NULL` → `true/false/null`

### Superglobals
Marks superglobals for manual handling:
- `$_GET`, `$_POST`, `$_SERVER`, `$_COOKIE`, `$_SESSION`, `$_REQUEST`

## Module Structure

Each converted file is wrapped in a module structure:

```javascript
// Header comments and metadata

// Environment shims
const __ENV__ = { ... };

// HTML output helper
function __outputHtml(lines) { ... }

// Module wrapper - encapsulates all code
(function() {
  // All converted PHP code goes here
  // Functions, classes, and logic
})();

// Selective exports
export { function1, function2, function3 };
export { __ENV__, __outputHtml };
```

**Benefits:**
- **Encapsulation**: All code runs in isolated scope
- **Selective exports**: Only explicitly export what's needed
- **No global pollution**: Variables don't leak to global scope
- **Clean imports**: Other modules can import specific functions

## Installation

First, install dependencies:
```bash
npm install
```

## Usage

```bash
node convert.mjs --src <source-path> --dst <destination-dir> [--recurse true|false] [--no-recurse] [--stats]
```

### Command Line Options

- `--src <path>`: Source **file or directory** containing PHP files (default: `../../WordPress`)
  - If a file: converts that single file
  - If a directory: converts all PHP files in the directory
- `--dst <path>`: Destination directory for converted JS files (default: `..`)
- `--recurse <true|false|yes|1>`: Enable/disable directory recursion (default: `true`)
- `--no-recurse`: Shorthand to disable directory recursion
- `--stats`: Enable detailed processing statistics including P90 time (default: `false`)
- `--log-level <level>`: Set logging level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` (default: `info`)

### Logging

The converter uses **log4js** for comprehensive logging:
- **Console output**: Real-time conversion progress
- **Log file**: `php2js-conversion.log` with detailed information

See [LOGGING.md](LOGGING.md) for configuration details.

### Examples

```bash
# Convert a single file
node convert.mjs --src ./my-file.php --dst ./output

# Convert a directory with recursion (default)
node convert.mjs --src ./php-files --dst ./js-files

# Convert only files in the root directory (no subdirectories)
node convert.mjs --src ./php-files --dst ./js-files --no-recurse

# Explicitly enable recursion
node convert.mjs --src ./php-files --dst ./js-files --recurse true

# Enable detailed statistics
node convert.mjs --src ./php-files --dst ./js-files --stats

# Set log level to debug for detailed output
node convert.mjs --src ./php-files --dst ./js-files --log-level debug

# Quiet mode (errors only)
node convert.mjs --src ./php-files --dst ./js-files --log-level error

# Combine options
node convert.mjs --src ./php-files --dst ./js-files --no-recurse --stats
```

### Statistics Output

When `--stats` is enabled, you'll see detailed processing metrics:

```
Starting conversion... (recurse: true, stats: true)
Converted PHP->JS. Files processed: 150, written: 150, errors: 0

--- Processing Statistics ---
Total files: 150
Average time: 12.45ms
Min time: 3.21ms
Max time: 89.67ms
P90 time: 24.33ms
```

**Metrics explained:**
- **Total files**: Number of files successfully processed
- **Average time**: Mean processing time per file
- **Min time**: Fastest file conversion
- **Max time**: Slowest file conversion
- **P90 time**: 90th percentile - 90% of files processed faster than this time
```

## Notes

- The converter performs **light automated conversion**
- **Manual review is always required** for production code
- Complex PHP constructs may need manual refactoring
- WordPress-specific functions need runtime implementation
- All PHP functions are automatically collected and exported
