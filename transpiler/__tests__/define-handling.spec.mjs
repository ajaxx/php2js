import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code, options = {}) {
  return await transpile(code, { filename: 'test.php', ...options });
}

describe('Define Handling', () => {
  describe('const style (default)', () => {
    it('converts top-level define to const', async () => {
      const php = `define('MY_CONSTANT', 123);`;
      const out = await run(php);
      expect(out).toContain('const MY_CONSTANT = 123;');
      expect(out).not.toContain('export const');
    });

    it('converts define inside if block to const', async () => {
      const php = `if ($condition) {
    define('MY_CONSTANT', 123);
}`;
      const out = await run(php);
      expect(out).toContain('const MY_CONSTANT = 123;');
      expect(out).not.toContain('export const');
    });

    it('converts define inside else block to const', async () => {
      const php = `if ($condition) {
    echo "test";
} else {
    define('MY_CONSTANT', 456);
}`;
      const out = await run(php);
      expect(out).toContain('const MY_CONSTANT = 456;');
      expect(out).not.toContain('export const');
    });

    it('converts multiple defines to const', async () => {
      const php = `define('CONST1', 1);
define('CONST2', 2);
if ($x) {
    define('CONST3', 3);
}`;
      const out = await run(php);
      expect(out).toContain('const CONST1 = 1;');
      expect(out).toContain('const CONST2 = 2;');
      expect(out).toContain('const CONST3 = 3;');
      expect(out).not.toContain('export const');
    });
  });

  describe('export-const style', () => {
    it('converts top-level define to export const', async () => {
      const php = `define('MY_CONSTANT', 123);`;
      const out = await run(php, { defineStyle: 'export-const' });
      expect(out).toContain('export const MY_CONSTANT = 123;');
    });

    it('converts define inside if block to const (not export)', async () => {
      const php = `if ($condition) {
    define('MY_CONSTANT', 123);
}`;
      const out = await run(php, { defineStyle: 'export-const' });
      expect(out).toContain('const MY_CONSTANT = 123;');
      expect(out).not.toContain('export const MY_CONSTANT');
    });

    it('converts define inside else block to const (not export)', async () => {
      const php = `if ($condition) {
    echo "test";
} else {
    define('MY_CONSTANT', 456);
}`;
      const out = await run(php, { defineStyle: 'export-const' });
      expect(out).toContain('const MY_CONSTANT = 456;');
      expect(out).not.toContain('export const MY_CONSTANT');
    });

    it('mixes export const at top level and const in conditionals', async () => {
      const php = `define('TOP_LEVEL', 1);
if ($x) {
    define('IN_IF', 2);
}
define('ANOTHER_TOP', 3);`;
      const out = await run(php, { defineStyle: 'export-const' });
      expect(out).toContain('export const TOP_LEVEL = 1;');
      expect(out).toContain('const IN_IF = 2;');
      expect(out).toContain('export const ANOTHER_TOP = 3;');
    });

    it('converts define inside function to const (not export)', async () => {
      const php = `function test() {
    define('FUNC_CONST', 123);
}`;
      const out = await run(php, { defineStyle: 'export-const' });
      expect(out).toContain('const FUNC_CONST = 123;');
      expect(out).not.toContain('export const FUNC_CONST');
    });
  });

  describe('comment style', () => {
    it('converts top-level define to comment', async () => {
      const php = `define('MY_CONSTANT', 123);`;
      const out = await run(php, { defineStyle: 'comment' });
      expect(out).toContain("// define('MY_CONSTANT', 123);");
      expect(out).not.toContain('const MY_CONSTANT');
      expect(out).not.toContain('export const');
    });

    it('converts define inside if block to comment', async () => {
      const php = `if ($condition) {
    define('MY_CONSTANT', 123);
}`;
      const out = await run(php, { defineStyle: 'comment' });
      expect(out).toContain("// define('MY_CONSTANT', 123);");
      expect(out).not.toContain('const MY_CONSTANT');
    });

    it('converts multiple defines to comments', async () => {
      const php = `define('CONST1', 1);
define('CONST2', "test");
if ($x) {
    define('CONST3', true);
}`;
      const out = await run(php, { defineStyle: 'comment' });
      expect(out).toContain("// define('CONST1', 1);");
      expect(out).toContain("// define('CONST2', \"test\");");
      expect(out).toContain("// define('CONST3', true);");
    });
  });

  describe('define with string values', () => {
    it('handles string constants', async () => {
      const php = `define('WPINC', 'wp-includes');`;
      const out = await run(php);
      expect(out).toContain("const WPINC = 'wp-includes';");
    });

    it('handles concatenated string constants', async () => {
      const php = `define('WP_CONTENT_DIR', ABSPATH . 'wp-content');`;
      const out = await run(php);
      expect(out).toContain("const WP_CONTENT_DIR = ABSPATH + 'wp-content';");
    });
  });
});
