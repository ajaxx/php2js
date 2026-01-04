// Test the regex patterns
const testLine83 = "                 */format = apply_filters( 'navigation_widgets_format', format );";
const testLine86 = "                        // The title may be filtered: Strip out HTML and make sure the aria-label is never empty.title      = trim( strip_tags( title ) );aria_label = title ? title : default_title;nav_menu_args = {";

console.log('Testing line 83:');
const blockCommentPattern = /(\*\/)([a-zA-Z_$][\w$]+)/g;
const match83 = blockCommentPattern.exec(testLine83);
console.log('Match:', match83);

console.log('\nTesting line 86:');
const lineCommentPattern = /^(\s*\/\/[^\n]+?)([.;!?])([a-zA-Z_$][\w$]*)/gm;
const match86 = lineCommentPattern.exec(testLine86);
console.log('Match:', match86);

// Test with actual lookahead
if (match86) {
    const afterMatch = testLine86.substring(match86.index + match86[0].length, match86.index + match86[0].length + 20);
    console.log('After match:', afterMatch);
    console.log('Lookahead test:', /^\s*[=\(\[]/.test(afterMatch));
}
