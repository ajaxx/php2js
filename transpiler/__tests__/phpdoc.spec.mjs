import { describe, it, expect } from 'vitest';
import { transpile } from '../transpiler.mjs';

async function run(code) {
  return await transpile(code, { filename: 'phpdoc.php' });
}

describe('PHPDoc Comment Preservation', () => {
  it('preserves PHPDoc comments on functions', async () => {
    const php = `/**
 * Calculate the sum of two numbers
 * 
 * @param int $a First number
 * @param int $b Second number
 * @return int The sum
 */
function add($a, $b) {
    return $a + $b;
}`;
    const out = await run(php);
    expect(out).toContain('/**');
    expect(out).toContain('* Calculate the sum of two numbers');
    expect(out).toContain('@param {int} a First number');
    expect(out).toContain('@param {int} b Second number');
    expect(out).toContain('@returns {int} The sum');
    expect(out).toContain('export function add(a, b) {');
  });

  it('preserves PHPDoc comments on methods', async () => {
    const php = `class Calculator {
    /**
     * Multiply two numbers
     * @param float $x First number
     * @param float $y Second number
     * @return float Product
     */
    public function multiply($x, $y) {
        return $x * $y;
    }
}`;
    const out = await run(php);
    expect(out).toContain('/**');
    expect(out).toContain('* Multiply two numbers');
    expect(out).toContain('@param {float} x First number');
    expect(out).toContain('@param {float} y Second number');
    expect(out).toContain('@returns {float} Product');
    expect(out).toContain('multiply(x, y) {');
  });

  it('handles PHPDoc with multiple parameter types', async () => {
    const php = `/**
 * Process data
 * @param string|array $data Input data
 * @param bool $strict Strict mode
 * @return mixed Result
 */
function process($data, $strict = false) {
    return $data;
}`;
    const out = await run(php);
    expect(out).toContain('@param {string|array} data Input data');
    expect(out).toContain('@param {bool} strict Strict mode');
    expect(out).toContain('@returns {mixed} Result');
  });

  it('preserves PHPDoc on static methods', async () => {
    const php = `class Utils {
    /**
     * Static helper method
     * @param string $text Input text
     * @return string Processed text
     */
    public static function process($text) {
        return $text;
    }
}`;
    const out = await run(php);
    expect(out).toContain('/**');
    expect(out).toContain('* Static helper method');
    expect(out).toContain('@param {string} text Input text');
    expect(out).toContain('@returns {string} Processed text');
    expect(out).toContain('static process(text) {');
  });

  it('handles functions without PHPDoc', async () => {
    const php = `function simple($x) {
    return $x * 2;
}`;
    const out = await run(php);
    expect(out).not.toContain('/**');
    expect(out).toContain('export function simple(x) {');
  });

  it('preserves complex PHPDoc with @throws and @see', async () => {
    const php = `/**
 * Load a file
 * @param string $path File path
 * @throws Exception If file not found
 * @see readFile()
 * @return string File contents
 */
function loadFile($path) {
    return file_get_contents($path);
}`;
    const out = await run(php);
    expect(out).toContain('@param {string} path File path');
    expect(out).toContain('@throws Exception If file not found');
    expect(out).toContain('@see readFile()');
    expect(out).toContain('@returns {string} File contents');
  });
});
