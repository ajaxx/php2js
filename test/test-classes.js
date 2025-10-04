//
// Converted from PHP: test-classes.php
// Source path: test-classes.php
// Generated: 2025-10-04 04:59:14
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
  

class User {
    // Public properties
name;
email = 'default/* @suppress-errors */ example.com';
    
    // Private properties
    #password;
    #id = 0;
    
    // Protected property
role = 'user';
    
    // Property without visibility (defaults to public)
status = 'active';
    
    // Constructor
    __construct(name, email) {
        this.name = name;
        this.email = email;
    }
    
    // Public method
    getName() {
        return this.name;
    }
    
    // Private method
    #validatePassword(password) {
        return strlen(password) >= 8;
    }
    
    // Protected method
    setRole(role) {
        this.role = role;
    }
    
    // Method without visibility (defaults to public)
getStatus() {
        return this.status;
    }
}

class Admin extends User {permissions = [  ];
    
    __construct(name, email) {
        super.__construct(name, email);
        this.setRole('admin');
    }
}


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
