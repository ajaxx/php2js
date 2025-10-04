//
// Converted from PHP: test-static.php
// Source path: test-static.php
// Generated: 2025-10-04 05:04:48
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
  let db;
  

class Database {
    // Static properties
    static connection = null;
    static #instance = null;
    
    // Static methods
    static getInstance() {
        if (this.constructor.instance === null) {
            this.constructor.instance = new self();
        }
        return this.constructor.instance;
    }
    
    static #connect() {
        return 'Connected';
    }
    
    // Regular method using static
    query() {
        return this.constructor.connect();
    }
}

// Usage
db = Database.getInstance();


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
