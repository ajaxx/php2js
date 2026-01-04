import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'exceptions.php' });
}

describe('AST Exception Handling', () => {
  it('converts try-catch block', async () => {
    const php = `try {
    $result = riskyOperation();
} catch (Exception $e) {
    echo $e->getMessage();
}`;
    const out = await run(php);
    expect(out).toContain('try {');
    expect(out).toContain('result = riskyOperation();');
    expect(out).toContain('catch (e) {');
    expect(out).toContain('console.log(e.getMessage());');
  });

  it('converts try-catch-finally block', async () => {
    const php = `try {
    $file = fopen("test.txt", "r");
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
} finally {
    fclose($file);
}`;
    const out = await run(php);
    expect(out).toContain('try {');
    expect(out).toContain('catch (e) {');
    expect(out).toContain('finally {');
    expect(out).toContain('fclose(file);');
  });

  it('converts multiple catch blocks', async () => {
    const php = `try {
    doSomething();
} catch (RuntimeException $e) {
    echo "Runtime error";
} catch (Exception $e) {
    echo "General error";
}`;
    const out = await run(php);
    expect(out).toContain('try {');
    expect(out).toContain('catch (e) {');
    expect(out).toContain('// Catch RuntimeException');
    expect(out).toContain('console.log("Runtime error");');
    expect(out).toContain('console.log("General error");');
  });

  it('converts throw statement with new exception', async () => {
    const php = `if ($error) {
    throw new Exception("Something went wrong");
}`;
    const out = await run(php);
    expect(out).toContain('if (error) {');
    expect(out).toContain('throw new Exception("Something went wrong");');
  });

  it('converts throw statement with variable', async () => {
    const php = `$exception = new Exception("Error");
throw $exception;`;
    const out = await run(php);
    expect(out).toContain('exception = new Exception("Error");');
    expect(out).toContain('throw exception;');
  });

  it('converts class constant access', async () => {
    const php = `$value = MyClass::CONSTANT_NAME;`;
    const out = await run(php);
    expect(out).toContain('value = MyClass.CONSTANT_NAME;');
  });

  it('converts class constant in expression', async () => {
    const php = `if ($status === Status::ACTIVE) {
    echo "Active";
}`;
    const out = await run(php);
    expect(out).toContain('if (status === Status.ACTIVE)');
  });

  it('handles self:: with class constant', async () => {
    const php = `class MyClass {
    const VERSION = "1.0";
    
    public function getVersion() {
        return self::VERSION;
    }
}`;
    const out = await run(php);
    expect(out).toContain('export class MyClass');
    expect(out).toContain('return this.constructor.VERSION;');
  });
});
