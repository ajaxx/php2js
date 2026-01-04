import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'spec.php' });
}

describe('AST Transpiler - core features', () => {
  it('strips $ from variables', async () => {
    const out = await run('$a = 1; $b = "x";');
    expect(out).toContain('a = 1;');
    expect(out).toContain('b = "x";');
  });

  it('concatenates strings with +', async () => {
    const out = await run('$n = "A" . "B";');
    expect(out).toContain('n = "A" + "B";');
  });

  it('echo to console.log', async () => {
    const out = await run('echo "Hello";');
    expect(out).toContain('console.log("Hello");');
  });

  it('object operator -> to .', async () => {
    const out = await run('$u->get();');
    expect(out).toContain('u.get();');
  });

  it('static operator :: to .', async () => {
    const out = await run('User::make();');
    expect(out).toContain('User.make();');
  });

  it('function declaration export', async () => {
    const out = await run('function hi($x){ echo $x; }');
    expect(out).toContain('export function hi(x) {');
    expect(out).toContain('console.log(x);');
  });

  it('class declaration export + method', async () => {
    const out = await run('class U { public function name(){ return $this->n; } }');
    expect(out).toContain('export class U {');
    expect(out).toContain('name() {');
    expect(out).toContain('return this.n;');
  });

  it('foreach value only', async () => {
    const out = await run('foreach ($xs as $x) { echo $x; }');
    expect(out).toContain('for (const x of xs) {');
    expect(out).toContain('console.log(x);');
  });

  it('arrays indexed and associative', async () => {
    const out1 = await run('$a = array(1,2,3);');
    expect(out1).toContain('a = [1, 2, 3];');

    const out2 = await run("$m = array('a'=>1,'b'=>2);");
    expect(out2).toMatch(/m\s*=\s*\{\s*'a'\s*:\s*1,\s*'b'\s*:\s*2\s*\}/);
  });

  it('inline html -> __outputHtml', async () => {
    const out = await run('<?php ?>\n<p>Hi</p>\n<?php echo "X"; ?>');
    expect(out).toContain('__outputHtml([');
    expect(out).toContain('`<p>Hi</p>`');
    expect(out).toContain('console.log("X");');
  });
});
