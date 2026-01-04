import { readFileSync } from 'fs';

const phpContent = readFileSync('D:\\Src\\Wordpress\\wp-includes\\widgets\\class-wp-nav-menu-widget.php', 'utf8');
const jsContent = readFileSync('D:\\Src\\Wordpress-JS\\wp-includes\\widgets\\class-wp-nav-menu-widget.js', 'utf8');

const phpLines = phpContent.split('\n');
const jsLines = jsContent.split('\n');

console.log('PHP Line 53:');
console.log(phpLines[52]);
console.log('\nPHP Line 54:');
console.log(phpLines[53]);

console.log('\n\nJS Lines 62-66:');
for (let i = 61; i <= 65; i++) {
    console.log(`Line ${i+1}: ${jsLines[i]}`);
}

console.log('\n\nLooking for the comment about "This filter is documented"...');
const commentLine = jsLines.findIndex(line => line.includes('This filter is documented'));
if (commentLine >= 0) {
    console.log(`Found at JS line ${commentLine + 1}:`);
    console.log(jsLines[commentLine]);
    console.log(`Next line ${commentLine + 2}:`);
    console.log(jsLines[commentLine + 1]);
}
