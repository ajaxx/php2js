//
// Converted from PHP: test-method-calls.php
// Source path: test-method-calls.php
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
  let email, fullInfo, greeting, message, name, result, user;
  
// Test to ensure method calls aren't broken by string concatenation conversion
user = new User();
name = user.getName();
email = user.getEmail();
// String concatenation should still work
fullInfo = name . " <" . email . ">";
console.log(fullInfo);
// Method chaining
result = user.setName("John").setEmail("john/* @suppress-errors */ example.com").save();
// Mixed: method calls and concatenation
greeting = "Hello, " . user.getName() . "!";
console.log(greeting);
// Compound assignment
message = "User: ";
message += user.getName();

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
