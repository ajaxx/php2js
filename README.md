# PHP to JavaScript Converter

A comprehensive tool for converting PHP code to JavaScript with two transpiler implementations:
- **Regex-based** - Fast, proven, handles bulk WordPress conversion
- **AST-based** - Accurate, context-aware, ideal for complex code

## Project Structure

```
php2js/
├── regex/              # Regex-based transpiler (original)
│   ├── convert.mjs     # Main converter
│   └── *.md            # Documentation
├── transpiler/         # AST-based transpiler (new)
│   ├── transpiler.mjs  # AST converter
│   └── README.md       # Documentation
├── test/               # Test files
└── README.md           # This file
```

## Quick Start

### Installation

```bash
npm install
```

### Basic Usage

**Regex-based converter (recommended for bulk conversion):**
```bash
# Convert a single file
node regex/convert.mjs --src ./file.php --dst ./output

# Convert a directory
node regex/convert.mjs --src ./php-files --dst ./js-files

# Convert with detailed logging
node regex/convert.mjs --src ./php-files --dst ./js-files --log-level debug --stats

# Convert with Prettier formatting
node regex/convert.mjs --src ./php-files --dst ./js-files --format

# Or use npm script
npm run convert -- --src ./file.php --dst ./output
```

**AST-based transpiler (recommended for accuracy):**
```bash
# Convert a single file
node transpiler/transpiler.mjs input.php output.js

# Or use npm script
npm run transpile input.php output.js
```

## Command-Line Options

### Common Options (Both Transpilers)

| Option | Description | Default |
|--------|-------------|---------|
| `--src <path>` | Source file or directory | Required |
| `--dst <path>` | Destination directory | Required |
| `--recurse <bool>` | Enable directory recursion | `true` |
| `--no-recurse` | Disable directory recursion | - |
| `--stats` | Show processing statistics | `false` |
| `--log-level <level>` | Set log level (trace/debug/info/warn/error/fatal) | `info` |
| `--format` | Format output with Prettier (requires prettier package) | `false` |

### AST Transpiler Only

| Option | Description | Default |
|--------|-------------|---------|
| `--interface-style <style>` | Interface conversion: `abstract-class`, `comment`, `jsdoc`, `empty-class` | `abstract-class` |
| `--utility-style <style>` | Utility function style: `inline`, `module`, `none` | `inline` |
| `--utility-module <name>` | Utility module name (when using module style) | `php-utils` |
| `--unset-style <style>` | Unset conversion: `comment` (strict mode safe), `delete` | `comment` |
| `--define-style <style>` | Define conversion: `const` (safe), `export-const`, `comment` | `const` |

## Features

### Core Conversions
- ✅ Variable names (`$var` → `var`)
- ✅ String concatenation (`.` → `+`)
- ✅ Equality operators (`==` → `===`, `!=` → `!==`)
- ✅ Object operators (`->` → `.`, `::` → `.`)
- ✅ Arrays (`array()` → `[]` or `{}`)
- ✅ Nested arrays with proper depth handling
- ✅ `foreach` loops → `for...of` loops
- ✅ `echo`/`print` → `console.log()`
- ✅ `die`/`exit` → `throw new Error()`
- ✅ Alternative syntax (if/endif, foreach/endforeach, etc.)
- ✅ Type casts removal
- ✅ Magic constants (`__DIR__`, `__FILE__`)
- ✅ Superglobals (`$_GET`, `$_POST`, etc.) → `_.GET`, `_.POST`
- ✅ Array append operator (`$arr[] = val` → `arr.push(val)`)

### Advanced Features
- ✅ Global variable hoisting to IIFE scope
- ✅ Module wrapper with IIFE pattern
- ✅ ES module imports from require/include
- ✅ HTML embedding support
- ✅ Blank line preservation
- ✅ Comment preservation
- ✅ Property access detection
- ✅ Method call support in foreach loops

### Logging
- ✅ log4js integration
- ✅ Console and file output
- ✅ Configurable log levels
- ✅ Processing statistics
- ✅ Error tracking with stack traces

## Transpiler Comparison

| Feature | Regex-Based | AST-Based |
|---------|-------------|-----------|
| **Speed** | ⚡ Very Fast (~8s for 1,663 files) | 🐢 Moderate (parsing overhead) |
| **Accuracy** | ✓ Good | ✓✓ Excellent |
| **Context-aware** | ⚠️ Limited | ✓✓ Full |
| **WordPress Support** | ✓✓ 100% | ✓✓ 99.94% (1,662/1,663) |
| **Newline issues** | ⚠️ Some (with post-processing) | ✓ None |
| **Maintenance** | ⚠️ Complex regex chains | ✓ Clear visitor pattern |
| **Interface Handling** | ❌ No | ✓✓ 4 configurable styles |
| **Exception Handling** | ⚠️ Basic | ✓✓ Full try/catch/finally |
| **OOP Features** | ✓ Good | ✓✓ Comprehensive |
| **Use case** | Maximum speed, simple code | Complex OOP, accuracy-critical |

## Documentation

### Regex-Based Transpiler
- **[regex/README.md](regex/README.md)** - Regex transpiler documentation
- **[regex/CONVERSION_FEATURES.md](regex/CONVERSION_FEATURES.md)** - Complete feature list
- **[regex/MODULE_WRAPPER.md](regex/MODULE_WRAPPER.md)** - IIFE wrapper pattern
- **[regex/LOGGING.md](regex/LOGGING.md)** - Logging configuration
- **[regex/OPERATOR_CONVERSION.md](regex/OPERATOR_CONVERSION.md)** - Operator details
- **[regex/HTML_CONVERSION_IMPROVEMENT.md](regex/HTML_CONVERSION_IMPROVEMENT.md)** - HTML handling
- **[regex/REFACTORING_NOTES.md](regex/REFACTORING_NOTES.md)** - Development notes

### AST-Based Transpiler
- **[transpiler/README.md](transpiler/README.md)** - AST transpiler documentation

## Examples

### Debug Mode
```bash
node regex/convert.mjs --src ./wordpress --dst ./output --log-level debug --stats
```

### Quiet Mode (Errors Only)
```bash
node regex/convert.mjs --src ./wordpress --dst ./output --log-level error
```

### Single File with Stats
```bash
node regex/convert.mjs --src ./wp-login.php --dst ./output --stats
```

### Directory Without Recursion
```bash
node regex/convert.mjs --src ./php-files --dst ./js-files --no-recurse
```

## Test Suite

### Regex-Based Transpiler Tests

```bash
npm test
# or
node regex/test-all-features.mjs
```

Current test status: **59 passed, 3 failed** (62 total tests)
- The 3 failures are by-design IIFE wrapper tests

### AST-Based Transpiler Tests

```bash
npm run test:ast
```

Current test status: **170 passed, 12 skipped** (182 total tests)
- Comprehensive coverage of all PHP language features
- 12 tests for interface handling (all 4 conversion styles)
- 13 tests for utility functions (inline, module, none styles)
- 6 tests for PHPDoc comment preservation
- 14 tests for define handling (const, export-const, comment styles)
- 12 tests for unset handling (comment and delete styles)
- 15 tests for superglobal wrapping (automatic IIFE scoping)
- Skipped tests are for future enhancements (blank lines, comments)

## Output Structure

Each converted file includes:

```javascript
// Header with metadata
import './dependencies.js';

// Environment shims
const __ENV__ = { isNode: ..., isBrowser: ... };

// HTML output helper
function __outputHtml(lines) { ... }

// Module wrapper with _ parameter for superglobals
(function(_) {
  // Global variables hoisted here
  let var1, var2;
  
  // Converted PHP code
  // ...
  
})({
  GET: {},
  POST: {},
  SERVER: {},
  // ... other superglobals
});

// Selective exports
export { function1, function2 };
export { __ENV__, __outputHtml };
```

## Log Output

### INFO Level (Default)
```
[2025-10-03T21:07:29.812] [INFO] php2js - Starting conversion...
[2025-10-03T21:07:29.813] [INFO] php2js - Source: D:\Src\php-files
[2025-10-03T21:07:29.813] [INFO] php2js - Destination: D:\Src\js-files
[2025-10-03T21:07:29.819] [INFO] php2js - Converted: file.php -> file.js
[2025-10-03T21:07:29.820] [INFO] php2js - Conversion complete. Files processed: 1, written: 1, errors: 0
```

### DEBUG Level
Includes all INFO messages plus:
```
[2025-10-03T21:07:29.814] [DEBUG] php2js - Processing: D:\Src\file.php
[2025-10-03T21:07:29.820] [DEBUG] php2js - Processing time: 5.42ms
```

## Known Limitations

- Complex PHP expressions may require manual review
- Associative arrays marked with `/* TODO: object */` for review
- Dynamic require/include paths generate TODO comments
- Some PHP-specific functions need JavaScript equivalents

## License

MIT

## Contributing

This is an automated conversion tool. Manual review of converted code is always recommended.
