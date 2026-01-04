import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'operators.php' });
}

describe('AST Operators', () => {
  it('.= operator -> +=', async () => {
    const out = await run('$str = "Hello"; $str .= " World";');
    expect(out).toContain('str = "Hello";');
    expect(out).toContain('str += " World";');
  });

  it('equality operators: == -> ===, != -> !==', async () => {
    const out = await run('$a = (1 == 1); $b = (2 != 3);');
    expect(out).toContain('1 === 1');
    expect(out).toContain('2 !== 3');
  });
});
