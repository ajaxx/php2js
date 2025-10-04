//
// Converted from PHP: test-define-scope.php
// Source path: test-define-scope.php
// Generated: 2025-10-04 04:39:38
// Target: Node.js (server) + browser-friendly ES modules.
// NOTE: This is an automated light conversion. Manual review required.
//
export const GLOBAL_CONSTANT = 'global value';
export const ANOTHER_GLOBAL = 123;

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
  

// Global define - should be export const

function myFunction() {
    // Local define inside function - should be local const
    const LOCAL_CONSTANT = 'local value';
    
    result = LOCAL_CONSTANT;
    return result;
}

// Another global define


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
export { myFunction };
export { __ENV__, __outputHtml };
