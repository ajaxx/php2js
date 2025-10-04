//
// Converted from PHP: test-embedded-printf.php
// Source path: test-embedded-printf.php
// Generated: 2025-10-04 01:34:41
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
  
                


                printf(
                    /* translators: %s: Admin email address. */
                    __( 'Current administration email: %s' ),
                    '<strong>' + esc_html( admin_email ) + '</strong>'
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
