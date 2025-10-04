# Module Wrapper Pattern

## Overview

The converter now wraps all converted PHP code in an IIFE (Immediately Invoked Function Expression) and provides selective exports. This creates clean, encapsulated modules that don't pollute the global scope.

## Structure

```javascript
// File header with metadata
//
// Converted from PHP: example.php
// Source path: example.php
// Generated: 2025-10-03 06:30:00
// ...
//

// Environment shims (available to all code)
const __ENV__ = { 
  isNode: typeof process !== 'undefined' && process.versions?.node, 
  isBrowser: typeof window !== 'undefined' 
};

// HTML output helper function
function __outputHtml(lines) {
  console.log(lines.join('\n'));
}

// Module wrapper - encapsulates all code
// The _ parameter provides access to environment variables (GET, POST, SERVER, etc.)
(function(_) {
  // All converted PHP code runs here
  // Variables, functions, classes, etc.
  
  function myFunction() {
    // Access superglobals via _
    const name = _.GET['name'];
    const email = _.POST['email'];
  }
  
  function anotherFunction() {
    // ...
  }
  
  const MY_CONSTANT = 'value';
  
  // Code execution
  // ...
  
})({
  GET: {},
  POST: {},
  SERVER: {},
  COOKIE: {},
  SESSION: {},
  REQUEST: {},
  FILES: {},
  ENV: process?.env || {}
});

// Selective exports (only what's needed externally)
export { myFunction, anotherFunction };
export { __ENV__, __outputHtml };
```

## How It Works

### 1. Environment Parameter (`_`)
The IIFE accepts a parameter `_` that provides access to PHP superglobals:

**PHP Superglobals → JavaScript:**
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
// PHP
$name = $_GET['name'];
$email = $_POST['email'];
```

```javascript
// JavaScript
name = _.GET['name'];
email = _.POST['email'];
```

The `_` object is passed when invoking the IIFE, with default empty objects for most properties and `process.env` for `ENV` in Node.js environments.

### 2. Function Collection
The converter scans the code for all `export function` declarations:
```javascript
export function login_header() { ... }
export function login_footer() { ... }
```

### 3. Export Removal
All `export` keywords are removed from the code:
```javascript
function login_header() { ... }  // No 'export' keyword
function login_footer() { ... }  // No 'export' keyword
```

### 4. IIFE Wrapping
All code is wrapped in an immediately invoked function with the `_` parameter:
```javascript
(function(_) {
  // All code here is scoped to this function
  function login_header() { ... }
  function login_footer() { ... }
  // Execution code...
})();
```

### 5. Selective Re-export
Only the collected functions are exported at the end:
```javascript
export { login_header, login_footer };
export { __ENV__, __outputHtml };
```

## Benefits

### Encapsulation
- **No global pollution**: Variables and functions don't leak to global scope
- **Isolated execution**: Code runs in its own scope
- **Clean namespace**: Only exports what's explicitly needed

### Selective Exports
- **Explicit API**: Clear what's available for import
- **Tree-shaking friendly**: Bundlers can optimize unused exports
- **Better documentation**: Exports show the public API

### Compatibility
- **ES Modules**: Works with modern import/export
- **Node.js**: Compatible with Node.js module system
- **Bundlers**: Works with Webpack, Rollup, etc.

## Example

### PHP Input
```php
<?php
function get_user($id) {
    return "User $id";
}

function save_user($id, $data) {
    // Save logic
}

$current_user = get_user(1);
echo $current_user;
?>
```

### JavaScript Output
```javascript
//
// Converted from PHP: user.php
// ...
//

const __ENV__ = { isNode: typeof process !== 'undefined' && process.versions?.node, isBrowser: typeof window !== 'undefined' };

function __outputHtml(lines) {
  console.log(lines.join('\n'));
}

// Module wrapper - encapsulates all code
(function() {

function get_user(id) {
    return "User " + id;
}

function save_user(id, data) {
    // Save logic
}

current_user = get_user(1);
console.log(current_user);

})();

// Selective exports
export { get_user, save_user };
export { __ENV__, __outputHtml };
```

### Usage in Another Module
```javascript
import { get_user, save_user } from './user.js';

const user = get_user(123);
save_user(123, { name: 'John' });
```

## Implementation Details

### Code Location
See `convert.mjs` lines 223-256:
- Lines 223-228: Collect exported function names
- Lines 230-232: Remove export keywords
- Lines 236-246: Create module wrapper prelude
- Lines 248-254: Create epilogue with selective exports

### Export Collection
Uses regex to find all exported functions:
```javascript
const functionMatches = js.matchAll(/export function (\w+)\(/g);
```

### Export Removal
Removes export keywords while preserving declarations:
```javascript
js = js.replace(/^export (function|class) /gm, '$1 ');
js = js.replace(/^export const /gm, 'const ');
```

## Notes

- Helper functions (`__ENV__`, `__outputHtml`) are always exported
- Constants defined with `define()` are converted to `const` and scoped
- Classes are also collected and can be exported
- The IIFE executes immediately, running all top-level code
- Error control operator `@` is converted to `/* @suppress-errors */` comment
- PHP `global` keyword statements are removed and variables are hoisted to IIFE scope
- `foreach` loops are converted to JavaScript `for...of` loops with `Object.entries()` for key-value iteration
- Alternative control structure syntax (if/endif, foreach/endforeach, while/endwhile) converted to standard braces
- Array append operator `$array[] = value;` converted to `array.push(value);`
- PHP superglobals (`$_GET`, `$_POST`, etc.) converted to `_.GET`, `_.POST`, etc.
