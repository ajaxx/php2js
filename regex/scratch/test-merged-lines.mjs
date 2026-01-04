import { readFileSync } from 'fs';

const content = readFileSync('D:\\Src\\Wordpress-JS\\wp-includes\\widgets\\class-wp-nav-menu-widget.js', 'utf8');
const lines = content.split('\n');

console.log('Line 83:');
console.log(lines[82]);
console.log('\nLine 86:');
console.log(lines[85]);
console.log('\nChecking for patterns:');
console.log('Line 83 has */format?', lines[82].includes('*/format'));
console.log('Line 86 has .title?', lines[85].includes('.title'));
