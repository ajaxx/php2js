import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'class-features.php' });
}

describe('AST Class Features', () => {
  it('converts self:: to this.constructor', async () => {
    const php = `class MyClass {
    public static function test() {
        return self::$value;
    }
}`;
    const out = await run(php);
    expect(out).toContain('this.constructor');
  });

  it('converts parent:: to super', async () => {
    const php = `class Child extends Parent {
    public function test() {
        return parent::test();
    }
}`;
    const out = await run(php);
    expect(out).toContain('super');
  });

  it('converts class properties', async () => {
    const php = `class MyClass {
    public $name;
    private $age = 25;
    protected $email = "test@example.com";
}`;
    const out = await run(php);
    expect(out).toContain('name;');
    expect(out).toContain('age = 25;');
    expect(out).toContain('email = "test@example.com";');
  });

  it('converts static class properties', async () => {
    const php = `class MyClass {
    public static $count = 0;
    private static $instance;
}`;
    const out = await run(php);
    expect(out).toContain('static count = 0;');
    expect(out).toContain('static instance;');
  });

  it('handles class with properties and methods', async () => {
    const php = `class User {
    private $name;
    private $email;
    
    public function __construct($name, $email) {
        $this->name = $name;
        $this->email = $email;
    }
    
    public function getName() {
        return $this->name;
    }
}`;
    const out = await run(php);
    expect(out).toContain('export class User');
    expect(out).toContain('name;');
    expect(out).toContain('email;');
    expect(out).toContain('__construct(name, email)');
    expect(out).toContain('getName()');
  });
});
