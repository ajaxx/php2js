# HTML Conversion Improvement - Array-Based Function Call

## Problem
Previously, embedded HTML was converted into a single multi-line template literal wrapped in one `console.log()` statement. This made the output harder to read and debug.

## Solution
HTML is now converted by collecting all lines into an array and passing them to a helper function `__outputHtml()` that concatenates and outputs them.

## Before

**PHP Input:**
```php
<?php $title = "Test Page"; ?>
<!DOCTYPE html>
<html>
<head>
    <title><?= $title ?></title>
</head>
<body>
    <h1>Welcome</h1>
</body>
</html>
```

**Previous Output (Multi-line):**
```javascript
title = "Test Page";
console.log(`<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
</head>
<body>
    <h1>Welcome</h1>
</body>
</html>`);
```

## After

**New Output (Array-Based Function Call):**
```javascript
title = "Test Page";
__outputHtml([
  `<!DOCTYPE html>`,
  `<html>`,
  `<head>`,
  `<title>${title}</title>`,
  `</head>`,
  `<body>`,
  `<h1>Welcome</h1>`,
  `</body>`,
  `</html>`
]);
```

**Helper Function (automatically added to each file):**
```javascript
function __outputHtml(lines) {
  console.log(lines.join('\n'));
}
```

## Benefits

1. **Single Function Call**: All HTML lines passed as one array
2. **Better Performance**: Array join is optimized by JS engines
3. **Cleaner Code**: No variable declarations or loops needed
4. **Easier to Modify**: Can easily change the helper function behavior
5. **Clear Structure**: Array format shows all HTML lines at a glance
6. **No Scope Issues**: No need for block scopes or variable management
7. **Functional Approach**: Pure function call with data as parameter

## Implementation Details

The conversion now:
1. Splits HTML content by newlines
2. Trims each line
3. Skips empty lines
4. Escapes special characters (backticks, backslashes, `${}`)
5. Wraps each line in template literal backticks
6. Collects all lines into an array
7. Generates a single `__outputHtml([...])` function call
8. Preserves inline PHP expressions within each line

## Helper Function

The `__outputHtml()` function is automatically added to the prelude of each converted file:
```javascript
function __outputHtml(lines) {
  console.log(lines.join('\n'));
}
```

This function can be easily modified to:
- Write to a file instead of console
- Send to an HTTP response
- Accumulate in a buffer
- Process HTML before output

## Code Location

See `convert.mjs`:
- Lines 94-126: HTML embedding conversion logic
- Lines 228-231: `__outputHtml()` helper function definition
- Uses helper: `processInlinePhp()` for inline PHP expressions
