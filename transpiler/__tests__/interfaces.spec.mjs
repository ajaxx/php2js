import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code, interfaceStyle = 'abstract-class') {
  return await transpile(code, { filename: 'interfaces.php', interfaceStyle });
}

describe('AST Interface Handling', () => {
  const interfaceCode = `interface Logger {
    public function log($message);
    public function error($message);
}`;

  describe('abstract-class style (default)', () => {
    it('converts interface to abstract class with error-throwing methods', async () => {
      const out = await run(interfaceCode, 'abstract-class');
      expect(out).toContain('export class Logger {');
      expect(out).toContain('log(message) {');
      expect(out).toContain("throw new Error('Method log() must be implemented');");
      expect(out).toContain('error(message) {');
      expect(out).toContain("throw new Error('Method error() must be implemented');");
    });

    it('handles interface with static methods', async () => {
      const php = `interface Factory {
    public static function create();
}`;
      const out = await run(php, 'abstract-class');
      expect(out).toContain('export class Factory {');
      expect(out).toContain('static create() {');
      expect(out).toContain("throw new Error('Method create() must be implemented');");
    });

    it('handles interface with multiple parameters', async () => {
      const php = `interface Repository {
    public function find($id, $options);
}`;
      const out = await run(php, 'abstract-class');
      expect(out).toContain('find(id, options) {');
    });
  });

  describe('comment style', () => {
    it('converts interface to comment block', async () => {
      const out = await run(interfaceCode, 'comment');
      expect(out).toContain('// interface Logger {');
      expect(out).toContain('//     log(message);');
      expect(out).toContain('//     error(message);');
      expect(out).toContain('// }');
      expect(out).not.toContain('export class Logger');
    });

    it('handles static methods in comments', async () => {
      const php = `interface Factory {
    public static function create();
}`;
      const out = await run(php, 'comment');
      expect(out).toContain('// interface Factory {');
      expect(out).toContain('//     static create();');
      expect(out).toContain('// }');
    });
  });

  describe('jsdoc style', () => {
    it('converts interface to JSDoc with empty class', async () => {
      const out = await run(interfaceCode, 'jsdoc');
      expect(out).toContain('/**');
      expect(out).toContain(' * @interface Logger');
      expect(out).toContain(' * @method log({*} message)');
      expect(out).toContain(' * @method error({*} message)');
      expect(out).toContain(' */');
      expect(out).toContain('export class Logger {}');
    });

    it('handles methods with multiple parameters', async () => {
      const php = `interface Repository {
    public function find($id, $options);
}`;
      const out = await run(php, 'jsdoc');
      expect(out).toContain(' * @method find({*} id, {*} options)');
    });

    it('handles methods with no parameters', async () => {
      const php = `interface Counter {
    public function increment();
}`;
      const out = await run(php, 'jsdoc');
      expect(out).toContain(' * @method increment()');
    });
  });

  describe('empty-class style', () => {
    it('converts interface to empty class', async () => {
      const out = await run(interfaceCode, 'empty-class');
      expect(out).toContain('export class Logger {}');
      expect(out).not.toContain('log(message)');
      expect(out).not.toContain('error(message)');
      expect(out).not.toContain('throw new Error');
    });

    it('handles any interface as empty class', async () => {
      const php = `interface Complex {
    public function method1($a, $b);
    public static function method2();
    public function method3();
}`;
      const out = await run(php, 'empty-class');
      expect(out).toContain('export class Complex {}');
      expect(out).not.toContain('method1');
      expect(out).not.toContain('method2');
      expect(out).not.toContain('method3');
    });
  });

  describe('interface with implementing class', () => {
    it('abstract-class style allows extension', async () => {
      const php = `interface Logger {
    public function log($message);
}

class FileLogger implements Logger {
    public function log($message) {
        echo $message;
    }
}`;
      const out = await run(php, 'abstract-class');
      expect(out).toContain('export class Logger {');
      expect(out).toContain('log(message) {');
      expect(out).toContain("throw new Error('Method log() must be implemented');");
      expect(out).toContain('export class FileLogger');
      expect(out).toContain('console.log(message);');
    });

    it('comment style preserves implementing class', async () => {
      const php = `interface Logger {
    public function log($message);
}

class FileLogger implements Logger {
    public function log($message) {
        echo $message;
    }
}`;
      const out = await run(php, 'comment');
      expect(out).toContain('// interface Logger {');
      expect(out).toContain('export class FileLogger');
      expect(out).toContain('console.log(message);');
    });
  });
});
