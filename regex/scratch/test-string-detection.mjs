const fullString = `home_url  = 'http://' . $domain . $path;`;
const dotPosition = 22; // Position of the first dot
const beforeDot = fullString.substring(0, dotPosition);

console.log('Full string:', fullString);
console.log('Before dot:', beforeDot);
console.log('Char at dot position:', fullString[dotPosition]);

let inString = false;
let stringChar = null;
let escaped = false;

for (let i = 0; i < beforeDot.length; i++) {
    const char = beforeDot[i];
    
    if (escaped) {
        escaped = false;
        continue;
    }
    if (char === '\\\\') {
        escaped = true;
        continue;
    }
    
    if ((char === '"' || char === "'" || char === '`') && !inString) {
        console.log(`Position ${i}: Opening quote '${char}'`);
        inString = true;
        stringChar = char;
    } else if (char === stringChar && inString) {
        console.log(`Position ${i}: Closing quote '${char}'`);
        inString = false;
        stringChar = null;
    }
}

console.log('Final inString:', inString);
