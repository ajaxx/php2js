import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'blank-lines.php' });
}

describe('AST Blank Lines Preservation', () => {
  it.skip('preserves single blank line between statements', async () => {
    const php = `$a = 1;

$b = 2;`;
    const out = await run(php);
    expect(out).toMatch(/a = 1;\n\nb = 2;/);
  });

  it.skip('preserves multiple blank lines between statements', async () => {
    const php = `$a = 1;


$b = 2;`;
    const out = await run(php);
    expect(out).toMatch(/a = 1;\n\n\nb = 2;/);
  });

  it.skip('preserves blank lines in function bodies', async () => {
    const php = `function test() {
    $x = 1;

    $y = 2;
}`;
    const out = await run(php);
    expect(out).toMatch(/x = 1;\n\n\s+y = 2;/);
  });
});
