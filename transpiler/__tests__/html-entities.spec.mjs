import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'html-entities.php' });
}

describe('AST HTML Entity Handling', () => {
  it('handles semicolons in HTML entities within echo', async () => {
    const out = await run('echo "Hello &nbsp; World";');
    expect(out).toContain('console.log("Hello &nbsp; World");');
  });

  it('handles multiple HTML entities', async () => {
    const out = await run('echo "A &lt; B &amp; C &gt; D";');
    expect(out).toContain('console.log("A &lt; B &amp; C &gt; D");');
  });

  it('handles HTML entities in nested function calls', async () => {
    const out = await run('echo sprintf("Value: %s", "&nbsp;test&nbsp;");');
    expect(out).toContain('sprintf("Value: %s", "&nbsp;test&nbsp;")');
  });
});
