import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code, options = {}) {
  return await transpile(code, { filename: 'test.php', ...options });
}

describe('Mixed PHP Arrays', () => {
  it('handles arrays with both keyed and non-keyed items', async () => {
    const php = `$vendor_scripts = array(
    'react',
    'react-dom' => array('react'),
    'react-jsx-runtime' => array('react'),
    'regenerator-runtime',
);`;
    const out = await run(php);
    expect(out).toContain("'react': undefined");
    expect(out).toContain("'react-dom': ['react']");
    expect(out).toContain("'react-jsx-runtime': ['react']");
    expect(out).toContain("'regenerator-runtime': undefined");
    expect(out).not.toContain(': \'react\''); // Should not have empty key
  });

  it('handles purely indexed arrays normally', async () => {
    const php = `$items = array('a', 'b', 'c');`;
    const out = await run(php);
    expect(out).toContain("items = ['a', 'b', 'c']");
    expect(out).not.toContain(': undefined'); // Should not have undefined values
  });

  it('handles purely associative arrays normally', async () => {
    const php = `$config = array(
    'key1' => 'value1',
    'key2' => 'value2'
);`;
    const out = await run(php);
    expect(out).toContain("'key1': 'value1'");
    expect(out).toContain("'key2': 'value2'");
    expect(out).not.toContain(': undefined'); // Should not have undefined values
  });

  it('handles mixed array with multiple non-keyed items', async () => {
    const php = `$mixed = array(
    'item1',
    'item2',
    'key' => 'value',
    'item3'
);`;
    const out = await run(php);
    expect(out).toContain("'item1': undefined");
    expect(out).toContain("'item2': undefined");
    expect(out).toContain("'key': 'value'");
    expect(out).toContain("'item3': undefined");
  });
});
