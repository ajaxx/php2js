const input = `home_url  = 'http://' . $domain . $path;`;
const pattern = /(\$?\w+|["'`\]\)])\s*\.\s*(?=["'`$\w])/g;

console.log('Input:', input);
console.log('Pattern:', pattern);

let match;
while ((match = pattern.exec(input)) !== null) {
    console.log('Match found:', match[0], 'at index', match.index, 'prefix:', match[1]);
}
