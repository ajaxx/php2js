import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'errors.php' });
}

// Placeholder tests for error control operator. Marked skipped until implemented.
describe('AST Error Control Operator @', () => {
  it('converts @call(...) to /* @suppress-errors */ call(...)', async () => {
    const out = await run('@unlink($file);');
    expect(out).toContain('/* @suppress-errors */');
    expect(out).toContain('unlink(file)');
  });

  it.skip('preserves @ in block comments', async () => {
    const out = await run('/* @param string $var */');
    expect(out).toContain('/* @param string $var */');
  });
});
