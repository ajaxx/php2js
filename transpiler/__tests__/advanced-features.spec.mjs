import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'advanced.php' });
}

describe('AST Advanced Features', () => {
  it('converts ternary operator (retif)', async () => {
    const out = await run('$result = $condition ? "yes" : "no";');
    expect(out).toContain('result = condition ? "yes" : "no";');
  });

  it('handles nested ternary operators', async () => {
    const out = await run('$val = $a ? $b : ($c ? $d : $e);');
    expect(out).toContain('val = a ? b : c ? d : e;');
  });

  it('converts new expression', async () => {
    const out = await run('$obj = new MyClass();');
    expect(out).toContain('obj = new MyClass();');
  });

  it('converts new with arguments', async () => {
    const out = await run('$obj = new MyClass($arg1, $arg2);');
    expect(out).toContain('obj = new MyClass(arg1, arg2);');
  });

  it('converts null keyword', async () => {
    const out = await run('$value = null;');
    expect(out).toContain('value = null;');
  });

  it('converts switch statement', async () => {
    const php = `switch ($var) {
    case 1:
        echo "one";
        break;
    case 2:
        echo "two";
        break;
    default:
        echo "other";
}`;
    const out = await run(php);
    expect(out).toContain('switch (var) {');
    expect(out).toContain('case 1:');
    expect(out).toContain('console.log("one");');
    expect(out).toContain('break;');
    expect(out).toContain('case 2:');
    expect(out).toContain('console.log("two");');
    expect(out).toContain('default:');
    expect(out).toContain('console.log("other");');
  });

  it('converts break statement', async () => {
    const out = await run('while ($x) { if ($y) break; }');
    expect(out).toContain('break;');
  });

  it('converts continue statement', async () => {
    const out = await run('while ($x) { if ($y) continue; }');
    expect(out).toContain('continue;');
  });

  it('converts unset to comment by default (strict mode safe)', async () => {
    const out = await run('unset($var);');
    expect(out).toContain('// unset(var);');
    expect(out).not.toContain('delete var;');
  });

  it('converts multiple unset variables to comments', async () => {
    const out = await run('unset($var1, $var2, $var3);');
    expect(out).toContain('// unset(var1);');
    expect(out).toContain('// unset(var2);');
    expect(out).toContain('// unset(var3);');
  });

  it('converts unset to delete when unsetStyle is delete', async () => {
    const out = await transpile('unset($var);', { filename: 'test.php', unsetStyle: 'delete' });
    expect(out).toContain('delete var;');
    expect(out).not.toContain('// unset');
  });

  it('converts multiple unset to delete when unsetStyle is delete', async () => {
    const out = await transpile('unset($var1, $var2);', { filename: 'test.php', unsetStyle: 'delete' });
    expect(out).toContain('delete var1;');
    expect(out).toContain('delete var2;');
  });
});
