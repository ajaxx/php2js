//
// Converted from PHP: test-comment-quotes.php
// Source path: test-comment-quotes.php
// Generated: 2025-10-04 03:50:33
// Target: Node.js (server) + browser-friendly ES modules.
// NOTE: This is an automated light conversion. Manual review required.
//
// Environment shims (Node + Browser)
const __ENV__ = { isNode: typeof process !== 'undefined' && process.versions?.node, isBrowser: typeof window !== 'undefined' };

// HTML output helper function
function __outputHtml(lines) {
  console.log(lines.join('\n'));
}

// Module wrapper - encapsulates all code
// The _ parameter provides access to environment variables (GET, POST, SERVER, etc.)
(function(_) {
  // Global scope variables (accessible to all functions)
  let message, name, result;
  

// This is a comment with a quote: don't worry
message = 'Hello' + ' ' + 'World';

/* This is a block comment with quotes: "don't" and 'test' */
name = 'John' + ' ' + 'Doe';

// Another comment: it's fine, we're good
result = a + b;


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

// Selective exports
// No functions to export
export { __ENV__, __outputHtml };
