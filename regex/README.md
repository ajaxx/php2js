# Regex-Based PHP to JavaScript Converter

This is the original regex-based implementation of the PHP to JavaScript transpiler. It uses pattern matching and string replacement for code transformation.

## Overview

The regex-based converter (`convert.mjs`) processes PHP files using a series of regular expression transformations to convert PHP syntax to JavaScript. This approach is fast and handles the majority of WordPress PHP code successfully.

## Usage

### Command Line

```bash
# From project root
node regex/convert.mjs --src <source> --dst <destination> [options]

# Example: Convert single file
node regex/convert.mjs --src input.php --dst output.js

# Example: Convert directory recursively
node regex/convert.mjs --src D:\Src\Wordpress --dst D:\Src\Wordpress-JS --recurse true

# Example: With formatting
node regex/convert.mjs --src input.php --dst output.js --format
```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--src <path>` | Source file or directory | `../../WordPress` |
| `--dst <path>` | Destination directory | `..` |
| `--recurse <bool>` | Enable directory recursion | `true` |
| `--no-recurse` | Disable directory recursion | - |
| `--stats` | Show processing statistics | `false` |
| `--log-level <level>` | Set log level (trace/debug/info/warn/error/fatal) | `info` |
| `--format` | Format output with Prettier (requires prettier package) | `false` |

### NPM Scripts

```bash
# Run converter
npm run convert -- --src input.php --dst output.js

# Run tests
npm test
```

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
- ✅ Context-aware string/comment detection
- ✅ Post-processing to fix merged comment lines

## Architecture

The converter uses a pipeline of transformations:

1. **Normalize line endings**
2. **Extract global keyword variables**
3. **Transform embedded HTML blocks**
4. **Remove PHP tags**
5. **Convert PHP language constructs** (echo, require, die, etc.)
6. **Convert PHP syntax** (operators, arrays, loops, etc.)
7. **Convert declarations** (functions, classes)
8. **Post-process** (fix merged lines)
9. **Organize output** (wrap in IIFE, add exports)

### Key Functions

- `transformPhpToJs()` - Main transformation pipeline
- `convertPhpConstructs()` - Converts echo, require, die, etc.
- `convertPhpSyntax()` - Converts operators, variables, arrays
- `convertDeclarations()` - Converts functions and classes
- `organizeOutput()` - Wraps code in IIFE with exports
- `fixMergedCommentLines()` - Post-processing to fix formatting issues

## Known Limitations

### Issues
- **Newline merging** - Some block comments lose trailing newlines (post-processor attempts to fix)
- **Reserved words** - JavaScript reserved words (like `public`) need manual review
- **Complex expressions** - May require manual review
- **Associative arrays** - Marked with `/* TODO: object */` for review
- **Dynamic paths** - require/include with dynamic paths generate TODO comments

### Workarounds
- Post-processing step attempts to fix merged comment lines
- Use `--format` flag for Prettier formatting
- Manual review recommended for complex files

## Documentation

- **[CONVERSION_FEATURES.md](CONVERSION_FEATURES.md)** - Complete feature list and examples
- **[MODULE_WRAPPER.md](MODULE_WRAPPER.md)** - IIFE wrapper pattern documentation
- **[LOGGING.md](LOGGING.md)** - Logging configuration and usage
- **[OPERATOR_CONVERSION.md](OPERATOR_CONVERSION.md)** - Operator transformation details
- **[HTML_CONVERSION_IMPROVEMENT.md](HTML_CONVERSION_IMPROVEMENT.md)** - HTML handling details
- **[REFACTORING_NOTES.md](REFACTORING_NOTES.md)** - Development notes

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

## Performance

- **Speed**: Fast - processes 1,663 WordPress files in ~8 seconds
- **Accuracy**: Good - handles most WordPress PHP successfully
- **Reliability**: Moderate - some edge cases require manual review

## Comparison with AST Transpiler

| Feature | Regex-Based | AST-Based |
|---------|-------------|-----------|
| Speed | ⚡ Very Fast | 🐢 Slower |
| Accuracy | ✓ Good | ✓✓ Excellent |
| Context-aware | ⚠️ Limited | ✓✓ Full |
| Newline issues | ⚠️ Some | ✓ None |
| Maintenance | ⚠️ Complex | ✓ Clear |
| Completeness | ✓✓ Full | ⚠️ Growing |

**Use regex-based for:**
- Bulk WordPress conversion
- Maximum speed
- Proven transformations

**Use AST-based for:**
- New development
- Complex nesting
- Critical accuracy

## Test Suite

Run the comprehensive test suite:

```bash
npm test
# or
node test-all-features.mjs
```

Current test status: **59 passed, 3 failed** (62 total tests)

The test suite is located in the regex folder and tests all regex-based conversion features.

## Development

To add a new transformation:

1. Add a helper function (e.g., `convertNewFeature()`)
2. Call it in the appropriate pipeline stage
3. Add logging for debugging
4. Add tests in `test-all-features.mjs`

Example:
```javascript
function convertNewFeature(js) {
    logger.debug('  convertNewFeature: Processing...');
    const before = js;
    
    js = js.replace(/pattern/g, 'replacement');
    
    if (js !== before) {
        logger.debug('    Converted X features');
    }
    
    return js;
}
```

## Logging

Logs are written to `php2js-conversion.log` in the project root.

Set log level:
```bash
node regex/convert.mjs --log-level debug
```

Levels: trace, debug, info, warn, error, fatal

## Contributing

When modifying the regex-based converter:
1. Test on WordPress files
2. Run the test suite
3. Check for newline/formatting issues
4. Update documentation
5. Consider if AST-based approach would be better for the feature
