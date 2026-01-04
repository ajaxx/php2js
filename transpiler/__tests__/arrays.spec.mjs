import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'arrays.php' });
}

describe('AST Arrays', () => {
  it('array append: $arr[] = $val -> arr.push(val)', async () => {
    const out = await run('$items = array(); $items[] = "new";');
    expect(out).toContain('items = [];');
    expect(out).toContain('items.push("new");');
  });

  it('nested arrays', async () => {
    const out = await run("$data = array('users' => array('john', 'jane'), 'count' => 2);");
    expect(out).toContain("'users'");
    expect(out).toContain("'john'");
    expect(out).toContain("'jane'");
    expect(out).toContain("'count'");
    expect(out).toContain('2');
  });

  it('deeply nested arrays', async () => {
    const out = await run("$config = array('type' => 'info', 'classes' => array('message', 'register'));");
    expect(out).toContain("'type'");
    expect(out).toContain("'info'");
    expect(out).toContain("'classes'");
    expect(out).toContain("'message'");
    expect(out).toContain("'register'");
  });

  it('array with numeric keys', async () => {
    const out = await run('$arr = array(0 => "a", 1 => "b");');
    expect(out).toContain('arr = ');
  });
});
