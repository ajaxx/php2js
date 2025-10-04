//
// Converted from PHP: test-html-embed.php
// Source path: test-html-embed.php
// Generated: 2025-10-04 02:47:55
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
  let footer, title;
  
 title = "Hello World"; 
__outputHtml([
  ``,
  `<h1>`
]);
= title 
__outputHtml([
  `</h1>`,
  `<p>Welcome to`
]);
 console.log(site_name); 
__outputHtml([
  `</p>`,
  ``
]);
 footer = "Footer"; 
__outputHtml([
  ``,
  `<footer>`
]);
= footer 
__outputHtml([
  `</footer>`,
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
