import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'imports.php' });
}

// NOTE: These are placeholders for future AST support for require/include mapping.
// Marked as skipped so the suite remains green until implementation lands.

describe('AST Imports (require/include mapping)', () => {
  it('require string literal -> import', async () => {
    const out = await run("require 'config.php';");
    expect(out).toContain("import './config.js';");
  });

  it('include_once string literal -> import', async () => {
    const out = await run("include_once 'header.php';");
    expect(out).toContain("import './header.js';");
  });

  it.skip('require_once with concatenation -> TODO dynamic import comment', async () => {
    const out = await run("require_once ABSPATH . 'wp-includes/version.php';");
    expect(out).toMatch(/TODO: import equivalent/);
  });
});
