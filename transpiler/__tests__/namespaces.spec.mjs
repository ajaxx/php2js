import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code, options = {}) {
  return await transpile(code, { filename: 'test.php', ...options });
}

describe('PHP Namespace Handling', () => {
  it('strips leading backslash from global namespace class references', async () => {
    const php = `namespace ParagonIE\\Sodium;

class Crypto extends \\ParagonIE_Sodium_Crypto
{
}`;
    const out = await run(php);
    expect(out).toContain('class Crypto extends ParagonIE_Sodium_Crypto');
    expect(out).not.toContain('\\ParagonIE_Sodium_Crypto');
  });

  it('converts namespace separators to underscores in extends clause', async () => {
    const php = `namespace Test;

class Child extends \\Parent\\Class\\Name
{
}`;
    const out = await run(php);
    expect(out).toContain('class Child extends Parent_Class_Name');
    expect(out).not.toContain('Parent\\Class\\Name');
  });

  it('handles extends without leading backslash', async () => {
    const php = `class Child extends ParentClass
{
}`;
    const out = await run(php);
    expect(out).toContain('class Child extends ParentClass');
  });

  it('preserves namespace comment in output', async () => {
    const php = `namespace MyApp\\Controllers;

class HomeController
{
}`;
    const out = await run(php);
    expect(out).toContain('// Namespace: MyApp\\Controllers');
    expect(out).toContain('class HomeController');
  });
});
