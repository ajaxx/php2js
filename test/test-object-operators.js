//
// Converted from PHP: test-object-operators.php
// Source path: test-object-operators.php
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
  let address, config, email, instance, name, result, user;
  
// Test object and static operators
class User {
    public name;
    public email;
    public export function getName() {
        return this.name;
    }
    public static export function getInstance() {
        return new self();
    }
}
user = new User();
user.name = "John";
user.email = "john/* @suppress-errors */ example.com";
// Object method calls
name = user.getName();
email = user.getEmail();
// Chained method calls
result = user.setName("Jane").setEmail("jane/* @suppress-errors */ example.com").save();
// Static method calls
instance = User.getInstance();
config = Config.get('database');
// Property access
console.log(user.name);
console.log(user.email);
// Nested object access
address = user.profile.address.street;

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
export { getName, getInstance };
export { __ENV__, __outputHtml };
