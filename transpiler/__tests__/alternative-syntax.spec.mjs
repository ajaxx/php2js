import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'alt-syntax.php' });
}

describe('AST Alternative Syntax', () => {
  it('converts if/endif to braces', async () => {
    const php = `if ($condition):
    echo "true";
endif;`;
    const out = await run(php);
    expect(out).toContain('if (condition) {');
    expect(out).toContain('console.log("true");');
    expect(out).toContain('}');
    expect(out).not.toContain('endif');
  });

  it('converts if/else/endif to braces', async () => {
    const php = `if ($a):
    echo "a";
else:
    echo "b";
endif;`;
    const out = await run(php);
    expect(out).toContain('if (a) {');
    expect(out).toContain('console.log("a");');
    expect(out).toContain('} else {');
    expect(out).toContain('console.log("b");');
    expect(out).not.toContain('endif');
    expect(out).not.toContain('else:');
  });

  it('converts if/elseif/else/endif to braces', async () => {
    const php = `if ($x == 1):
    echo "one";
elseif ($x == 2):
    echo "two";
else:
    echo "other";
endif;`;
    const out = await run(php);
    expect(out).toContain('if (x === 1) {');
    expect(out).toContain('} else if (x === 2) {');
    expect(out).toContain('} else {');
    expect(out).not.toContain('endif');
    expect(out).not.toContain('elseif');
  });

  it('converts foreach/endforeach (simple) to braces', async () => {
    const php = `foreach ($items as $item):
    echo $item;
endforeach;`;
    const out = await run(php);
    expect(out).toContain('for (const item of items) {');
    expect(out).toContain('console.log(item);');
    expect(out).toContain('}');
    expect(out).not.toContain('endforeach');
    expect(out).not.toContain('foreach');
  });

  it('converts foreach/endforeach (key-value) to braces', async () => {
    const php = `foreach ($items as $key => $value):
    echo $key;
endforeach;`;
    const out = await run(php);
    expect(out).toContain('for (const [key, value] of Object.entries(items)) {');
    expect(out).toContain('console.log(key);');
    expect(out).toContain('}');
    expect(out).not.toContain('endforeach');
  });

  it('converts while/endwhile to braces', async () => {
    const php = `while ($condition):
    echo "loop";
endwhile;`;
    const out = await run(php);
    expect(out).toContain('while (condition) {');
    expect(out).toContain('console.log("loop");');
    expect(out).toContain('}');
    expect(out).not.toContain('endwhile');
  });

  it('converts for/endfor to braces', async () => {
    const php = `for ($i = 0; $i < 10; $i++):
    echo $i;
endfor;`;
    const out = await run(php);
    expect(out).toContain('for (');
    expect(out).toContain('i = 0');
    expect(out).toContain('i < 10');
    expect(out).toContain('i++');
    expect(out).toContain(') {');
    expect(out).toContain('console.log(i);');
    expect(out).not.toContain('endfor');
  });
});
