//
// Converted from PHP: test-html.php
// Source path: test-html.php
// Generated: 2025-10-04 00:56:00
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
  let name, title;
  
title = "Test Page";
name = "World";
__outputHtml([
  `<!DOCTYPE html>`,
  `<html>`,
  `<head>`,
  `<title>`
]);
 console.log(title); 
__outputHtml([
  `</title>`,
  `</head>`,
  `<body>`,
  `<h1>Hello`
]);
= name 
__outputHtml([
  `!</h1>`,
  `<p>This is a test with multiple lines.</p>`,
  `<div class="container">`,
  `<span>Each line should be wrapped separately</span>`,
  `</div>`,
  `</body>`,
  `</html>`
]);
console.log("Done!");

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
