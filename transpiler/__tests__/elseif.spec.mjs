import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'elseif.php' });
}

describe('AST elseif Conversion', () => {
  it('converts elseif to else if', async () => {
    const out = await run('if ($a) { echo "a"; } elseif ($b) { echo "b"; } else { echo "c"; }');
    expect(out).toContain('if (a) {');
    expect(out).toContain('} else if (b) {');
    expect(out).toContain('} else {');
    expect(out).not.toContain('elseif');
  });

  it('handles multiple elseif clauses', async () => {
    const out = await run('if ($x == 1) { } elseif ($x == 2) { } elseif ($x == 3) { } else { }');
    expect(out).toContain('if (x === 1)');
    expect(out).toContain('else if (x === 2)');
    expect(out).toContain('else if (x === 3)');
    expect(out).toContain('} else {');
  });
});
