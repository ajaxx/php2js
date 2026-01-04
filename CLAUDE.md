# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

php2js is a comprehensive PHP to JavaScript converter with two transpiler implementations:

1. **Regex-based transpiler** (`regex/convert.mjs`) - Fast, proven, handles bulk conversion
2. **AST-based transpiler** (`transpiler/transpiler.mjs`) - Accurate, context-aware, ideal for complex code

Both transpilers are maintained in parallel and serve different use cases.

## Common Commands

### Testing

```bash
# Run all tests (both regex and AST)
npm run test:all

# Run regex transpiler tests (legacy test suite)
npm test
# or
npm run test:regex:legacy
# or
node regex/test-all-features.mjs

# Run regex transpiler tests (vitest)
npm run test:regex

# Run AST transpiler tests (vitest)
npm run test:ast
```

### Conversion

```bash
# Regex-based transpiler
npm run convert -- --src ./input.php --dst ./output

# AST-based transpiler
npm run transpile input.php output.js
```

### Development

```bash
# Install dependencies
npm install

# Run with debugging
node regex/convert.mjs --src ./test --dst ./output --log-level debug --stats

# Format output (requires prettier)
node transpiler/transpiler.mjs --src ./test --dst ./output --format
```

## High-Level Architecture

### Two-Transpiler Design

The project maintains **two independent transpiler implementations** that convert PHP to JavaScript:

**Regex-based transpiler** (`regex/convert.mjs`):
- Uses sequential regex transformations on text
- Very fast (~8s for 1,663 files)
- 100% WordPress compatibility
- Complex regex chains with ordering dependencies
- Best for: bulk conversion, proven compatibility, maximum speed

**AST-based transpiler** (`transpiler/transpiler.mjs`):
- Uses php-parser library to build Abstract Syntax Tree
- Visitor pattern for node transformations
- Context-aware transformations
- 99.94% WordPress compatibility (1,662/1,663 files)
- Best for: accuracy, complex OOP, interface handling, new development

### AST Transpiler Architecture

The AST transpiler is built around the **Visitor Pattern**:

1. **Parser** (`php-parser` library) - Converts PHP source to AST
2. **ASTTransformer** class - Walks AST nodes and generates JavaScript
3. **Visitor methods** - Each `visit*()` method handles one node type (e.g., `visitClass()`, `visitFunction()`)
4. **Expression transformer** - `transformExpression()` handles nested expressions recursively
5. **Utility manager** - Tracks and generates PHP-specific utility functions

**Key classes:**
- `ASTTransformer` (transpiler.mjs) - Main visitor that walks the AST
- `UtilityManager` (php-utils-manager.mjs) - Manages PHP utility functions like `empty()`, `isset()`

**Configurable features:**
- Interface conversion (4 styles: abstract-class, comment, jsdoc, empty-class)
- Utility functions (3 styles: inline, module, none)
- Unset handling (2 styles: comment [strict-safe], delete)
- Define handling (3 styles: const, export-const, comment)

### Module Output Pattern

Both transpilers wrap converted code in a consistent module structure:

```javascript
// Header comment with metadata
import './dependencies.js';

// Environment detection
const __ENV__ = { isNode: ..., isBrowser: ... };

// HTML output helper (for inline PHP HTML)
function __outputHtml(lines) { ... }

// Superglobal injection (AST transpiler)
// OR IIFE wrapper (regex transpiler)
const _ = globalThis || window || global; // AST style
// OR
(function(_) {                             // Regex style
  // Global variables hoisted here
  let var1, var2;

  // Converted code

})({ GET: {}, POST: {}, ... });

// Selective exports
export { function1, function2, __ENV__, __outputHtml };
```

### Test Architecture

**Vitest test suites** (both transpilers):
- Located in `__tests__/` subdirectories
- Each test file covers a specific feature domain
- Use `vitest` for modern test execution
- Tests verify input PHP → expected JavaScript output

**Legacy test suite** (regex only):
- `regex/test-all-features.mjs` - Original comprehensive test runner
- 59 passing, 3 intentional failures (IIFE wrapper tests)
- Uses simple string matching for validation

### Key Design Decisions

**Why two transpilers?**
- Regex transpiler: proven production stability, maximum speed
- AST transpiler: better maintainability, extensibility for new features
- Both serve different use cases - choose based on requirements

**Superglobal handling:**
- PHP superglobals (`$_GET`, `$_POST`, etc.) → JavaScript `_.GET`, `_.POST`
- AST transpiler: injects `const _` at top level (preserves ES6 exports)
- Regex transpiler: wraps in IIFE with `_` parameter (breaks exports)

**Interface conversion (AST only):**
- PHP interfaces have no JavaScript equivalent
- Four configurable strategies to handle different needs
- Default: abstract-class (runtime validation with error-throwing methods)

**Utility functions (AST only):**
- PHP-specific functions like `empty()` need JavaScript implementations
- Three modes: inline (default), module import, or none
- Tracked per-file to avoid generating unused utilities

## Important Implementation Notes

### When modifying the AST transpiler:

1. **Add visitor methods** for new node types following the pattern:
   ```javascript
   visitNodeType(node) {
       // Transform node properties
       // Write output via this.writeLine() or this.write()
       // Visit children via this.visit(childNode)
   }
   ```

2. **Update transformExpression()** for new expression types - this is the central expression handler

3. **Track state in ASTTransformer** - use instance variables for scope, indentation, flags

4. **Use utility manager** - call `this.utilityManager.useFunction('empty')` to track utility usage

5. **Test thoroughly** - add test cases in `transpiler/__tests__/` matching the feature domain

### When modifying the regex transpiler:

1. **Order matters** - regex transformations are sequential, order is critical

2. **Avoid breaking existing regexes** - the regex chains are complex and interdependent

3. **Test with WordPress** - the regex transpiler is optimized for WordPress compatibility

4. **Consider newline handling** - some transformations merge/preserve lines differently

### File naming conventions:

- PHP input: `*.php`
- JavaScript output: `*.js` (same basename, `.php` → `.js`)
- Test files: `*.spec.mjs` (vitest) or `test-*.mjs` (legacy)
- Source files: `*.mjs` (ES modules)

### Logging:

- Both transpilers use log4js
- Regex transpiler: logs to `php2js-conversion.log`
- AST transpiler: logs to `php2js-ast-transpiler.log`
- Log levels: trace, debug, info (default), warn, error

## Known Issues & Limitations

### AST Transpiler:
- `goto`/`label` statements not supported (44 warnings in WordPress)
- Generator functions (`yield`) not supported (5 warnings)
- `include`/`require` as expressions need manual handling (18 warnings)
- Anonymous classes partially supported (1 warning)
- Nowdoc strings converted to regular strings (1 warning)

### Regex Transpiler:
- Some newline preservation issues (handled by post-processing)
- No interface handling
- Limited context awareness (can't distinguish strings from code)

### Both:
- Complex PHP expressions may need manual review
- Dynamic require/include paths generate TODO comments
- Some PHP-specific functions need JavaScript equivalents or polyfills
