import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'control.php' });
}

describe('AST Control Flow', () => {
  it('die with message -> throw new Error', async () => {
    const out = await run('die("Fatal error");');
    expect(out).toContain('throw new Error("Fatal error");');
  });

  it('exit without message -> throw new Error', async () => {
    const out = await run('exit;');
    expect(out).toContain('throw new Error("Script terminated");');
  });

  it('while loop', async () => {
    const out = await run('while ($x < 10) { $x++; }');
    expect(out).toContain('while (x < 10) {');
    expect(out).toContain('x++;');
  });

  it('global keyword', async () => {
    const out = await run('function test() { global $var1, $var2; }');
    expect(out).toContain('// global var1, var2');
  });

  it('type cast removal: (int)', async () => {
    const out = await run('$num = (int)$str;');
    expect(out).toContain('num = str;');
    expect(out).not.toContain('(int)');
  });

  it('type cast removal: (string)', async () => {
    const out = await run('$text = (string)$val;');
    expect(out).toContain('text = val;');
    expect(out).not.toContain('(string)');
  });

  it('error control operator @', async () => {
    const out = await run('$result = @file_get_contents($path);');
    expect(out).toContain('/* @suppress-errors */');
    expect(out).toContain('file_get_contents(path)');
  });

  it('print expression -> console.log', async () => {
    const out = await run('print "Hello World";');
    expect(out).toContain('console.log("Hello World")');
  });

  it('print returns 1 in expressions', async () => {
    const out = await run('$result = print "test";');
    expect(out).toContain('result = (console.log("test"), 1)');
  });
});
