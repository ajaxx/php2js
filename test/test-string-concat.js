//
// Converted from PHP: test-string-concat.php
// Source path: test-string-concat.php
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
  let home_url, login_url;
  
home_url  = 'http://' + domain + path;
login_url = 'http://' + domain + path + 'wp-login.php';

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
