import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code, options = {}) {
  return await transpile(code, { filename: 'test.php', ...options });
}

describe('Top-Level Return Statements', () => {
  it('wraps module without exports in IIFE for top-level return', async () => {
    const php = `if (SHORTINIT) {
    return false;
}`;
    const out = await run(php);
    expect(out).toContain('// Module wrapped in function to support top-level return');
    expect(out).toContain('(function() {');
    expect(out).toContain('// WARNING: Top-level return not supported in ES6 modules');
    expect(out).toContain('})();');
  });

  it('wraps module without exports for top-level return without value', async () => {
    const php = `if ($condition) {
    return;
}`;
    const out = await run(php);
    expect(out).toContain('// Module wrapped in function to support top-level return');
    expect(out).toContain('// WARNING: Top-level return not supported in ES6 modules');
  });

  it('does not wrap modules without top-level return', async () => {
    const php = `function test() {
    return 123;
}`;
    const out = await run(php);
    expect(out).toContain('return 123;');
    expect(out).not.toContain('Module wrapped in function');
    expect(out).not.toContain('(function() {');
  });

  it('preserves return inside class methods without wrapping', async () => {
    const php = `class MyClass {
    public function getValue() {
        return 42;
    }
}`;
    const out = await run(php);
    expect(out).toContain('return 42;');
    expect(out).not.toContain('Module wrapped in function');
  });

  it('wraps module without exports for top-level return expression', async () => {
    const php = `return $result;`;
    const out = await run(php);
    expect(out).toContain('// Module wrapped in function to support top-level return');
    expect(out).toContain('// WARNING: Top-level return not supported in ES6 modules');
    expect(out).toContain('// Original: return result;');
  });

  it('does not wrap modules with exports even if they have top-level return', async () => {
    const php = `if (class_exists('MyClass')) {
    return;
}
class MyClass {
    public function test() {
        return 123;
    }
}`;
    const out = await run(php);
    expect(out).toContain('export class MyClass');
    expect(out).toContain('// WARNING: Top-level return not supported in ES6 modules');
    expect(out).not.toContain('Module wrapped in function');
    expect(out).not.toContain('(function() {');
  });
});
