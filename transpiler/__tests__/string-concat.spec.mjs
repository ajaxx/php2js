import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'string-concat.php' });
}

describe('AST String Concatenation Edge Cases', () => {
  it('concatenates with constants', async () => {
    const out = await run("if (file_exists(ABSPATH . 'wp-config.php')) { }");
    expect(out).toContain("ABSPATH + 'wp-config.php'");
    expect(out).not.toContain("ABSPATH . 'wp-config.php'");
  });

  it('preserves dots inside string literals', async () => {
    const out = await run('$msg = "There doesn\'t seem to be a file. It is needed.";');
    expect(out).toContain('"There doesn\'t seem to be a file. It is needed."');
    expect(out).not.toContain('file + It');
    expect(out).not.toContain('be a file + It');
  });

  it('handles multi-line concatenation with dots in strings', async () => {
    const php = `$die = '<p>' . sprintf(
    __("There doesn't seem to be a %s file. It is needed before the installation can continue."),
    '<code>wp-config.php</code>'
) . '</p>';`;
    const out = await run(php);
    expect(out).toContain("'<p>' + sprintf");
    expect(out).toContain("There doesn't seem to be a %s file. It is needed before the installation can continue.");
    expect(out).toContain("'<code>wp-config.php</code>'");
    expect(out).toContain(") + '</p>';");
    expect(out).not.toContain('file + It');
    expect(out).not.toContain('wp-config + php');
  });

  it('concatenates after function call', async () => {
    const out = await run("$path = wp_guess_url() . '/wp-admin/setup-config.php';");
    expect(out).toContain("wp_guess_url() + '/wp-admin/setup-config.php'");
    expect(out).not.toContain("wp_guess_url() . '/");
  });

  it('concatenates string literals', async () => {
    const php = `$home_url = 'http://' . $domain . $path;
$login_url = 'http://' . $domain . $path . 'wp-login.php';`;
    const out = await run(php);
    expect(out).toContain("'http://' + domain + path");
    expect(out).toContain("'http://' + domain + path + 'wp-login.php'");
  });

  it('preserves decimal numbers', async () => {
    const out = await run('$pi = 3.14; $e = 2.71828;');
    expect(out).toContain('pi = 3.14;');
    expect(out).toContain('e = 2.71828;');
    expect(out).not.toContain('3 + 14');
    expect(out).not.toContain('2 + 71828');
  });
});
