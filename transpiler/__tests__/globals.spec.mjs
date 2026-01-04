import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'globals.php' });
}

describe('AST Superglobals', () => {
  it('$_GET -> _.GET', async () => {
    const out = await run("$val = $_GET['key'];");
    expect(out).toContain("val = _.GET['key'];");
  });

  it('$_POST -> _.POST', async () => {
    const out = await run("$data = $_POST['field'];");
    expect(out).toContain("data = _.POST['field'];");
  });

  it('$_SERVER -> _.SERVER', async () => {
    const out = await run("$host = $_SERVER['HTTP_HOST'];");
    expect(out).toContain("host = _.SERVER['HTTP_HOST'];");
  });

  it('$_COOKIE -> _.COOKIE', async () => {
    const out = await run("$token = $_COOKIE['session'];");
    expect(out).toContain("token = _.COOKIE['session'];");
  });

  it('$_SESSION -> _.SESSION', async () => {
    const out = await run("$user = $_SESSION['user_id'];");
    expect(out).toContain("user = _.SESSION['user_id'];");
  });

  it('$_REQUEST -> _.REQUEST', async () => {
    const out = await run("$param = $_REQUEST['id'];");
    expect(out).toContain("param = _.REQUEST['id'];");
  });

  it('$_FILES -> _.FILES', async () => {
    const out = await run("$upload = $_FILES['document'];");
    expect(out).toContain("upload = _.FILES['document'];");
  });
});
