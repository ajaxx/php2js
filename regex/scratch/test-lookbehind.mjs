const str = 'p === q';
console.log('String:', str);
console.log('Pattern: /(?<![!=])==/g');

const matches = [...str.matchAll(/(?<![!=])==/g)];
console.log('Matches:', matches.length);
matches.forEach((m, i) => {
    console.log(`  Match ${i}: "${m[0]}" at index ${m.index}`);
    console.log(`    Char before: "${str[m.index - 1]}"`);
});
