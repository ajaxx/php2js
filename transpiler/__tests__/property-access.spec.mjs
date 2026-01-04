import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'property-access.php' });
}

describe('AST Property Access Preservation', () => {
  it('preserves property names after -> conversion', async () => {
    const out = await run('$title = $bookmark->link_name; $url = $bookmark->link_url;');
    expect(out).toContain('title = bookmark.link_name;');
    expect(out).toContain('url = bookmark.link_url;');
    expect(out).not.toContain('bookmark + link');
    expect(out).not.toContain('link + name');
    expect(out).not.toContain('link + url');
  });

  it('preserves in_array function name', async () => {
    const out = await run("if (!in_array($link_cat, array('all', '0'), true)) { }");
    expect(out).toContain('in_array');
    expect(out).not.toContain('in_[');
    expect(out).not.toContain('in_array[');
  });

  it('preserves method names with underscores', async () => {
    const out = await run('$codes = $wp_error->get_error_codes();');
    expect(out).toContain('wp_error.get_error_codes()');
    expect(out).not.toContain('get + error');
    expect(out).not.toContain('error + codes');
  });
});
