/**
 * AST-Based PHP to JavaScript Transpiler
 * 
 * This is a new implementation using Abstract Syntax Tree parsing
 * for more reliable and maintainable code transformation.
 * 
 * The existing convert.mjs uses regex-based transformations and remains intact.
 */

import { Engine } from 'php-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import log4js from 'log4js';
import { createUtilityManager } from './php-utils-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logging
log4js.configure({
    appenders: {
        console: { type: 'console' },
        file: { type: 'file', filename: path.join(__dirname, '..', 'php2js-ast-transpiler.log') }
    },
    categories: {
        default: { appenders: ['console', 'file'], level: 'info' }
    }
});

const logger = log4js.getLogger('ast-transpiler');

// Initialize PHP parser
const parser = new Engine({
    parser: {
        extractDoc: true,
        suppressErrors: false
    },
    ast: {
        withPositions: true,
        withSource: true
    },
    lexer: {
        all_tokens: true,
        comment_tokens: true,
        mode_eval: false,
        asp_tags: false,
        short_tags: false
    }
});

// -------------------------------------------------------------
// Optional Prettier support
// -------------------------------------------------------------
let prettier = null;
async function loadPrettier() {
    if (prettier !== null) return prettier;
    try {
        // Dynamic import so it's optional
        const mod = await import('prettier');
        prettier = mod?.default || mod;
    } catch (e) {
        logger.warn('Prettier not available. Skipping formatting.');
        prettier = null;
    }
    return prettier;
}

async function formatCode(code, filePath) {
    if (!prettier) return code;
    try {
        return await prettier.format(code, { filepath: filePath, parser: 'babel' });
    } catch (e) {
        logger.warn(`Prettier failed for ${filePath}: ${e.message}`);
        return code;
    }
}

// -------------------------------------------------------------
// CLI argument parsing (parity with regex/convert.mjs)
// -------------------------------------------------------------
function parseArgs() {
    const args = process.argv.slice(2);
    const out = {
        src: null,
        dst: null,
        recurse: true,
        stats: false,
        logLevel: 'info',
        format: false,
        interfaceStyle: 'abstract-class',
        utilityStyle: 'inline',
        utilityModule: 'php-utils',
        unsetStyle: 'comment',
        defineStyle: 'const',
    };
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--src') out.src = path.resolve(args[++i]);
        else if (a === '--dst') out.dst = path.resolve(args[++i]);
        else if (a === '--recurse') {
            // Check if next arg is a value or another flag
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('--')) {
                const val = nextArg.toLowerCase();
                out.recurse = val === 'true' || val === '1' || val === 'yes';
                i++;
            } else {
                // No value provided, treat as flag to enable recursion
                out.recurse = true;
            }
        } else if (a === '--no-recurse') {
            out.recurse = false;
        } else if (a === '--stats') {
            out.stats = true;
        } else if (a === '--log-level') {
            out.logLevel = (args[++i] || 'info').toLowerCase();
        } else if (a === '--format') {
            out.format = true;
        } else if (a === '--interface-style') {
            const style = (args[++i] || 'abstract-class').toLowerCase();
            const validStyles = ['abstract-class', 'comment', 'jsdoc', 'empty-class'];
            if (validStyles.includes(style)) {
                out.interfaceStyle = style;
            } else {
                logger.warn(`Invalid interface-style '${style}'. Using default 'abstract-class'.`);
            }
        } else if (a === '--utility-style') {
            const style = (args[++i] || 'inline').toLowerCase();
            const validStyles = ['module', 'inline', 'none'];
            if (validStyles.includes(style)) {
                out.utilityStyle = style;
            } else {
                logger.warn(`Invalid utility-style '${style}'. Using default 'inline'.`);
            }
        } else if (a === '--utility-module') {
            out.utilityModule = args[++i] || 'php-utils';
        } else if (a === '--unset-style') {
            const style = (args[++i] || 'comment').toLowerCase();
            const validStyles = ['delete', 'comment'];
            if (validStyles.includes(style)) {
                out.unsetStyle = style;
            } else {
                logger.warn(`Invalid unset-style '${style}'. Using default 'comment'.`);
            }
        } else if (a === '--define-style') {
            const style = (args[++i] || 'const').toLowerCase();
            const validStyles = ['const', 'export-const', 'comment'];
            if (validStyles.includes(style)) {
                out.defineStyle = style;
            } else {
                logger.warn(`Invalid define-style '${style}'. Using default 'const'.`);
            }
        } else if (!out.src) {
            // Backwards-compatible positional input
            out.src = path.resolve(a);
        } else if (!out.dst) {
            // Backwards-compatible positional output
            out.dst = path.resolve(a);
        }
    }
    return out;
}

// -------------------------------------------------------------
// File collection helpers
// -------------------------------------------------------------
async function pathExists(p) {
    try { await fs.stat(p); return true; } catch { return false; }
}

async function isDirectory(p) {
    try { const st = await fs.stat(p); return st.isDirectory(); } catch { return false; }
}

async function collectPhpFiles(root, recurse) {
    const results = [];
    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const ent of entries) {
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                if (recurse) await walk(full);
            } else if (/\.php$/i.test(ent.name)) {
                results.push(full);
            }
        }
    }
    if (await isDirectory(root)) {
        await walk(root);
    } else if (/\.php$/i.test(root)) {
        results.push(root);
    }
    return results;
}

function computeOutPath(srcRoot, file, dstRoot) {
    if (!srcRoot) {
        // single file mode: out path is dstRoot (file path)
        if (dstRoot && !dstRoot.endsWith('.js')) {
            // if dst is a directory, mirror file name
            const baseJs = path.basename(file).replace(/\.php$/i, '.js');
            return path.join(dstRoot, baseJs);
        }
        return dstRoot || file.replace(/\.php$/i, '.js');
    } else {
        // directory mode: preserve relative path
        const rel = path.relative(srcRoot, file);
        const relJs = rel.replace(/\.php$/i, '.js');
        return path.join(dstRoot, relJs);
    }
}

/**
 * AST Visitor Pattern
 * Walks through the AST and applies transformations
 */
class ASTTransformer {
    constructor(options = {}) {
        this.output = [];
        this.indent = 0;
        this.currentScope = null;
        this.conditionalDepth = 0; // Track depth inside conditional blocks
        this.usesSuperGlobals = false; // Track if module uses superglobals
        this.interfaceStyle = options.interfaceStyle || 'abstract-class';
        this.unsetStyle = options.unsetStyle || 'comment';
        this.defineStyle = options.defineStyle || 'const';
        this.utilityManager = options.utilityManager || createUtilityManager({
            utilityStyle: options.utilityStyle || 'inline',
            utilityModule: options.utilityModule || 'php-utils'
        });
    }

    /**
     * Main entry point for transforming PHP AST to JavaScript
     */
    transform(ast) {
        if (!ast || !ast.children) {
            return '';
        }

        this.output = [];
        this.indent = 0;
        this.usesSuperGlobals = false; // Reset flag

        // Add file header
        this.addHeader();

        // Process all top-level nodes
        for (const node of ast.children) {
            this.visit(node);
        }

        // Add footer
        this.addFooter();

        let result = this.output.join('');
        
        // Wrap in IIFE if superglobals are used
        if (this.usesSuperGlobals) {
            result = this.wrapInSuperglobalScope(result);
        }

        return result;
    }
    
    /**
     * Inject superglobal reference for modules using superglobals
     * Instead of wrapping in IIFE (which breaks exports), inject _ as a top-level constant
     */
    wrapInSuperglobalScope(code) {
        const lines = code.split('\n');
        const result = [];
        let foundFirstNonComment = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Keep header comments
            if (!foundFirstNonComment && (line.startsWith('//') || trimmed === '')) {
                result.push(line);
                continue;
            }
            
            // Inject _ reference before first non-comment line
            if (!foundFirstNonComment && trimmed !== '') {
                foundFirstNonComment = true;
                result.push('// Superglobal reference for $_GET, $_POST, $_SERVER, etc.');
                result.push('const _ = typeof globalThis !== \'undefined\' ? globalThis : (typeof window !== \'undefined\' ? window : global);');
                result.push('');
            }
            
            result.push(line);
        }
        
        return result.join('\n');
    }

    /**
     * Visit a node and dispatch to appropriate handler
     */
    visit(node) {
        if (!node || !node.kind) {
            return;
        }

        const methodName = `visit${node.kind.charAt(0).toUpperCase()}${node.kind.slice(1)}`;
        
        if (typeof this[methodName] === 'function') {
            this[methodName](node);
        } else {
            logger.warn(`No visitor for node kind: ${node.kind}`);
            this.visitDefault(node);
        }
    }

    /**
     * Default visitor for unhandled node types
     */
    visitDefault(node) {
        logger.debug(`Visiting default node: ${node.kind}`);
        
        // Try to visit children if they exist
        if (node.children) {
            for (const child of node.children) {
                this.visit(child);
            }
        }
    }


    /**
     * Visit Program node (root)
     */
    visitProgram(node) {
        for (const child of node.children) {
            this.visit(child);
        }
    }

    /**
     * Write PHPDoc comment as JSDoc
     */
    writePhpDocComment(node) {
        if (!node.leadingComments || node.leadingComments.length === 0) {
            return;
        }

        // Find the last comment block (PHPDoc)
        const phpDoc = node.leadingComments[node.leadingComments.length - 1];
        if (phpDoc.kind === 'commentblock' && phpDoc.value.trim().startsWith('/**')) {
            // Convert PHPDoc to JSDoc
            const lines = phpDoc.value.split('\n');
            for (const line of lines) {
                // Replace PHP type hints with JS equivalents
                let jsLine = line
                    .replace(/\$(\w+)/g, '$1')  // Remove $ from variable names
                    .replace(/@param\s+([\w|\\[\]]+)\s+/g, '@param {$1} ')  // Convert @param type $var to @param {type} var (handles union types)
                    .replace(/@return\s+([\w|\\[\]]+)\s+/g, '@returns {$1} '); // Convert @return to @returns (handles union types)
                
                this.writeLine(jsLine);
            }
        }
    }

    /**
     * Visit Namespace node
     */
    visitNamespace(node) {
        this.writeLine(`// Namespace: ${node.name}`);
        
        // Track scope for constant declarations
        const prevScope = this.currentScope;
        this.currentScope = 'namespace';
        
        for (const child of node.children) {
            this.visit(child);
        }
        
        this.currentScope = prevScope;
    }

    /**
     * Visit Function declaration
     */
    visitFunction(node) {
        const name = node.name.name || node.name;
        const params = this.transformParameters(node.arguments);
        
        // Write PHPDoc comment if present
        this.writePhpDocComment(node);
        
        // Only export at true top level (not inside conditionals or other scopes)
        const isTopLevel = (this.currentScope == null && this.conditionalDepth === 0);
        const exportPrefix = isTopLevel ? 'export ' : '';
        
        this.writeLine(`${exportPrefix}function ${name}(${params}) {`);
        this.indent++;
        
        // Track scope for define() handling
        const prevScope = this.currentScope;
        this.currentScope = 'function';
        
        if (node.body && node.body.children) {
            for (const stmt of node.body.children) {
                this.visit(stmt);
            }
        }
        
        this.currentScope = prevScope;
        this.indent--;
        this.writeLine('}');
        this.writeLine('');
    }

    /**
     * Visit Class declaration
     */
    visitClass(node) {
        const name = node.name.name || node.name;
        const extendsClause = node.extends ? ` extends ${node.extends.name}` : '';
        
        // Only export at true top level (not inside conditionals or other scopes)
        const isTopLevel = (this.currentScope == null && this.conditionalDepth === 0);
        const exportPrefix = isTopLevel ? 'export ' : '';
        
        this.writeLine(`${exportPrefix}class ${name}${extendsClause} {`);
        this.indent++;
        
        if (node.body) {
            for (const item of node.body) {
                this.visit(item);
            }
        }
        
        this.indent--;
        this.writeLine('}');
        this.writeLine('');
    }

    /**
     * Visit Property statement (class property declaration)
     */
    visitPropertystatement(node) {
        const visibility = node.visibility || 'public';
        const isStatic = node.isStatic ? 'static ' : '';
        const properties = node.properties || [];
        
        for (const prop of properties) {
            const propName = prop.name.name || prop.name;
            if (prop.value) {
                const value = this.transformExpression(prop.value);
                this.writeLine(`${isStatic}${propName} = ${value};`);
            } else {
                this.writeLine(`${isStatic}${propName};`);
            }
        }
    }

    /**
     * Visit Class constant declaration
     */
    visitClassconstant(node) {
        const isStatic = 'static ';
        const constants = node.constants || [];
        
        for (const constant of constants) {
            const constName = constant.name.name || constant.name;
            if (constant.value) {
                const value = this.transformExpression(constant.value);
                this.writeLine(`${isStatic}${constName} = ${value};`);
            } else {
                this.writeLine(`${isStatic}${constName};`);
            }
        }
    }

    /**
     * Visit Method declaration
     */
    visitMethod(node) {
        const name = node.name.name || node.name;
        const params = this.transformParameters(node.arguments);
        const isStatic = node.isStatic ? 'static ' : '';
        
        // Write PHPDoc comment if present
        this.writePhpDocComment(node);
        
        this.writeLine(`${isStatic}${name}(${params}) {`);
        this.indent++;
        
        if (node.body && node.body.children) {
            for (const stmt of node.body.children) {
                this.visit(stmt);
            }
        }
        
        this.indent--;
        this.writeLine('}');
        this.writeLine('');
    }

    /**
     * Visit Variable declaration/assignment
     */
    visitAssign(node) {
        // Array append: $arr[] = expr;
        if (node.left && node.left.kind === 'offsetlookup' && !node.left.offset) {
            const arrName = this.transformExpression(node.left.what);
            const val = this.transformExpression(node.right);
            this.writeLine(`${arrName}.push(${val});`);
            return;
        }

        const left = this.transformExpression(node.left);
        const right = this.transformExpression(node.right);
        let operator = node.operator || '=';
        if (operator === '.=') operator = '+=';
        
        this.writeLine(`${left} ${operator} ${right};`);
    }

    /**
     * Visit Expression statement
     */
    visitExpressionstatement(node) {
        if (node.expression) {
            // Handle include/require nodes
            if (node.expression.kind === 'include') {
                this.handleIncludeNode(node.expression);
                return;
            }
            // Handle define('NAME', value) at expression level
            if (node.expression.kind === 'call') {
                const calleeExpr = this.transformExpression(node.expression.what);
                if (calleeExpr === 'define' && node.expression.arguments?.length >= 2) {
                    const nameArg = node.expression.arguments[0];
                    const valArg = node.expression.arguments[1];
                    if (nameArg.kind === 'string') {
                        const constName = String(nameArg.value).replace(/[^A-Za-z0-9_]/g, '_');
                        const jsVal = this.transformExpression(valArg);
                        
                        // Determine prefix based on defineStyle option
                        let prefix;
                        if (this.defineStyle === 'comment') {
                            // Comment style: just add a comment
                            this.writeLine(`// define('${nameArg.value}', ${jsVal});`);
                            return;
                        } else if (this.defineStyle === 'export-const') {
                            // Export-const style: use export const only at true top level
                            const isTopLevel = (this.currentScope == null && this.conditionalDepth === 0);
                            prefix = isTopLevel ? 'export const' : 'const';
                        } else {
                            // Default 'const' style: always use const (safe everywhere)
                            prefix = 'const';
                        }
                        
                        this.writeLine(`${prefix} ${constName} = ${jsVal};`);
                        return;
                    }
                }
            }
            if (node.expression.kind === 'assign') {
                this.visitAssign(node.expression);
            } else {
                const expr = this.transformExpression(node.expression);
                this.writeLine(`${expr};`);
            }
        }
    }

    /**
     * Visit Echo statement
     */
    visitEcho(node) {
        const args = node.expressions.map(expr => this.transformExpression(expr)).join(', ');
        this.writeLine(`console.log(${args});`);
    }

    /**
     * Map PHP include/require to JS import (supports simple string literal targets)
     */
    handleIncludeNode(node) {
        const targetExpr = node.target;
        if (targetExpr && targetExpr.kind === 'string') {
            let jsPath = String(targetExpr.value || '');
            if (!jsPath.startsWith('.') && !jsPath.startsWith('/')) {
                jsPath = './' + jsPath;
            }
            jsPath = jsPath.replace(/\\/g, '/').replace(/\.php$/i, '.js');
            this.writeLine(`import '${jsPath}';`);
            return;
        }
        const expr = this.transformExpression(targetExpr);
        const kind = node.require ? 'require' : (node.once ? 'include_once/require_once' : 'include');
        this.writeLine(`// TODO: import equivalent of ${expr} (from ${kind})`);
    }
    /**
     * Visit Return statement
     */
    visitReturn(node) {
        if (node.expr) {
            const expr = this.transformExpression(node.expr);
            this.writeLine(`return ${expr};`);
        } else {
            this.writeLine('return;');
        }
    }

    /**
     * Visit If statement
     */
    visitIf(node) {
        const test = this.transformExpression(node.test);
        
        this.writeLine(`if (${test}) {`);
        this.indent++;
        this.conditionalDepth++; // Entering conditional block
        
        if (node.body) {
            this.visit(node.body);
        }
        
        this.conditionalDepth--; // Exiting conditional block
        this.indent--;
        
        if (node.alternate) {
            if (node.alternate.kind === 'if') {
                this.write('} else ');
                this.visitIf(node.alternate);
            } else {
                this.writeLine('} else {');
                this.indent++;
                this.conditionalDepth++; // Entering else block
                this.visit(node.alternate);
                this.conditionalDepth--; // Exiting else block
                this.indent--;
                this.writeLine('}');
            }
        } else {
            this.writeLine('}');
        }
    }

    /**
     * Visit For/Foreach loop
     */
    visitForeach(node) {
        const source = this.transformExpression(node.source);
        
        if (node.key && node.value) {
            // foreach ($array as $key => $value)
            const key = this.transformExpression(node.key);
            const value = this.transformExpression(node.value);
            this.writeLine(`for (const [${key}, ${value}] of Object.entries(${source})) {`);
        } else {
            // foreach ($array as $value)
            const value = this.transformExpression(node.value);
            this.writeLine(`for (const ${value} of ${source}) {`);
        }
        
        this.indent++;
        
        if (node.body) {
            this.visit(node.body);
        }
        
        this.indent--;
        this.writeLine('}');
    }

    /**
     * Visit While loop
     */
    visitWhile(node) {
        const test = this.transformExpression(node.test);
        this.writeLine(`while (${test}) {`);
        this.indent++;
        if (node.body) {
            this.visit(node.body);
        }
        this.indent--;
        this.writeLine('}');
    }

    /**
     * Visit For loop
     */
    visitFor(node) {
        const init = node.init ? node.init.map(i => this.transformExpression(i)).join(', ') : '';
        const test = node.test ? node.test.map(t => this.transformExpression(t)).join(', ') : '';
        const increment = node.increment ? node.increment.map(i => this.transformExpression(i)).join(', ') : '';
        
        this.writeLine(`for (${init}; ${test}; ${increment}) {`);
        this.indent++;
        if (node.body) {
            this.visit(node.body);
        }
        this.indent--;
        this.writeLine('}');
    }

    /**
     * Visit Exit/Die statement (handled as expression)
     */
    visitExit(node) {
        if (node.expression) {
            const msg = this.transformExpression(node.expression);
            this.writeLine(`throw new Error(${msg});`);
        } else {
            this.writeLine('throw new Error("Script terminated");');
        }
    }

    /**
     * Visit Switch statement
     */
    visitSwitch(node) {
        const test = this.transformExpression(node.test);
        this.writeLine(`switch (${test}) {`);
        this.indent++;
        
        if (node.body && node.body.children) {
            for (const child of node.body.children) {
                this.visit(child);
            }
        }
        
        this.indent--;
        this.writeLine('}');
    }

    /**
     * Visit Case statement
     */
    visitCase(node) {
        if (node.test) {
            const test = this.transformExpression(node.test);
            this.writeLine(`case ${test}:`);
        } else {
            this.writeLine('default:');
        }
        this.indent++;
        if (node.body && node.body.children) {
            for (const child of node.body.children) {
                this.visit(child);
            }
        }
        this.indent--;
    }

    /**
     * Visit Break statement
     */
    visitBreak(node) {
        this.writeLine('break;');
    }

    /**
     * Visit Continue statement
     */
    visitContinue(node) {
        this.writeLine('continue;');
    }

    /**
     * Visit Unset statement
     */
    visitUnset(node) {
        if (node.variables && node.variables.length > 0) {
            for (const variable of node.variables) {
                const varName = this.transformExpression(variable);
                
                if (this.unsetStyle === 'delete') {
                    // Use delete operator (may not work in strict mode)
                    this.writeLine(`delete ${varName};`);
                } else {
                    // Default: comment style (safe for strict mode)
                    this.writeLine(`// unset(${varName});`);
                }
            }
        }
    }

    /**
     * Visit Global statement
     */
    visitGlobal(node) {
        // Track global variables for potential hoisting
        // For now, just emit a comment
        const vars = node.items.map(v => this.transformExpression(v)).join(', ');
        this.writeLine(`// global ${vars}`);
    }

    /**
     * Visit Static variable declaration
     */
    visitStatic(node) {
        // PHP static variables maintain state between function calls
        // In JS, we'll use a comment and regular let declaration
        if (node.variables && node.variables.length > 0) {
            for (const item of node.variables) {
                // Get variable name - handle both direct name and variable node
                let varName = '';
                if (item.variable) {
                    if (typeof item.variable === 'string') {
                        varName = item.variable;
                    } else if (item.variable.name) {
                        varName = item.variable.name;
                    } else {
                        varName = this.transformExpression(item.variable);
                    }
                }
                
                if (item.defaultValue) {
                    const value = this.transformExpression(item.defaultValue);
                    this.writeLine(`let ${varName} = ${value}; // static`);
                } else {
                    this.writeLine(`let ${varName}; // static`);
                }
            }
        }
    }

    /**
     * Visit Do-While loop
     */
    visitDo(node) {
        this.writeLine('do {');
        this.indent++;
        if (node.body) {
            this.visit(node.body);
        }
        this.indent--;
        const test = this.transformExpression(node.test);
        this.writeLine(`} while (${test});`);
    }

    /**
     * Visit Try-Catch-Finally statement
     */
    visitTry(node) {
        this.writeLine('try {');
        this.indent++;
        if (node.body) {
            this.visit(node.body);
        }
        this.indent--;
        this.writeLine('}');
        
        // Handle catch blocks
        if (node.catches && node.catches.length > 0) {
            for (const catchBlock of node.catches) {
                this.visitCatch(catchBlock);
            }
        }
        
        // Handle finally block
        if (node.always) {
            this.writeLine('finally {');
            this.indent++;
            this.visit(node.always);
            this.indent--;
            this.writeLine('}');
        }
    }

    /**
     * Visit Catch block
     */
    visitCatch(node) {
        const varName = node.variable ? (node.variable.name || this.transformExpression(node.variable)) : 'e';
        
        // Get exception type name
        let exceptionType = 'Error';
        if (node.what) {
            if (Array.isArray(node.what)) {
                // Multiple exception types (PHP 7.1+)
                exceptionType = node.what.map(w => w.name || this.transformExpression(w)).join(' | ');
            } else if (typeof node.what === 'string') {
                exceptionType = node.what;
            } else if (node.what.name) {
                exceptionType = node.what.name;
            } else {
                exceptionType = this.transformExpression(node.what);
            }
        }
        
        this.writeLine(`catch (${varName}) {`);
        this.indent++;
        
        // Add type check comment if specific exception type
        if (exceptionType && exceptionType !== 'Exception' && exceptionType !== 'Error') {
            this.writeLine(`// Catch ${exceptionType}`);
        }
        
        if (node.body) {
            this.visit(node.body);
        }
        this.indent--;
        this.writeLine('}');
    }

    /**
     * Visit Throw statement
     */
    visitThrow(node) {
        if (node.what) {
            const expr = this.transformExpression(node.what);
            this.writeLine(`throw ${expr};`);
        } else {
            this.writeLine('throw new Error();');
        }
    }

    /**
     * Visit Noop (no-operation) node
     */
    visitNoop(node) {
        // No-op nodes don't generate any output
        // They're typically used as placeholders in the AST
    }

    /**
     * Visit Constant statement (top-level const declaration)
     */
    visitConstantstatement(node) {
        // PHP 7.1+ allows const declarations at namespace/global level
        const constants = node.constants || [];
        
        for (const constant of constants) {
            const constName = constant.name.name || constant.name;
            if (constant.value) {
                const value = this.transformExpression(constant.value);
                const prefix = (this.currentScope == null) ? 'export const' : 'const';
                this.writeLine(`${prefix} ${constName} = ${value};`);
            }
        }
    }

    /**
     * Visit Use group (grouped import statements)
     */
    visitUsegroup(node) {
        // Grouped use statements: use Namespace\{ClassA, ClassB};
        const prefix = node.name || '';
        const items = node.items || [];
        
        for (const item of items) {
            const name = item.name || '';
            const alias = item.alias || name;
            const fullName = prefix ? `${prefix}\\${name}` : name;
            const jsPath = fullName.replace(/\\/g, '/');
            
            if (alias && alias !== name) {
                this.writeLine(`import ${alias} from './${jsPath}.js';`);
            } else {
                this.writeLine(`import '${jsPath}.js';`);
            }
        }
    }

    /**
     * Visit Declare statement
     */
    visitDeclare(node) {
        // Convert declare statements to comments
        // PHP declare directives don't have direct JS equivalents
        const directives = node.directives || [];
        
        const directiveStr = directives.map(directive => {
            const key = directive.key?.name || '';
            const value = directive.value?.value ?? '';
            return `${key}=${value}`;
        }).join(', ');
        
        this.writeLine(`// declare(${directiveStr})`);
        
        // If there's a body, still process it
        if (node.mode === 'block' && node.children) {
            for (const child of node.children) {
                this.visit(child);
            }
        }
    }

    /**
     * Visit Interface declaration
     */
    visitInterface(node) {
        const name = node.name?.name || node.name || 'UnknownInterface';
        const methods = node.body || [];
        
        switch (this.interfaceStyle) {
            case 'abstract-class':
                // Convert to abstract class with error-throwing methods
                this.writeLine(`export class ${name} {`);
                this.indent++;
                
                for (const method of methods) {
                    if (method.kind === 'method') {
                        const methodName = method.name?.name || method.name;
                        const params = this.transformParameters(method.arguments || []);
                        const isStatic = method.isStatic ? 'static ' : '';
                        
                        this.writeLine(`${isStatic}${methodName}(${params}) {`);
                        this.indent++;
                        this.writeLine(`throw new Error('Method ${methodName}() must be implemented');`);
                        this.indent--;
                        this.writeLine('}');
                        this.writeLine('');
                    }
                }
                
                this.indent--;
                this.writeLine('}');
                break;
                
            case 'comment':
                // Convert to comment block
                this.writeLine(`// interface ${name} {`);
                for (const method of methods) {
                    if (method.kind === 'method') {
                        const methodName = method.name?.name || method.name;
                        const params = this.transformParameters(method.arguments || []);
                        const isStatic = method.isStatic ? 'static ' : '';
                        this.writeLine(`//     ${isStatic}${methodName}(${params});`);
                    }
                }
                this.writeLine(`// }`);
                break;
                
            case 'jsdoc':
                // Convert to JSDoc interface
                this.writeLine(`/**`);
                this.writeLine(` * @interface ${name}`);
                for (const method of methods) {
                    if (method.kind === 'method') {
                        const methodName = method.name?.name || method.name;
                        const params = method.arguments || [];
                        const paramList = params.map(p => {
                            const paramName = p.name?.name || p.name || '';
                            return `{*} ${paramName}`;
                        }).join(', ');
                        this.writeLine(` * @method ${methodName}(${paramList})`);
                    }
                }
                this.writeLine(` */`);
                this.writeLine(`export class ${name} {}`);
                break;
                
            case 'empty-class':
                // Convert to empty class
                this.writeLine(`export class ${name} {}`);
                break;
                
            default:
                logger.warn(`Unknown interface style: ${this.interfaceStyle}`);
                this.writeLine(`export class ${name} {}`);
        }
        
        this.writeLine('');
    }

    /**
     * Visit Block statement
     */
    visitBlock(node) {
        if (node.children) {
            for (const child of node.children) {
                this.visit(child);
            }
        }
    }

    /**
     * Visit Inline HTML
     */
    visitInline(node) {
        if (node.value) {
            const lines = node.value.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
                const escaped = lines.map(l => {
                    const trimmed = l.trim();
                    return `\`${trimmed.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
                });
                this.writeLine(`__outputHtml([`);
                this.indent++;
                for (const line of escaped) {
                    this.writeLine(`${line},`);
                }
                this.indent--;
                this.writeLine(`]);`);
            }
        }
    }

    /**
     * Escape JavaScript reserved keywords by appending underscore
     * Note: 'this' and 'super' are excluded as they're valid in their PHP contexts
     */
    escapeReservedKeyword(name) {
        const reserved = new Set([
            'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
            'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
            'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
            'return', 'switch', 'throw', 'try', 'typeof', 'var',
            'void', 'while', 'with', 'yield', 'enum', 'implements', 'interface',
            'package', 'private', 'protected', 'public', 'static', 'await'
        ]);
        
        if (reserved.has(name)) {
            return name + '_';
        }
        return name;
    }

    /**
     * Transform function parameters
     */
    transformParameters(params) {
        if (!params || params.length === 0) return '';
        return params.map(p => {
            const name = p.name.name || p.name;
            const cleanName = name.replace(/^\$/, '');
            const escapedName = this.escapeReservedKeyword(cleanName);
            // Handle variadic parameters
            if (p.variadic || p.kind === 'variadic') {
                return `...${escapedName}`;
            }
            return escapedName;
        }).join(', ');
    }

    /**
     * Transform an expression node to JavaScript
     */
    transformExpression(node) {
        if (!node) {
            return '';
        }

        switch (node.kind) {
            case 'string':
                // Handle string literals
                if (node.isDoubleQuote) {
                    const val = String(node.value || '');
                    if (/\$[A-Za-z_][A-Za-z0-9_]*/.test(val)) {
                        // Convert to template literal with ${var}
                        const tpl = val
                            .replace(/\\/g, '\\\\')
                            .replace(/`/g, '\\`')
                            .replace(/\$(\w+)/g, '${$1}');
                        return '`' + tpl + '`';
                    }
                    // Escape special characters in double-quoted strings
                    const escaped = val
                        .replace(/\\/g, '\\\\')
                        .replace(/"/g, '\\"')
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\t/g, '\\t');
                    return `"${escaped}"`;
                }
                // Single-quoted strings - escape single quotes and backslashes
                const singleQuoted = String(node.value || '')
                    .replace(/\\/g, '\\\\')
                    .replace(/'/g, "\\'");
                return `'${singleQuoted}'`;
            
            case 'number':
                return String(node.value);
            
            case 'boolean':
                return String(node.value);
            
            case 'bin':
                // Binary operations (., +, -, *, /, etc.)
                const left = this.transformExpression(node.left);
                const right = this.transformExpression(node.right);
                let op = node.type;
                
                // Transform PHP operators to JS
                if (op === '.') op = '+';  // String concatenation
                if (op === '==') op = '===';  // Equality
                if (op === '!=') op = '!==';  // Inequality
                
                return `${left} ${op} ${right}`;
            
            case 'unary':
                {
                    const arg = this.transformExpression(node.what);
                    const op = node.type;
                    // Handle error control operator @
                    if (op === '@') {
                        return `/* @suppress-errors */ ${arg}`;
                    }
                    return `${op}${arg}`;
                }
            
            case 'propertylookup':
            case 'staticlookup':
                // Object/static property or method access: $obj->prop or Class::prop
                const obj = this.transformExpression(node.what);
                const propExpr = node.offset ? (node.offset.name || this.transformExpression(node.offset)) : '';
                return `${obj}.${propExpr}`;
            
            case 'call':
                // Function call
                const callee = this.transformExpression(node.what);
                const args = node.arguments.map(arg => this.transformExpression(arg)).join(', ');
                return `${callee}(${args})`;

            case 'offsetlookup':
                // Array or string index access: what[offset]
                {
                    const base = this.transformExpression(node.what);
                    if (!node.offset) return `${base}[]`;
                    const idx = this.transformExpression(node.offset);
                    return `${base}[${idx}]`;
                }
            
            case 'array':
                // Array literal
                if (this.isAssociativeArray(node)) {
                    // Associative array -> object
                    const entries = node.items.map(item => {
                        const key = this.transformExpression(item.key);
                        const value = this.transformExpression(item.value);
                        return `${key}: ${value}`;
                    }).join(', ');
                    return `{ ${entries} }`;
                } else {
                    // Indexed array
                    const items = node.items.map(item => this.transformExpression(item.value)).join(', ');
                    return `[${items}]`;
                }
            
            case 'encapsed':
                // String interpolation
                return this.transformEncapsedString(node);
            
            case 'encapsedpart':
                // Part of an encapsed string (plain text fragment)
                return node.value || '';
            
            case 'isset':
                const vars = node.variables.map(v => this.transformExpression(v)).join(' && ');
                return `(typeof ${vars} !== 'undefined')`;
            
            case 'empty':
                {
                    const expr = this.transformExpression(node.expression);
                    
                    // Register and use the empty utility function
                    this.utilityManager.registerFunction('empty');
                    
                    const utilCall = this.utilityManager.getCallSyntax('empty', expr);
                    if (utilCall) {
                        return utilCall;
                    }
                    
                    // Fallback to simple negation if utility style is 'none'
                    return `!${expr}`;
                }
            
            case 'name':
                // Simple name/identifier (constants, function names, class names)
                {
                    const nm = node.name || '';
                    return this.escapeReservedKeyword(String(nm));
                }
            
            case 'constant':
                {
                    const nm = (node.name && (node.name.name || node.name)) || '';
                    return this.escapeReservedKeyword(String(nm));
                }
            
            case 'magic':
                // Magic constants like __DIR__, __FILE__
                {
                    const nm = node.value || '';
                    if (nm === '__DIR__') return '__dirname';
                    if (nm === '__FILE__') return '__filename';
                    return String(nm);
                }
            
            case 'post':
            case 'pre':
                // Post/pre increment/decrement: $x++ or ++$x
                {
                    const operand = this.transformExpression(node.what);
                    // node.type is '+' or '-', we need to double it
                    const op = node.type === '+' ? '++' : '--';
                    if (node.kind === 'post') {
                        return `${operand}${op}`;
                    } else {
                        return `${op}${operand}`;
                    }
                }
            
            case 'silent':
                // Error control operator @
                {
                    const inner = this.transformExpression(node.expr);
                    return `/* @suppress-errors */ ${inner}`;
                }
            
            case 'exit':
                // Exit/die as expression
                if (node.expression) {
                    const msg = this.transformExpression(node.expression);
                    return `throw new Error(${msg})`;
                } else {
                    return 'throw new Error("Script terminated")';
                }
            
            case 'cast':
                // Type cast - remove it, just return the expression
                return this.transformExpression(node.expr || node.what || node.value);
            
            case 'list':
                // Array destructuring: list($a, $b) -> [a, b]
                {
                    const items = node.items || [];
                    const elements = items.map(item => {
                        if (!item) return ''; // Skip empty slots
                        if (item.kind === 'entry') {
                            // Entry nodes have a 'value' property with the variable
                            return this.transformExpression(item.value);
                        } else if (item.kind === 'noop') {
                            // Empty slot in list
                            return '';
                        }
                        return this.transformExpression(item);
                    });
                    return `[${elements.join(', ')}]`;
                }

            case 'entry':
                // Array entry (used in list() destructuring)
                if (node.value) {
                    return this.transformExpression(node.value);
                }
                return '';
            
            case 'noop':
                // No-op placeholder (empty slot in list)
                return '';
            
            case 'assign':
                // Assignment expression (e.g., in for loop init)
                {
                    const left = this.transformExpression(node.left);
                    const right = this.transformExpression(node.right);
                    let operator = node.operator || '=';
                    if (operator === '.=') operator = '+=';
                    return `${left} ${operator} ${right}`;
                }
            
            case 'retif':
                // Ternary operator: condition ? trueExpr : falseExpr
                {
                    const test = this.transformExpression(node.test);
                    const trueExpr = this.transformExpression(node.trueExpr);
                    const falseExpr = this.transformExpression(node.falseExpr);
                    return `${test} ? ${trueExpr} : ${falseExpr}`;
                }
            
            case 'new':
                // New instance: new ClassName(args)
                {
                    const className = this.transformExpression(node.what);
                    const args = node.arguments ? node.arguments.map(arg => this.transformExpression(arg)).join(', ') : '';
                    return `new ${className}(${args})`;
                }
            
            case 'nullkeyword':
                // null keyword
                return 'null';
            
            case 'selfreference':
                // self:: reference in classes
                return 'this.constructor';
            
            case 'parentreference':
                // parent:: reference in classes
                return 'super';
            
            case 'assignref':
                // Reference assignment: $a =& $b
                // JavaScript doesn't have reference assignment, treat as regular assignment
                {
                    const left = this.transformExpression(node.left);
                    const right = this.transformExpression(node.right);
                    return `${left} = ${right} /* ref */`;
                }
            
            case 'variadic':
                // Variadic expression in call context (e.g., ...spread)
                {
                    const what = this.transformExpression(node.what);
                    return `...${what}`;
                }
            
            case 'classconstant':
                // Class constant: ClassName::CONSTANT
                {
                    const className = this.transformExpression(node.what);
                    const constName = node.offset ? (node.offset.name || this.transformExpression(node.offset)) : '';
                    return `${className}.${constName}`;
                }
            
            case 'closure':
                // Anonymous function / closure
                {
                    const params = this.transformParameters(node.arguments || []);
                    const uses = node.uses || [];
                    let usesComment = '';
                    if (uses.length > 0) {
                        const useVars = uses.map(u => {
                            const varName = u.name || this.transformExpression(u);
                            return u.byref ? `&${varName}` : varName;
                        }).join(', ');
                        usesComment = ` /* use (${useVars}) */`;
                    }
                    
                    let body = '';
                    if (node.body && node.body.children) {
                        const savedOutput = this.output;
                        const savedIndent = this.indent;
                        this.output = [];
                        this.indent = 0;
                        
                        for (const stmt of node.body.children) {
                            this.visit(stmt);
                        }
                        
                        body = this.output.join('');
                        this.output = savedOutput;
                        this.indent = savedIndent;
                    }
                    
                    return `(${params}) => {${usesComment}\n${body}}`;
                }
            
            case 'staticreference':
                // static:: keyword (late static binding)
                return 'this.constructor';
            
            case 'clone':
                // Clone object: clone $obj
                {
                    const what = this.transformExpression(node.what);
                    return `Object.assign({}, ${what})`;
                }
            
            case 'print':
                // Print expression: print $expr
                // In PHP, print is an expression that returns 1
                // We'll convert it to console.log() wrapped in a comma expression
                {
                    const expr = this.transformExpression(node.expression);
                    return `(console.log(${expr}), 1)`;
                }
            
            case 'variable':
                // Variable: $varName -> varName
                {
                    const raw = (node.name || '').replace(/^\$/, '');
                    // Map PHP superglobals to _.SUPERGLOBAL
                    const superMap = {
                        _GET: '_.GET',
                        _POST: '_.POST',
                        _SERVER: '_.SERVER',
                        _COOKIE: '_.COOKIE',
                        _SESSION: '_.SESSION',
                        _REQUEST: '_.REQUEST',
                        _FILES: '_.FILES'
                    };
                    if (Object.prototype.hasOwnProperty.call(superMap, raw)) {
                        this.usesSuperGlobals = true; // Mark that module uses superglobals
                        return superMap[raw];
                    }
                    // Escape JavaScript reserved keywords
                    return this.escapeReservedKeyword(raw);
                }

            default:
                logger.warn(`Unknown expression kind: ${node.kind}`);
                return `/* TODO: ${node.kind} */`;
        }
    }

    /**
     * Check if array is associative (has string keys)
     */
    isAssociativeArray(arrayNode) {
        if (!arrayNode.items || arrayNode.items.length === 0) {
            return false;
        }
        
        return arrayNode.items.some(item => item.key && item.key.kind === 'string');
    }

    /**
     * Transform encapsed (interpolated) string
     */
    transformEncapsedString(node) {
        let result = '`';
        const parts = Array.isArray(node.value)
            ? node.value
            : (Array.isArray(node.parts) ? node.parts : []);
        if (parts.length > 0) {
            for (const part of parts) {
                if (typeof part === 'string') {
                    result += part.replace(/`/g, '\\`');
                } else if (part && part.kind === 'encapsedpart') {
                    result += String(part.value || '').replace(/`/g, '\\`');
                } else if (part && part.kind === 'string') {
                    result += String(part.value || '').replace(/`/g, '\\`');
                } else {
                    result += '${' + this.transformExpression(part) + '}';
                }
            }
        } else {
            // Fallback: derive from raw/source if available
            const raw = (node.loc?.source || node.source || node.raw || node.value || '').toString();
            // Strip surrounding quotes if present
            const stripped = raw.replace(/^\"|\"$/g, '').replace(/^\'|\'$/g, '');
            // Replace $var with ${var}
            const interpolated = stripped.replace(/\$(\w+)/g, '${$1}');
            result += interpolated.replace(/`/g, '\\`');
        }
        result += '`';
        return result;
    }

    /**
     * Write a line with proper indentation
     */
    writeLine(text) {
        const indentation = '    '.repeat(this.indent);
        this.output.push(indentation + text + '\n');
    }

    /**
     * Write text without newline
     */
    write(text) {
        const indentation = '    '.repeat(this.indent);
        this.output.push(indentation + text);
    }

    /**
     * Add file header
     */
    addHeader() {
        this.writeLine('//');
        this.writeLine('// Transpiled from PHP using AST-based transpiler');
        this.writeLine('// Generated: ' + new Date().toISOString());
        this.writeLine('//');
        this.writeLine('');
        
        // Add utility module import if using module style
        const moduleImport = this.utilityManager.getModuleImport();
        if (moduleImport) {
            this.writeLine(moduleImport);
        }
        
        this.writeLine('// Environment shims');
        this.writeLine('const __ENV__ = {');
        this.writeLine('    isNode: typeof process !== \'undefined\' && process.versions?.node,');
        this.writeLine('    isBrowser: typeof window !== \'undefined\'');
        this.writeLine('};');
        this.writeLine('');
        this.writeLine('// HTML output helper');
        this.writeLine('function __outputHtml(lines) {');
        this.writeLine('    console.log(lines.join(\'\\n\'));');
        this.writeLine('}');
        this.writeLine('');
    }

    /**
     * Add file footer
     */
    addFooter() {
        // Add inline utility functions if needed
        const utilities = this.utilityManager.generateInlineFunctions();
        if (utilities) {
            this.output.push(utilities);
        }
        
        this.writeLine('');
        this.writeLine('export { __ENV__, __outputHtml };');
    }
}

/**
 * Main transpilation function
 */
export async function transpile(phpCode, options = {}) {
    try {
        logger.info('Parsing PHP code...');
        
        // Ensure code has PHP opening tag for the parser
        if (!/^\s*<\?/.test(phpCode)) {
            phpCode = '<?php\n' + phpCode;
        }

        // Parse PHP to AST
        const ast = parser.parseCode(phpCode, options.filename || 'input.php');
        
        logger.info('Transforming AST to JavaScript...');
        
        // Transform AST to JavaScript
        const transformer = new ASTTransformer({
            interfaceStyle: options.interfaceStyle || 'abstract-class',
            utilityStyle: options.utilityStyle || 'inline',
            utilityModule: options.utilityModule || 'php-utils',
            unsetStyle: options.unsetStyle || 'comment',
            defineStyle: options.defineStyle || 'const'
        });
        const jsCode = transformer.transform(ast);
        
        logger.info('Transpilation complete');
        
        return jsCode;
    } catch (error) {
        logger.error('Transpilation failed:', error.message);
        if (error.lineNumber) {
            logger.error(`  at line ${error.lineNumber}, column ${error.columnNumber}`);
        }
        throw error;
    }
}

/**
 * Transpile a file
 */
export async function transpileFile(inputPath, outputPath, options = {}) {
    logger.info(`Transpiling file: ${inputPath}`);
    
    const phpCode = await fs.readFile(inputPath, 'utf8');
    let jsCode = await transpile(phpCode, { ...options, filename: path.basename(inputPath) });

    // Optional formatting
    if (options.format) {
        await loadPrettier();
        if (prettier) {
            jsCode = await formatCode(jsCode, outputPath);
        }
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, jsCode, 'utf8');
    
    logger.info(`Output written to: ${outputPath}`);
}

/**
 * CLI entry point
 */
async function main() {
    const { src, dst, recurse, stats: showStats, logLevel, format, interfaceStyle, utilityStyle, utilityModule, unsetStyle, defineStyle } = parseArgs();
    if (!src || !dst) {
        console.log('Usage:');
        console.log('  node transpiler.mjs --src <file|dir> --dst <file|dir> [--recurse <bool>|--no-recurse] [--stats] [--log-level <level>] [--format] [--interface-style <style>] [--utility-style <style>] [--utility-module <name>] [--unset-style <style>] [--define-style <style>]');
        console.log('  Interface styles: abstract-class (default), comment, jsdoc, empty-class');
        console.log('  Utility styles: inline (default), module, none');
        console.log('  Unset styles: comment (default), delete');
        console.log('  Define styles: const (default), export-const, comment');
        console.log('  node transpiler.mjs <input.php> <output.js>');
        process.exit(1);
    }

    // Set log level
    try { logger.level = logLevel; } catch {}

    if (format) {
        await loadPrettier();
    }

    logger.info(`Starting AST transpilation... (recurse: ${recurse}, stats: ${showStats}, log level: ${logLevel}, format: ${!!format}, interface-style: ${interfaceStyle}, utility-style: ${utilityStyle})`);
    logger.info(`Source: ${src}`);
    logger.info(`Destination: ${dst}`);

    // Create shared utility manager for all files
    const utilityManager = createUtilityManager({ utilityStyle, utilityModule });

    const files = await collectPhpFiles(src, recurse);
    let processed = 0, written = 0, errors = 0;

    for (const file of files) {
        const outPath = computeOutPath(await isDirectory(src) ? src : null, file, dst);
        try {
            await transpileFile(file, outPath, { 
                filename: path.basename(file), 
                format, 
                interfaceStyle, 
                utilityStyle, 
                utilityModule,
                utilityManager,
                unsetStyle,
                defineStyle
            });
            written++;
        } catch (e) {
            errors++;
            logger.error(`Failed: ${file} -> ${outPath}: ${e.message}`);
        }
        processed++;
    }

    // Generate utility module if needed
    if (utilityStyle === 'module' && utilityManager.usedFunctions.size > 0) {
        try {
            const outputDir = await isDirectory(dst) ? dst : path.dirname(dst);
            const modulePath = await utilityManager.ensureUtilityModule(outputDir);
            if (modulePath) {
                logger.info(`Utility module written to: ${modulePath}`);
            }
        } catch (e) {
            logger.error(`Failed to generate utility module: ${e.message}`);
        }
    }

    logger.info(`Transpilation complete. Files processed: ${processed}, written: ${written}, errors: ${errors}`);
    if (showStats) {
        console.log(`Processed: ${processed}\nWritten: ${written}\nErrors: ${errors}`);
    }
}

// Run if called directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
    main().catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}
