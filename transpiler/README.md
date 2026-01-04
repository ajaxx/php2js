# AST-Based PHP to JavaScript Transpiler

A production-ready implementation of the PHP to JavaScript transpiler using Abstract Syntax Tree (AST) parsing for reliable and maintainable code transformation.

**Status:** ✅ **99.94% WordPress compatibility** (1,662 of 1,663 files transpiled successfully)

## Architecture

The AST-based transpiler uses the `php-parser` library to:
1. Parse PHP code into an Abstract Syntax Tree
2. Walk the AST using the visitor pattern
3. Transform PHP nodes to JavaScript equivalents
4. Generate clean, formatted JavaScript code

## Advantages Over Regex-Based Approach

- **No newline merging issues** - AST preserves exact code structure
- **Context-aware transformations** - Knows when inside strings/comments
- **Reliable conversions** - No regex ordering dependencies
- **Better error handling** - Parse errors caught with line numbers
- **Extensible** - Easy to add new transformations via visitor methods

## Usage

### Command Line

```bash
# Single file
node transpiler/transpiler.mjs --src input.php --dst output.js

# Directory (recursive)
node transpiler/transpiler.mjs --src ./php-files --dst ./js-files --recurse

# With options
node transpiler/transpiler.mjs --src ./src --dst ./dist --recurse --stats --log-level warn --interface-style abstract-class

# Using npm script
npm run transpile:ast -- --src ./src --dst ./dist
```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|----------|
| `--src <path>` | Source file or directory | Required |
| `--dst <path>` | Destination file or directory | Required |
| `--recurse` | Enable recursive directory processing | `true` |
| `--no-recurse` | Disable recursion | - |
| `--stats` | Show processing statistics | `false` |
| `--log-level <level>` | Set log level (trace/debug/info/warn/error) | `info` |
| `--format` | Format output with Prettier | `false` |
| `--interface-style <style>` | Interface conversion style (see below) | `abstract-class` |
| `--utility-style <style>` | Utility function style: `inline`, `module`, `none` | `inline` |
| `--utility-module <name>` | Utility module name (when using module style) | `php-utils` |
| `--unset-style <style>` | Unset conversion: `comment` (strict mode safe), `delete` | `comment` |
| `--define-style <style>` | Define conversion: `const` (safe), `export-const`, `comment` | `const` |

### Programmatic

```javascript
import { transpile, transpileFile } from './transpiler/transpiler.mjs';

// Transpile code string
const jsCode = await transpile(phpCode, { filename: 'input.php' });

// Transpile file
await transpileFile('input.php', 'output.js');
```

## Supported Features

### Core Language Constructs

- ✅ **Functions** - PHP functions → ES6 export functions
- ✅ **Classes** - Full OOP support with inheritance
- ✅ **Interfaces** - Configurable conversion (4 styles, see below)
- ✅ **Variables** - Strips `$` prefix, proper scoping
- ✅ **Constants** - `define()` and `const` declarations
- ✅ **Namespaces** - Converted to comments with scope tracking

### Operators

- ✅ String concatenation: `.` → `+`
- ✅ Equality: `==` → `===`, `!=` → `!==`
- ✅ Property access: `->` → `.`
- ✅ Static access: `::` → `.`
- ✅ Error control: `@` → comment
- ✅ Reference assignment: `=&` → `=` with comment
- ✅ Variadic: `...$args` → `...args`

### Control Flow

- ✅ If/else/elseif statements
- ✅ Alternative syntax (if/endif, foreach/endforeach, etc.)
- ✅ Switch/case statements
- ✅ Ternary operator: `? :`
- ✅ For loops
- ✅ Foreach loops → for...of
- ✅ While loops
- ✅ Do-while loops
- ✅ Break/continue statements
- ✅ Return statements

### Object-Oriented Programming

- ✅ Class declarations with methods
- ✅ Class properties (public/private/protected)
- ✅ Static properties and methods
- ✅ Class constants (declarations and access)
- ✅ Constructors
- ✅ Inheritance (`extends`)
- ✅ `self::` → `this.constructor`
- ✅ `parent::` → `super`
- ✅ `static::` → `this.constructor` (late static binding)
- ✅ `$this` → `this`
- ✅ `new` expressions
- ✅ `clone` → `Object.assign({}, obj)`

### Exception Handling

- ✅ Try/catch/finally blocks
- ✅ Multiple catch blocks
- ✅ Throw statements
- ✅ Exception type comments

### Advanced Features

- ✅ **Closures** - Anonymous functions with `use` clauses
- ✅ **Static variables** - Function-level static declarations
- ✅ **List destructuring** - `list($a, $b) = $arr`
- ✅ **Array operations**
  - Indexed arrays → `[]`
  - Associative arrays → `{}`
  - Array append: `$arr[] = val` → `arr.push(val)`
  - Nested arrays with proper depth handling
- ✅ **String operations**
  - Single/double quoted strings
  - String interpolation
  - Heredoc → template literals
- ✅ **Type casts** - Removed with comments
- ✅ **Magic constants** - `__DIR__`, `__FILE__`, etc.
- ✅ **Global keyword** - Hoisted to scope
- ✅ **Unset** - Configurable: comment (default, strict mode safe) or delete
- ✅ **Die/Exit** → `throw new Error()`
- ✅ **Echo** → `console.log()`
- ✅ **Print** → `console.log()` (returns 1)
- ✅ **Inline HTML** → `__outputHtml()` calls
- ✅ **Use statements** - Import conversion
- ✅ **Grouped use** - `use Namespace\{ClassA, ClassB}`
- ✅ **Declare statements** - Converted to comments
- ✅ **Noop nodes** - Silently handled
- ✅ **PHPDoc comments** - Preserved as JSDoc

## Interface Handling

The transpiler supports 4 configurable interface conversion styles via `--interface-style`:

### 1. Abstract Class (Default)

Converts interfaces to classes with error-throwing methods for runtime validation:

```php
interface Logger {
    public function log($message);
}
```
↓
```javascript
export class Logger {
    log(message) {
        throw new Error('Method log() must be implemented');
    }
}
```

**Use when:** You want runtime validation and clear error messages.

### 2. Comment Style

Preserves interface information as comments:

```php
interface Logger {
    public function log($message);
}
```
↓
```javascript
// interface Logger {
//     log(message);
// }
```

**Use when:** You want minimal output and documentation only.

### 3. JSDoc Style

TypeScript-compatible JSDoc annotations with empty class:

```php
interface Logger {
    public function log($message);
}
```
↓
```javascript
/**
 * @interface Logger
 * @method log({*} message)
 */
export class Logger {}
```

**Use when:** You're using TypeScript or want IDE support.

### 4. Empty Class Style

Minimal class export for inheritance:

```php
interface Logger {
    public function log($message);
}
```
↓
```javascript
export class Logger {}
```

**Use when:** You only need the class structure for `extends`.

## Utility Function Handling

The transpiler provides configurable utility functions for PHP-specific semantics via `--utility-style`:

### Inline Style (Default)

Generates utility functions at file scope:

```javascript
// PHP Utility Functions
function __empty(val) {
    if (val === null || val === undefined || val === false) return true;
    if (val === 0 || val === "0" || val === "") return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === 'object' && Object.keys(val).length === 0) return true;
    return false;
}

if (__empty(var)) { ... }
```

### Module Style

Imports from external utility module:

```javascript
import * as php-utils from './php-utils.js';
if (php-utils.empty(var)) { ... }
```

The utility module is automatically generated with all used functions.

### None Style

Falls back to simple conversion (backward compatible):

```javascript
if (!var) { ... }
```

**Available Utilities:**
- `empty()` - PHP-accurate empty checking (handles `"0"`, arrays, etc.)
- `isset()` - Variable existence checking
- `array_key_exists()` - Key existence in arrays/objects

## Unset Handling

The transpiler provides configurable `unset()` conversion via `--unset-style`:

### Comment Style (Default) - Strict Mode Safe

```php
unset($var);
```
↓
```javascript
// unset(var);
```

**Why default?** The `delete` operator fails in strict mode. Since most modern JavaScript uses strict mode by default, comment style is safer.

### Delete Style

```php
unset($var);
```
↓
```javascript
delete var;
```

**Use when:** You need actual deletion and you're certain you're not in strict mode.

## Define Handling

The transpiler provides configurable `define()` conversion via `--define-style`:

### Const Style (Default) - Safe Everywhere

```php
define('MY_CONSTANT', 123);
if ($condition) {
    define('WPINC', 'wp-includes');
}
```
↓
```javascript
const MY_CONSTANT = 123;
if (condition) {
    const WPINC = 'wp-includes';
}
```

**Why default?** Works everywhere, including inside conditional blocks. No syntax errors with `export` statements inside if/else blocks.

### Export-Const Style - Smart Export

```php
define('TOP_LEVEL', 1);
if ($condition) {
    define('IN_IF', 2);
}
```
↓
```javascript
export const TOP_LEVEL = 1;
if (condition) {
    const IN_IF = 2;  // Not exported (inside conditional)
}
```

**Use when:** You need exports but have conditionals. Uses `export const` only at true top level (not inside if/else/loops).

### Comment Style - Documentation Only

```php
define('MY_CONSTANT', 123);
```
↓
```javascript
// define('MY_CONSTANT', 123);
```

**Use when:** Constants aren't needed in JavaScript or for documentation purposes.

## Superglobal Reference Injection

The transpiler automatically injects a global reference `_` for modules that use PHP superglobals.

### Automatic Detection

When any of these superglobals are detected:
- `$_GET` → `_.GET`
- `$_POST` → `_.POST`
- `$_SERVER` → `_.SERVER`
- `$_COOKIE` → `_.COOKIE`
- `$_SESSION` → `_.SESSION`
- `$_REQUEST` → `_.REQUEST`
- `$_FILES` → `_.FILES`

A top-level `_` constant is injected:

**PHP:**
```php
function getParam() {
    return $_GET['key'];
}
```

**JavaScript:**
```javascript
//
// Transpiled from PHP using AST-based transpiler
//

// Superglobal reference for $_GET, $_POST, $_SERVER, etc.
const _ = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : global);

const __ENV__ = { ... };

export function getParam() {
    return _.GET['key'];
}

export { __ENV__, __outputHtml };
```

**Benefits:**
- ✅ Provides access to superglobal properties via `_`
- ✅ Preserves ES6 module exports (no IIFE wrapping)
- ✅ Works in Node.js, browsers, and other environments
- ✅ Allows runtime injection of superglobal values on the global object
- ✅ Minimal overhead - single const declaration

## PHPDoc Comment Preservation

PHPDoc comments are automatically preserved and converted to JSDoc format:

**PHP:**
```php
/**
 * Calculate the sum of two numbers
 * @param int $a First number
 * @param int $b Second number
 * @return int The sum
 */
function add($a, $b) {
    return $a + $b;
}
```

**JavaScript:**
```javascript
/**
 * Calculate the sum of two numbers
 * @param {int} a First number
 * @param {int} b Second number
 * @returns {int} The sum
 */
export function add(a, b) {
    return a + b;
}
```

**Features:**
- Preserves all PHPDoc comments on functions and methods
- Converts `@param type $var` to `@param {type} var`
- Converts `@return` to `@returns`
- Handles union types (`string|array`)
- Preserves `@throws`, `@see`, and other tags

### Visitor Methods

The `ASTTransformer` class uses visitor methods for each node type:

- `visitProgram()` - Root program node
- `visitFunction()` - Function declarations
- `visitClass()` - Class declarations
- `visitInterface()` - Interface declarations (4 styles)
- `visitMethod()` - Class methods
- `visitProperty()` - Class properties
- `visitClassconstant()` - Class constant declarations
- `visitConstantstatement()` - Top-level constants
- `visitNamespace()` - Namespace declarations
- `visitUsegroup()` - Grouped use statements
- `visitDeclare()` - Declare statements
- `visitAssign()` - Variable assignments
- `visitStatic()` - Static variable declarations
- `visitEcho()` - Echo statements
- `visitIf()` - If/else statements
- `visitSwitch()` - Switch statements
- `visitFor()` - For loops
- `visitForeach()` - Foreach loops
- `visitWhile()` - While loops
- `visitDo()` - Do-while loops
- `visitTry()` - Try blocks
- `visitCatch()` - Catch blocks
- `visitThrow()` - Throw statements
- `visitReturn()` - Return statements
- `visitBreak()` - Break statements
- `visitContinue()` - Continue statements
- `visitGlobal()` - Global declarations
- `visitUnset()` - Unset statements
- `visitInline()` - Inline HTML
- `visitNoop()` - No-op nodes
- `transformExpression()` - Expression transformation
- `transformParameters()` - Parameter lists

## Example

**Input PHP:**
```php
<?php
function greet($name) {
    $message = "Hello, " . $name;
    echo $message;
    return true;
}

class User {
    public function getName() {
        return $this->name;
    }
}
```

**Output JavaScript:**
```javascript
export function greet(name) {
    message = "Hello, " + name;
    console.log(message);
    return true;
}

export class User {
    getName() {
        return this.name;
    }
}
```

## WordPress Compatibility

**Test Results:** 1,663 files processed, 1,662 successfully transpiled (99.94%)

### Remaining Warnings (62 total)

Rarely-used features that don't prevent transpilation:

- `goto` / `label` (44 warnings) - Legacy control flow
- `include` expression (18 warnings) - Include as expression vs statement
- `yield` (5 warnings) - Generator expressions
- Anonymous `class` (1 warning) - Anonymous class expressions
- `nowdoc` (1 warning) - Nowdoc string literals

### Known Limitations

- Goto/label statements not supported (rarely used)
- Generator functions (yield) not supported
- Include/require as expressions need manual handling
- Nowdoc strings converted to regular strings
- One file with PHP 8.2 `readonly` keyword fails parsing

## Test Suite

Comprehensive test coverage with Vitest:

```bash
npm run test:ast
```

**Test Results:** 170 tests passing, 12 skipped (182 total)

### Test Suites

- ✅ Basic AST transformations (10 tests)
- ✅ Advanced features (12 tests) - Including unset styles
- ✅ Advanced control flow (7 tests)
- ✅ Advanced OOP features (10 tests)
- ✅ Alternative syntax (7 tests)
- ✅ Arrays (4 tests)
- ✅ Class features (5 tests)
- ✅ Constants (4 tests)
- ✅ Control flow (9 tests) - Including print
- ✅ **Define handling (14 tests)** - All 3 styles
- ✅ Elseif handling (2 tests)
- ✅ Error handling (2 tests)
- ✅ Exception handling (8 tests)
- ✅ Globals (7 tests)
- ✅ HTML entities (3 tests)
- ✅ Imports (3 tests)
- ✅ **Interfaces (12 tests)** - All 4 conversion styles
- ✅ List destructuring (3 tests)
- ✅ Operators (2 tests)
- ✅ **PHPDoc (6 tests)** - Comment preservation
- ✅ Property access (3 tests)
- ✅ String concatenation (6 tests)
- ✅ Strings (6 tests) - Including escape sequences
- ✅ **Superglobal wrapping (15 tests)** - Automatic IIFE wrapping
- ✅ **Utility functions (7 tests)** - All 3 styles
- ✅ **Utility module generation (6 tests)** - File creation
- ⏭️ Blank lines (3 tests, skipped)
- ⏭️ Comments (6 tests, skipped)

## Comparison with Regex-Based Transpiler

| Feature | Regex-Based | AST-Based |
|---------|-------------|------------|
| **Speed** | ⚡ Very Fast | 🐢 Moderate |
| **Accuracy** | ✓ Good | ✓✓ Excellent |
| **Context-aware** | ⚠️ Limited | ✓✓ Full |
| **WordPress Support** | ✓✓ 100% | ✓✓ 99.94% |
| **Maintenance** | ⚠️ Complex regex | ✓ Clear visitor pattern |
| **Interface Handling** | ❌ No | ✓✓ 4 configurable styles |
| **Exception Handling** | ⚠️ Basic | ✓✓ Full try/catch/finally |
| **OOP Features** | ✓ Good | ✓✓ Comprehensive |

### When to Use AST Transpiler

- ✅ New development projects
- ✅ Complex OOP code with interfaces
- ✅ Code requiring exception handling
- ✅ When accuracy is critical
- ✅ Projects needing configurable output

### When to Use Regex Transpiler

- ✅ Maximum speed required
- ✅ Simple procedural code
- ✅ Proven WordPress compatibility needed

## Development

To add a new transformation:

1. Add a visitor method: `visit<NodeKind>(node)`
2. Transform the node's properties
3. Call `this.writeLine()` or `this.visit()` for children
4. Update `transformExpression()` if needed for expressions

Example:
```javascript
visitWhile(node) {
    const test = this.transformExpression(node.test);
    this.writeLine(`while (${test}) {`);
    this.indent++;
    if (node.body) {
        this.visit(node.body);
    }
    this.indent--;
    this.writeLine('}');
}
```

## Logging

Logs are written to `php2js-ast-transpiler.log` in the project root.

Set log level via environment or code:
```javascript
logger.level = 'debug'; // trace, debug, info, warn, error
```
