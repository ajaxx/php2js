import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'constants.php' });
}

describe('AST Constants', () => {
  it('define() at top-level -> const by default (safe)', async () => {
    const out = await run("define('MY_CONSTANT', 'value');");
    expect(out).toContain("const MY_CONSTANT = 'value';");
    expect(out).not.toContain('export const MY_CONSTANT');
  });

  it('define() inside function -> const (scoped)', async () => {
    const out = await run("function test() { define('LOCAL_CONST', 42); }");
    expect(out).toContain('const LOCAL_CONST = 42;');
    expect(out).not.toMatch(/export const LOCAL_CONST/);
  });

  it('magic constant __DIR__ -> __dirname', async () => {
    const out = await run('$dir = __DIR__;');
    expect(out).toContain('dir = __dirname;');
  });

  it('magic constant __FILE__ -> __filename', async () => {
    const out = await run('$file = __FILE__;');
    expect(out).toContain('file = __filename;');
  });
});
