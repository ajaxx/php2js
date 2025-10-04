# PHP to JavaScript Converter

A comprehensive tool for converting PHP code to JavaScript with automated syntax transformation and intelligent handling of PHP-specific constructs.

## Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```bash
# Convert a single file
node convert.mjs --src ./file.php --dst ./output

# Convert a directory
node convert.mjs --src ./php-files --dst ./js-files

# Convert with detailed logging
node convert.mjs --src ./php-files --dst ./js-files --log-level debug --stats
```

## Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--src <path>` | Source file or directory | `../../WordPress` |
| `--dst <path>` | Destination directory | `..` |
| `--recurse <bool>` | Enable directory recursion | `true` |
| `--no-recurse` | Disable directory recursion | - |
| `--stats` | Show processing statistics | `false` |
| `--log-level <level>` | Set log level (trace/debug/info/warn/error/fatal) | `info` |

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

## Documentation

- **[CONVERSION_FEATURES.md](CONVERSION_FEATURES.md)** - Complete feature list and examples
- **[MODULE_WRAPPER.md](MODULE_WRAPPER.md)** - IIFE wrapper pattern documentation
- **[LOGGING.md](LOGGING.md)** - Logging configuration and usage

## Examples

### Debug Mode
```bash
node convert.mjs --src ./wordpress --dst ./output --log-level debug --stats
```

### Quiet Mode (Errors Only)
```bash
node convert.mjs --src ./wordpress --dst ./output --log-level error
```

### Single File with Stats
```bash
node convert.mjs --src ./wp-login.php --dst ./output --stats
```

### Directory Without Recursion
```bash
node convert.mjs --src ./php-files --dst ./js-files --no-recurse
```

## Test Suite

Run the comprehensive test suite:

```bash
node test-all-features.mjs
```

Current test status: **44 passed, 3 failed** (47 total tests)
- The 3 failures are by-design IIFE wrapper tests

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
