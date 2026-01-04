import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createUtilityManager } from '../php-utils-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testOutputDir = path.join(__dirname, 'temp-utility-test');

describe('Utility Module Generation', () => {
  beforeEach(async () => {
    // Create test output directory
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('generates utility module file with used functions', async () => {
    const manager = createUtilityManager({
      utilityStyle: 'module',
      utilityModule: 'php-utils'
    });

    // Register some functions as used
    manager.registerFunction('empty');
    manager.registerFunction('isset');

    // Generate the module
    const modulePath = await manager.generateUtilityModule(testOutputDir);

    // Verify file was created
    expect(modulePath).toBe(path.join(testOutputDir, 'php-utils.js'));
    const exists = await fs.access(modulePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify content
    const content = await fs.readFile(modulePath, 'utf8');
    expect(content).toContain('export function empty(val) {');
    expect(content).toContain('export function isset(...vars) {');
    expect(content).toContain('PHP Utility Functions Module');
    expect(content).toContain('export default {');
  });

  it('generates module with custom name', async () => {
    const manager = createUtilityManager({
      utilityStyle: 'module',
      utilityModule: 'my-helpers'
    });

    manager.registerFunction('empty');
    const modulePath = await manager.generateUtilityModule(testOutputDir);

    expect(modulePath).toBe(path.join(testOutputDir, 'my-helpers.js'));
    const exists = await fs.access(modulePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('ensureUtilityModule creates module if it does not exist', async () => {
    const manager = createUtilityManager({
      utilityStyle: 'module',
      utilityModule: 'php-utils'
    });

    manager.registerFunction('empty');
    const modulePath = await manager.ensureUtilityModule(testOutputDir);

    expect(modulePath).toBe(path.join(testOutputDir, 'php-utils.js'));
    const content = await fs.readFile(modulePath, 'utf8');
    expect(content).toContain('export function empty');
  });

  it('ensureUtilityModule updates existing module with new functions', async () => {
    const manager1 = createUtilityManager({
      utilityStyle: 'module',
      utilityModule: 'php-utils'
    });

    // First pass: create with empty
    manager1.registerFunction('empty');
    await manager1.ensureUtilityModule(testOutputDir);

    // Second pass: add isset
    const manager2 = createUtilityManager({
      utilityStyle: 'module',
      utilityModule: 'php-utils'
    });
    manager2.registerFunction('isset');
    await manager2.ensureUtilityModule(testOutputDir);

    // Verify both functions are present
    const modulePath = path.join(testOutputDir, 'php-utils.js');
    const content = await fs.readFile(modulePath, 'utf8');
    expect(content).toContain('export function empty');
    expect(content).toContain('export function isset');
  });

  it('does not generate module for inline style', async () => {
    const manager = createUtilityManager({
      utilityStyle: 'inline',
      utilityModule: 'php-utils'
    });

    manager.registerFunction('empty');
    const modulePath = await manager.ensureUtilityModule(testOutputDir);

    expect(modulePath).toBeNull();
  });

  it('generates module with all available functions when requested', async () => {
    const manager = createUtilityManager({
      utilityStyle: 'module',
      utilityModule: 'php-utils'
    });

    // Generate with all functions
    const modulePath = await manager.generateUtilityModule(testOutputDir, null);

    const content = await fs.readFile(modulePath, 'utf8');
    expect(content).toContain('export function empty');
    expect(content).toContain('export function isset');
    expect(content).toContain('export function array_key_exists');
  });
});
