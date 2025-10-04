//
// Converted from PHP: test-inline-php.php
// Source path: test-inline-php.php
// Generated: 2025-10-04 02:48:56
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
  let name;
  
 name = "John"; age = 30; 
__outputHtml([
  ``,
  `<div>`,
  `<h1>Hello`
]);
= name 
__outputHtml([
  `</h1>`,
  `<p>Age:`
]);
 console.log(age); 
__outputHtml([
  `</p>`,
  `<p>Year:`
]);
 console.log(date('Y')); 
__outputHtml([
  `</p>`,
  `</div>`,
  ``
]);


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
