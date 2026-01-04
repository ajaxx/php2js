import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code, options = {}) {
  return await transpile(code, { filename: 'test.php', ...options });
}

describe('Superglobal Wrapping', () => {
  describe('modules using superglobals inject _ reference', () => {
    it('injects _ reference when using $_GET', async () => {
      const php = `$value = $_GET['key'];`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('value = _.GET[\'key\'];');
      expect(out).not.toContain('(function(_) {');
    });

    it('injects _ reference when using $_POST', async () => {
      const php = `$data = $_POST['field'];`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('data = _.POST[\'field\'];');
    });

    it('injects _ reference when using $_SERVER', async () => {
      const php = `$host = $_SERVER['HTTP_HOST'];`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('host = _.SERVER[\'HTTP_HOST\'];');
    });

    it('injects _ reference when using $_COOKIE', async () => {
      const php = `$session = $_COOKIE['session_id'];`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('session = _.COOKIE[\'session_id\'];');
    });

    it('injects _ reference when using $_SESSION', async () => {
      const php = `$user = $_SESSION['user_id'];`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('user = _.SESSION[\'user_id\'];');
    });

    it('injects _ reference when using $_REQUEST', async () => {
      const php = `$param = $_REQUEST['param'];`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('param = _.REQUEST[\'param\'];');
    });

    it('injects _ reference when using $_FILES', async () => {
      const php = `$upload = $_FILES['file'];`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('upload = _.FILES[\'file\'];');
    });

    it('injects _ reference when using multiple superglobals', async () => {
      const php = `
$get = $_GET['id'];
$post = $_POST['data'];
$server = $_SERVER['REQUEST_URI'];
`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('get = _.GET[\'id\'];');
      expect(out).toContain('post = _.POST[\'data\'];');
      expect(out).toContain('server = _.SERVER[\'REQUEST_URI\'];');
    });
  });

  describe('modules without superglobals are not injected', () => {
    it('does not inject _ reference without superglobals', async () => {
      const php = `$x = 123;
$y = $x + 456;`;
      const out = await run(php);
      expect(out).not.toContain('const _ = typeof globalThis');
      expect(out).toContain('x = 123;');
      expect(out).toContain('y = x + 456;');
    });

    it('does not inject _ reference with only regular variables', async () => {
      const php = `function test($param) {
    return $param * 2;
}`;
      const out = await run(php);
      expect(out).not.toContain('const _ = typeof globalThis');
      expect(out).toContain('export function test(param)');
    });
  });

  describe('injection preserves header comments', () => {
    it('keeps header comments before _ injection', async () => {
      const php = `$value = $_GET['key'];`;
      const out = await run(php);
      const lines = out.split('\n');
      
      // Header comments should be before the _ injection
      let foundComment = false;
      let foundInjection = false;
      
      for (const line of lines) {
        if (line.includes('Transpiled from PHP')) {
          foundComment = true;
          expect(foundInjection).toBe(false); // Comment should come before injection
        }
        if (line.includes('const _ = typeof globalThis')) {
          foundInjection = true;
        }
      }
      
      expect(foundComment).toBe(true);
      expect(foundInjection).toBe(true);
    });
  });

  describe('injection preserves exports', () => {
    it('preserves function exports with superglobal usage', async () => {
      const php = `function getParam() {
    return $_GET['param'];
}`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('export function getParam()');
      expect(out).toContain('return _.GET[\'param\'];');
      expect(out).not.toContain('(function(_) {'); // No IIFE wrapping
    });

    it('preserves class exports with superglobal usage', async () => {
      const php = `class Request {
    public function getParam() {
        return $_GET['param'];
    }
}`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('export class Request');
      expect(out).toContain('return _.GET[\'param\'];');
      expect(out).not.toContain('(function(_) {'); // No IIFE wrapping
    });

    it('preserves export statement at end of file', async () => {
      const php = `$value = $_GET['key'];`;
      const out = await run(php);
      expect(out).toContain('const _ = typeof globalThis');
      expect(out).toContain('export { __ENV__, __outputHtml };');
      expect(out).not.toContain('(function(_) {'); // No IIFE wrapping
    });
  });
});
