import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'strings.php' });
}

describe('AST Strings', () => {
  it.skip('encapsed interpolation: "$greeting $name" -> template `${...}`', async () => {
    const out = await run('$name = "John"; $msg = "Hello, $name";');
    expect(out).toMatch(/msg\s*=\s*`Hello, \$\{name\}`/);
  });

  it('object operator preserved inside strings', async () => {
    const out = await run("$code = 'Use $object->method() to call';");
    expect(out).toContain("code = 'Use $object->method() to call';");
  });

  it('HTML comments preserved inside strings', async () => {
    const out = await run("$s = '<!-- wp:navigation {\"layout\":{\"type\":\"flex\"}} -->';");
    expect(out).toContain("'<!-- wp:navigation {\"layout\":{\"type\":\"flex\"}} -->'");
  });

  it('dots preserved inside strings (no concat)', async () => {
    const out = await run('$s = "There is a file. It is needed.";');
    expect(out).toContain('"There is a file. It is needed."');
    expect(out).not.toMatch(/\+\s*It/);
  });

  it('escape sequences preserved in double-quoted strings', async () => {
    const php = `echo "\\n" . $msg;
echo "Line 1\\nLine 2\\tTabbed";`;
    const out = await run(php);
    expect(out).toContain('console.log("\\n" + msg);');
    expect(out).toContain('console.log("Line 1\\nLine 2\\tTabbed");');
    expect(out).not.toContain('console.log("\n"'); // Should not have literal newline
  });

  it('single-quoted strings escape quotes and backslashes', async () => {
    const php = `$s = 'It\\'s a test';
$path = 'C:\\\\Users\\\\file';`;
    const out = await run(php);
    // PHP parser already processes escape sequences, so we get the final result
    expect(out).toContain("s = 'It\\'s a test';");
    expect(out).toContain("path = 'C:\\\\Users\\\\file';");
  });
});
