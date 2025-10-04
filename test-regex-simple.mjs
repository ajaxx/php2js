const test1 = 'p === q';
const test2 = 'a == b';

console.log('Test 1 (===):', test1);
console.log('Matches /([^!=])==/:', test1.match(/([^!=])==/g));
console.log('After replace:', test1.replace(/([^!=])==/g, '$1==='));

console.log('\nTest 2 (==):', test2);
console.log('Matches /([^!=])==/:', test2.match(/([^!=])==/g));
console.log('After replace:', test2.replace(/([^!=])==/g, '$1==='));
