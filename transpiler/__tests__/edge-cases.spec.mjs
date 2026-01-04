import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code, options = {}) {
  return await transpile(code, { filename: 'test.php', ...options });
}

describe('Edge Cases', () => {
  describe('export inside conditionals', () => {
    it('should not export class inside if block', async () => {
      const php = `
if (!class_exists('MyClass')) {
    class MyClass {
        public function test() {
            return 123;
        }
    }
}`;
      const out = await run(php);
      // Class should not be exported when inside conditional
      expect(out).not.toContain('export class MyClass');
      expect(out).toContain('class MyClass');
    });

    it('should not export function inside if block', async () => {
      const php = `
if (!function_exists('myFunc')) {
    function myFunc() {
        return 123;
    }
}`;
      const out = await run(php);
      // Function should not be exported when inside conditional
      expect(out).not.toContain('export function myFunc');
      expect(out).toContain('function myFunc');
    });
  });

  describe('reserved keywords', () => {
    it('should escape reserved keyword "public" as property name', async () => {
      const php = `
$obj = new stdClass();
$obj->public = 'value';
echo $obj->public;`;
      const out = await run(php);
      // Should use bracket notation or escape the keyword
      expect(out).toMatch(/(obj\['public'\]|obj\.public)/);
    });

    it('should escape reserved keyword "default" as property name', async () => {
      const php = `
$obj = new stdClass();
$obj->default = 'value';`;
      const out = await run(php);
      expect(out).toMatch(/(obj\['default'\]|obj\.default)/);
    });

    it('should escape reserved keyword "let" as variable name', async () => {
      const php = `$let = 123;`;
      const out = await run(php);
      // Variable named 'let' should be renamed or handled
      expect(out).toMatch(/(let_\s*=|_let\s*=)/);
    });
  });

  describe('multi-line strings', () => {
    it('should handle heredoc syntax', async () => {
      const php = `
$str = <<<EOD
Line 1
Line 2
EOD;`;
      const out = await run(php);
      expect(out).toContain('str =');
      // Should be a valid JavaScript string
      expect(out).not.toContain('Unterminated string');
    });

    it('should handle nowdoc syntax', async () => {
      const php = `
$str = <<<'EOD'
Line 1
Line 2
EOD;`;
      const out = await run(php);
      expect(out).toContain('str =');
    });
  });

  describe('PHP attributes', () => {
    it('should strip PHP 8 attributes from parameters', async () => {
      const php = `
function test(
    #[\\SensitiveParameter]
    $password
) {
    return hash('sha256', $password);
}`;
      const out = await run(php);
      expect(out).toContain('export function test(password)');
      expect(out).not.toContain('#[');
      expect(out).not.toContain('SensitiveParameter');
    });
  });
});
