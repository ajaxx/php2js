import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the transform function (we'll need to expose it or copy it here)
// For now, let's just read and use the regex patterns

async function testConversion() {
  const phpCode = await fs.readFile(path.join(__dirname, 'test-concat.php'), 'utf8');
  
  console.log('=== ORIGINAL PHP ===');
  console.log(phpCode);
  console.log('\n=== TESTING CONVERSIONS ===\n');
  
  let js = phpCode;
  
  // Remove PHP tags
  js = js.replace(/<\?(?:php)?/gi, '').replace(/\?>/g, '');
  
  // Strip $ from variables
  js = js.replace(/\$(\w+)/g, '$1');
  
  // String concatenation: .= -> +=
  console.log('Before .= conversion:', js.match(/\w+\s*\.=/g));
  js = js.replace(/(\w+)\s*\.=/g, '$1 +=');
  console.log('After .= conversion:', js.match(/\w+\s*\+=/g));
  
  // String concatenation: . -> +
  console.log('\nBefore . conversion (sample):', js.substring(100, 200));
  js = js.replace(/(\w+|["'`\]\)])\s*\.\s*(?=["'`\w$])/g, '$1 + ');
  console.log('After . conversion (sample):', js.substring(100, 200));
  
  // echo -> console.log
  js = js.replace(/\becho\b\s+(.+?);/g, 'console.log($1);');
  
  console.log('\n=== CONVERTED JAVASCRIPT ===');
  console.log(js);
}

testConversion().catch(console.error);
