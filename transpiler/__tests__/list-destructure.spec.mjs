import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'list.php' });
}

describe('AST Array Destructuring (list)', () => {
  it('converts list() to array destructuring', async () => {
    const out = await run('list($a, $b, $c) = $array;');
    expect(out).toContain('[a, b, c] = array;');
    expect(out).not.toContain('list(');
  });

  it('handles list() with skipped elements', async () => {
    const out = await run('list($first, , $third) = $data;');
    expect(out).toContain('[first, , third] = data;');
  });

  it('handles nested list()', async () => {
    const out = await run('list($a, list($b, $c)) = $array;');
    expect(out).toContain('[a, [b, c]] = array;');
  });
});
