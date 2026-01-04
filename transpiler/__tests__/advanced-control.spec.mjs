import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'advanced-control.php' });
}

describe('AST Advanced Control Flow', () => {
  it('converts do-while loop', async () => {
    const php = `do {
    echo "Hello";
    $i++;
} while ($i < 10);`;
    const out = await run(php);
    expect(out).toContain('do {');
    expect(out).toContain('console.log("Hello");');
    expect(out).toContain('i++;');
    expect(out).toContain('} while (i < 10);');
  });

  it('converts static variable declaration', async () => {
    const php = `function counter() {
    static $count = 0;
    $count++;
    return $count;
}`;
    const out = await run(php);
    expect(out).toContain('let count = 0; // static');
    expect(out).toContain('count++;');
  });

  it('converts static variable without default value', async () => {
    const php = `function test() {
    static $value;
    $value = 10;
}`;
    const out = await run(php);
    expect(out).toContain('// static');
    expect(out).toContain('value = 10;');
  });

  it('converts reference assignment', async () => {
    const php = `$a = 5;
$b =& $a;`;
    const out = await run(php);
    expect(out).toContain('a = 5;');
    expect(out).toContain('b = a /* ref */');
  });

  it('converts variadic parameters', async () => {
    const php = `function sum(...$numbers) {
    $total = 0;
    foreach ($numbers as $num) {
        $total += $num;
    }
    return $total;
}`;
    const out = await run(php);
    expect(out).toContain('function sum(...numbers)');
  });

  it('converts variadic in function call', async () => {
    const php = `$args = [1, 2, 3];
$result = myFunc(...$args);`;
    const out = await run(php);
    expect(out).toContain('args = [1, 2, 3];');
    expect(out).toContain('result = myFunc(...args);');
  });

  it('handles multiple static variables', async () => {
    const php = `function test() {
    static $a = 1, $b = 2, $c = 3;
}`;
    const out = await run(php);
    expect(out).toContain('let a = 1; // static');
    expect(out).toContain('let b = 2; // static');
    expect(out).toContain('let c = 3; // static');
  });
});
