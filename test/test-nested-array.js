//
// Converted from PHP: test-nested-array.php
// Source path: test-nested-array.php
// Generated: 2025-10-04 01:27:21
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
  

login_header(
    __( 'Registration Form' ),
    wp_get_admin_notice(
        __( 'Register For This Site' ),
        { 
            'type'               : 'info',
            'additional_classes' : [  'message', 'register'  ],
         }
    ),
    errors
);


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
