import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

describe('Utility Functions', () => {
  describe('inline style (default)', () => {
    it('generates inline __empty function when empty() is used', async () => {
      const php = `if (empty($value)) {
    echo "empty";
}`;
      const out = await transpile(php, { filename: 'test.php', utilityStyle: 'inline' });
      expect(out).toContain('function __empty(val) {');
      expect(out).toContain('if (__empty(value)) {');
      expect(out).toContain('if (val === null || val === undefined || val === false) return true;');
      expect(out).toContain('if (val === 0 || val === "0" || val === "") return true;');
      expect(out).toContain('if (Array.isArray(val) && val.length === 0) return true;');
    });

    it('does not generate utility function if empty() is not used', async () => {
      const php = `if ($value) {
    echo "not empty";
}`;
      const out = await transpile(php, { filename: 'test.php', utilityStyle: 'inline' });
      expect(out).not.toContain('function __empty');
    });

    it('generates utility function only once even with multiple uses', async () => {
      const php = `if (empty($a)) echo "a";
if (empty($b)) echo "b";
if (empty($c)) echo "c";`;
      const out = await transpile(php, { filename: 'test.php', utilityStyle: 'inline' });
      const matches = out.match(/function __empty/g);
      expect(matches).toHaveLength(1);
      expect(out).toContain('if (__empty(a))');
      expect(out).toContain('if (__empty(b))');
      expect(out).toContain('if (__empty(c))');
    });
  });

  describe('module style', () => {
    it('uses module import and calls module.empty()', async () => {
      const php = `if (empty($value)) {
    echo "empty";
}`;
      const out = await transpile(php, { 
        filename: 'test.php', 
        utilityStyle: 'module',
        utilityModule: 'php-utils'
      });
      expect(out).toContain("import * as php-utils from './php-utils.js';");
      expect(out).toContain('if (php-utils.empty(value)) {');
      expect(out).not.toContain('function __empty');
    });

    it('uses custom module name', async () => {
      const php = `if (empty($value)) {
    echo "empty";
}`;
      const out = await transpile(php, { 
        filename: 'test.php', 
        utilityStyle: 'module',
        utilityModule: 'my-helpers'
      });
      expect(out).toContain("import * as my-helpers from './my-helpers.js';");
      expect(out).toContain('if (my-helpers.empty(value)) {');
    });
  });

  describe('none style', () => {
    it('falls back to simple negation when utility style is none', async () => {
      const php = `if (empty($value)) {
    echo "empty";
}`;
      const out = await transpile(php, { filename: 'test.php', utilityStyle: 'none' });
      expect(out).toContain('if (!value) {');
      expect(out).not.toContain('function __empty');
      expect(out).not.toContain('import');
    });
  });

  describe('empty() semantics', () => {
    it('handles different empty values correctly with inline style', async () => {
      const php = `$tests = [
    empty(null),
    empty(false),
    empty(0),
    empty("0"),
    empty(""),
    empty([])
];`;
      const out = await transpile(php, { filename: 'test.php', utilityStyle: 'inline' });
      expect(out).toContain('function __empty(val) {');
      expect(out).toContain('__empty(null)');
      expect(out).toContain('__empty(false)');
      expect(out).toContain('__empty(0)');
      expect(out).toContain('__empty("0")');
      expect(out).toContain('__empty("")');
      expect(out).toContain('__empty([])');
    });
  });
});
