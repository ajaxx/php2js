const input = `if (a == b) {
if (x != y) {
if (p === q) {
if (m !== n) {`;

console.log('Input:');
console.log(input);

// New approach with lookbehind AND lookahead
let result = input;
result = result.replace(/!=(?!=)/g, '!==');
console.log('\n--- After != conversion ---');
console.log(result);

result = result.replace(/(?<![!=])==(?![=])/g, '===');
console.log('\n--- After == conversion ---');
console.log(result);
