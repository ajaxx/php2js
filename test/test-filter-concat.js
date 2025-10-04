//
// Converted from PHP: test-filter-concat.php
// Source path: test-filter-concat.php
// Generated: 2025-10-04 03:13:25
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
  // No global variables detected
  

// Validate action so as to default to the login screen.
if ( ! in_array( action, default_actions, true ) && false === has_filter( 'login_form_' + action ) ) {
    action = 'login';
}


nocache_headers();


header( 'Content-Type: ' + get_bloginfo( 'html_type' ) + '; charset=' + get_bloginfo( 'charset' ) );


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
