import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'comments.php' });
}

describe('AST Comment Preservation', () => {
  it.skip('preserves single-line comments', async () => {
    const php = `// This is a comment
$var = 'test';`;
    const out = await run(php);
    expect(out).toContain('// This is a comment');
    expect(out).toContain("var = 'test';");
  });

  it.skip('preserves hash comments', async () => {
    const php = `# This is a hash comment
$var = 'test';`;
    const out = await run(php);
    expect(out).toContain('// This is a hash comment');
    expect(out).toContain("var = 'test';");
  });

  it.skip('preserves block comments', async () => {
    const php = `/* This is a
   block comment */
$var = 'test';`;
    const out = await run(php);
    expect(out).toContain('/* This is a');
    expect(out).toContain('block comment */');
  });

  it.skip('preserves docblock comments', async () => {
    const php = `/**
 * This is a docblock
 * @param string $var
 */
function test($var) { }`;
    const out = await run(php);
    expect(out).toContain('/**');
    expect(out).toContain('* This is a docblock');
    expect(out).toContain('* @param string $var');
    expect(out).toContain('*/');
  });

  it.skip('preserves inline comments', async () => {
    const php = `$a = 1; // inline comment
$b = 2; /* inline block */`;
    const out = await run(php);
    expect(out).toContain('a = 1; // inline comment');
    expect(out).toContain('b = 2; /* inline block */');
  });

  it.skip('handles comments with quotes', async () => {
    const php = `// Comment with quote: don't
$message = 'Hello' . ' ' . 'World';
/* Block comment: "don't" and 'test' */
$name = 'A' . 'B';`;
    const out = await run(php);
    expect(out).toContain("// Comment with quote: don't");
    expect(out).toContain("message = 'Hello' + ' ' + 'World';");
    expect(out).toContain('/* Block comment: "don\'t" and \'test\' */');
    expect(out).toContain("name = 'A' + 'B';");
  });
});
