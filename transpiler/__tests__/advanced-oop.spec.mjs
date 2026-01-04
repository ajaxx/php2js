import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'advanced-oop.php' });
}

describe('AST Advanced OOP Features', () => {
  it('converts class constant declarations', async () => {
    const php = `class MyClass {
    const VERSION = "1.0.0";
    const MAX_SIZE = 100;
}`;
    const out = await run(php);
    expect(out).toContain('export class MyClass');
    expect(out).toContain('static VERSION = "1.0.0";');
    expect(out).toContain('static MAX_SIZE = 100;');
  });

  it('converts multiple class constants in one declaration', async () => {
    const php = `class Config {
    const DB_HOST = "localhost", DB_PORT = 3306;
}`;
    const out = await run(php);
    expect(out).toContain('static DB_HOST = "localhost";');
    expect(out).toContain('static DB_PORT = 3306;');
  });

  it('converts closure (anonymous function)', async () => {
    const php = `$callback = function($x) {
    return $x * 2;
};`;
    const out = await run(php);
    expect(out).toContain('callback = (x) => {');
    expect(out).toContain('return x * 2;');
  });

  it('converts closure with use clause', async () => {
    const php = `$multiplier = 3;
$callback = function($x) use ($multiplier) {
    return $x * $multiplier;
};`;
    const out = await run(php);
    expect(out).toContain('callback = (x) => { /* use (multiplier) */');
    expect(out).toContain('return x * multiplier;');
  });

  it('converts closure with reference in use clause', async () => {
    const php = `$counter = 0;
$increment = function() use (&$counter) {
    $counter++;
};`;
    const out = await run(php);
    expect(out).toContain('increment = () => { /* use (&counter) */');
    expect(out).toContain('counter++;');
  });

  it('converts static:: (late static binding)', async () => {
    const php = `class Base {
    public static function who() {
        return static::class;
    }
}`;
    const out = await run(php);
    expect(out).toContain('return this.constructor.class;');
  });

  it('converts clone expression', async () => {
    const php = `$original = new MyClass();
$copy = clone $original;`;
    const out = await run(php);
    expect(out).toContain('original = new MyClass();');
    expect(out).toContain('copy = Object.assign({}, original);');
  });

  it('handles noop nodes silently', async () => {
    const php = `function test() {
    $x = 1;
}`;
    const out = await run(php);
    expect(out).toContain('export function test()');
    expect(out).toContain('x = 1;');
  });

  it('combines class constants with properties and methods', async () => {
    const php = `class User {
    const ROLE_ADMIN = "admin";
    const ROLE_USER = "user";
    
    private $role;
    
    public function __construct($role) {
        $this->role = $role;
    }
    
    public function isAdmin() {
        return $this->role === self::ROLE_ADMIN;
    }
}`;
    const out = await run(php);
    expect(out).toContain('export class User');
    expect(out).toContain('static ROLE_ADMIN = "admin";');
    expect(out).toContain('static ROLE_USER = "user";');
    expect(out).toContain('role;');
    expect(out).toContain('__construct(role)');
    expect(out).toContain('return this.role === this.constructor.ROLE_ADMIN;');
  });

  it('converts declare statement to comment', async () => {
    const php = `declare(strict_types=1);
function test() {
    return 1;
}`;
    const out = await run(php);
    expect(out).toContain('// declare(strict_types=1)');
    expect(out).toContain('export function test()');
  });
});
