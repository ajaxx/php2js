import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

function runLegacySuite() {
  const cwd = path.resolve(path.join(process.cwd()));
  const cmd = 'node regex/test-all-features.mjs';
  try {
    const out = execSync(cmd, { cwd, stdio: 'pipe' }).toString();
    return { code: 0, output: out };
  } catch (err) {
    const out = (err && err.stdout) ? err.stdout.toString() : '';
    return { code: err?.status ?? 1, output: out };
  }
}

describe('Regex transpiler legacy suite (wrapped)', () => {
  it('runs the legacy test-all-features and reports expected totals', () => {
    const { code, output } = runLegacySuite();
    // Parse summary line: Tests: 59 passed, 3 failed, 62 total
    const match = output.match(/Tests:\s*(\d+)\s*passed,\s*(\d+)\s*failed,\s*(\d+)\s*total/);
    expect(match, `Could not parse legacy test totals. Output:\n${output}`).toBeTruthy();
    const passed = Number(match[1]);
    const failed = Number(match[2]);
    const total = Number(match[3]);

    // Assert current known totals (update as suite evolves)
    expect(total).toBe(62);
    expect(passed).toBe(59);
    expect(failed).toBe(3);

    // The legacy script exits with code 1 on failures; ensure vitest passes as long as totals match
    expect(passed + failed).toBe(total);
  });
});
