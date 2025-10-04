import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import log4js from 'log4js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure log4js
log4js.configure({
    appenders: {
        console: { type: 'console' },
        file: { type: 'file', filename: 'php2js-conversion.log' }
    },
    categories: {
        default: { appenders: ['console', 'file'], level: 'info' }
    }
});

const logger = log4js.getLogger('php2js');

function parseArgs() {
    const args = process.argv.slice(2);
    const out = { 
        src: path.resolve(__dirname, '..', '..', 'WordPress'), 
        dst: path.resolve(__dirname, '..'),
        recurse: true, // Default to true
        stats: false,  // Default to false
        logLevel: 'info' // Default to info
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--src') out.src = path.resolve(args[++i]);
        else if (args[i] === '--dst') out.dst = path.resolve(args[++i]);
        else if (args[i] === '--recurse') {
            const val = args[++i];
            out.recurse = val === 'true' || val === '1' || val === 'yes';
        } else if (args[i] === '--no-recurse') {
            out.recurse = false;
        } else if (args[i] === '--stats') {
            out.stats = true;
        } else if (args[i] === '--log-level') {
            out.logLevel = args[++i].toLowerCase();
        }
    }
    return out;
}

async function* walk(dir, recurse = true) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const res = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (recurse) {
                yield* walk(res, recurse);
            }
        } else {
            yield res;
        }
    }
}

function buildBanner(rel, abs) {
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return `//\n// Converted from PHP: ${rel}\n// Source path: ${abs}\n// Generated: ${ts}\n// Target: Node.js (server) + browser-friendly ES modules.\n// NOTE: This is an automated light conversion. Manual review required.\n//\n`;
}

// Compute an ESM import path for a given PHP include/require string literal.
// Handles includes like 'dir/file.php' or 'dir/file' (without extension).
function computeImportPath(relPhpPath, incLiteral) {
    const posix = path.posix;
    const fromDir = posix.dirname(relPhpPath);
    
    // Normalize the include path
    let normalizedInclude = incLiteral;
    
    // If it ends with .php, we'll convert it to .js
    // If it doesn't have an extension, assume it's a .php file and add .js
    if (/\.php$/i.test(normalizedInclude)) {
        // Has .php extension - will be replaced with .js
    } else if (!/\.\w+$/.test(normalizedInclude)) {
        // No extension - assume it's a PHP file, add .js
        normalizedInclude += '.js';
    } else {
        // Has a different extension - return null (can't convert)
        return null;
    }
    
    // Absolute include starting with '/' -> treat as from project root
    const relPhpTarget = incLiteral.startsWith('/')
        ? incLiteral.replace(/^\/+/, '')
        : posix.normalize(posix.join(fromDir, incLiteral));
    
    const relJsFrom = relPhpPath.replace(/\.php$/i, '.js');
    const relJsTarget = relPhpTarget.replace(/\.php$/i, '.js');
    
    let importPath = posix.relative(posix.dirname(relJsFrom), relJsTarget);
    if (!importPath.startsWith('.')) importPath = './' + importPath;
    return importPath.replace(/\\/g, '/');
}

function phpExprToJs(expr) {
    let e = expr.trim();
    // Basic transforms
    e = e.replace(/^\$(\w+)/g, '$1');
    
    // PHP string concat '.' -> JS '+' (but not inside strings)
    e = e.replace(/\.(?=\s*\$?\w)/g, (match, offset, fullString) => {
        // Check if inside a string
        const before = fullString.substring(0, offset);
        let inString = false;
        let stringChar = null;
        
        for (let i = 0; i < before.length; i++) {
            const char = before[i];
            if ((char === '"' || char === "'") && !inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar && inString && before[i - 1] !== '\\') {
                inString = false;
                stringChar = null;
            }
        }
        
        return inString ? match : ' + ';
    });
    
    e = e.replace(/->/g, '.');
    e = e.replace(/::/g, '.');
    // Convert strings and numbers are compatible; TRUE/FALSE/NULL
    e = e.replace(/\bTRUE\b/gi, 'true').replace(/\bFALSE\b/gi, 'false').replace(/\bNULL\b/gi, 'null');
    return e;
}

// Process inline PHP expressions within HTML content
function processInlinePhp(htmlContent) {
    let processed = htmlContent;

    // Process inline PHP expressions: <?php echo $var; ?> or <?= $var ?>
    processed = processed.replace(/<\?(?:php)?\s+echo\s+(.*?)\s*;?\s*\?>/gi, (m, expr) => {
        return '${' + phpExprToJs(expr) + '}';
    });

    // Short echo tags: <?= $var ?>
    processed = processed.replace(/<\?=\s*(.*?)\s*\?>/gi, (m, expr) => {
        return '${' + phpExprToJs(expr) + '}';
    });

    // Handle remaining PHP code blocks within HTML
    processed = processed.replace(/<\?(?:php)?\s+(.*?)\s*\?>/gi, (m, code) => {
        // For complex PHP within HTML, add a placeholder comment
        return '/* PHP: ' + code.trim() + ' */';
    });

    return processed;
}

// Transform embedded HTML blocks into __outputHtml calls
function transformEmbeddedHtml(js) {
    return js.replace(/\?>([\s\S]*?)(?:<\?(?:php)?|$)/gi, (match, htmlContent) => {
        if (!htmlContent.trim()) {
            return '';
        }

        const processedHtml = processInlinePhp(htmlContent);
        const lines = processedHtml.split('\n');
        const htmlLines = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                // Preserve blank lines as empty strings in the output
                htmlLines.push('``');
                return;
            }

            const escapedLine = trimmed
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\$\{(?![^}]*\})/g, '\\${');

            htmlLines.push(`\`${escapedLine}\``);
        });

        if (htmlLines.length === 0) return '';
        return `\n__outputHtml([\n  ${htmlLines.join(',\n  ')}\n]);\n`;
    });
}

// Helper: Check if position is inside string or comment
function isInsideStringOrComment(fullString, offset) {
    const beforeMatch = fullString.substring(0, offset);
    let inString = false;
    let stringChar = null;
    let escaped = false;
    let inBlockComment = false;
    let inLineComment = false;
    
    for (let i = 0; i < beforeMatch.length; i++) {
        const char = beforeMatch[i];
        const nextChar = i + 1 < beforeMatch.length ? beforeMatch[i + 1] : '';
        
        if (char === '\n') {
            inLineComment = false;
            continue;
        }
        
        if (inLineComment) continue;
        
        if (!inString && !inBlockComment && char === '/' && nextChar === '*') {
            inBlockComment = true;
            i++;
            continue;
        }
        
        if (inBlockComment && char === '*' && nextChar === '/') {
            inBlockComment = false;
            i++;
            continue;
        }
        
        if (inBlockComment) continue;
        
        if (!inString && char === '/' && nextChar === '/') {
            inLineComment = true;
            i++;
            continue;
        }
        
        if (escaped) {
            escaped = false;
            continue;
        }
        if (inString && char === '\\') {
            escaped = true;
            continue;
        }
        
        if ((char === '"' || char === "'" || char === '`') && !inString) {
            inString = true;
            stringChar = char;
        } else if (char === stringChar && inString) {
            inString = false;
            stringChar = null;
        }
    }
    
    return { inString, inBlockComment, inLineComment };
}

// Helper: Convert define() to export const or local const
function convertDefine(js) {
    return js.replace(/define\(\s*['"]([A-Z0-9_]+)['"]\s*,\s*(.*?)\s*\)\s*;?/gms,
        (m, name, val, offset, fullString) => {
            // Check if this define is inside a function
            const beforeDefine = fullString.substring(0, offset);
            
            // Count function braces to determine if we're inside a function
            let braceDepth = 0;
            let inFunction = false;
            
            // Look for function declarations before this point
            const functionPattern = /\bfunction\s+\w+\s*\([^)]*\)\s*\{/g;
            let match;
            const functionStarts = [];
            
            while ((match = functionPattern.exec(beforeDefine)) !== null) {
                functionStarts.push(match.index + match[0].length - 1); // Position of opening brace
            }
            
            // Track brace depth from each function start
            for (const funcStart of functionStarts) {
                let depth = 1; // Start at 1 because we're after the opening brace
                for (let i = funcStart + 1; i < beforeDefine.length; i++) {
                    if (beforeDefine[i] === '{') depth++;
                    else if (beforeDefine[i] === '}') depth--;
                    
                    if (depth === 0) break; // Function closed before our define
                }
                
                // If depth > 0, we're still inside this function
                if (depth > 0) {
                    inFunction = true;
                    break;
                }
            }
            
            // Convert based on context
            if (inFunction) {
                // Inside a function - use local const
                logger.debug(`    define('${name}') is inside a function -> const`);
                return `const ${name} = ${phpExprToJs(val)};`;
            } else {
                // Global scope - use export const
                logger.debug(`    define('${name}') is at global scope -> export const`);
                return `export const ${name} = ${phpExprToJs(val)};`;
            }
        });
}

// Helper: Convert echo/print to console.log
function convertEchoPrint(js) {
    return js.replace(/\b(echo|print)\b\s*(.*?);/gms, (m, kw, expr) => {
        return `console.log(${phpExprToJs(expr)});`;
    });
}

// Helper: Convert require/include to ES6 imports
function convertRequireInclude(js, relPhpPath) {

    return js.replace(/\b(require|require_once|include|include_once)\b\s*\(?\s*(.+?)\s*\)?\s*;/gms,
        (m, kw, expr, offset, fullString) => {
            // Check if immediately preceded by a quote
            const charBefore = offset > 0 ? fullString[offset - 1] : '';
            if (charBefore === '"' || charBefore === "'" || charBefore === '`') {
                return m;
            }
            
            // Check if inside string or comment
            const context = isInsideStringOrComment(fullString, offset);
            if (context.inString || context.inBlockComment || context.inLineComment) {
                return m;
            }
            
            // Check if this looks like an array key (followed by whitespace and =>)
            // Look at what comes after the keyword
            const afterKeyword = fullString.substring(offset + kw.length);
            if (/^\s*['"]?\s*=>/.test(afterKeyword)) {
                return m; // Don't convert array keys
            }
            
            const simpleMatch = expr.match(/^(['"])(.*?)\1$/);
            if (simpleMatch) {
                const inc = simpleMatch[2];
                const imp = computeImportPath(relPhpPath, inc);
                return imp ? `import '${imp}';` : `// TODO: import equivalent of ${inc} (from ${kw})`;
            }

            // Handle __DIR__ . 'path' pattern (with flexible whitespace and concat)
            const dirMatch = expr.match(/__DIR__\s*\.\s*(['"])(.+?)\1/);
            if (dirMatch) {
                const inc = dirMatch[2];
                const imp = computeImportPath(relPhpPath, inc);
                return imp ? `import '${imp}';` : `// TODO: import equivalent of ${inc} (from ${kw})`;
            }
            
            // Also handle if __DIR__ was already converted to __dirname
            const dirnameMatch = expr.match(/__dirname\s*\+\s*(['"])(.+?)\1/);
            if (dirnameMatch) {
                const inc = dirnameMatch[2];
                const imp = computeImportPath(relPhpPath, inc);
                return imp ? `import '${imp}';` : `// TODO: import equivalent of ${inc} (from ${kw})`;
            }

            const processedExpr = phpExprToJs(expr);
            return `// TODO: import equivalent of ${processedExpr} (from ${kw})`;
        });
}

// Helper: Convert die/exit to throw
function convertDieExit(js) {
    // die/exit with parentheses
    js = js.replace(/(?<!\$)\b(die|exit)\b\s*\(\s*([^)]*)\s*\)\s*;/g, (m, kw, expr) => {
        const inner = expr && expr.trim() ? phpExprToJs(expr) : '`Process terminated`';
        return `throw new Error(${inner});`;
    });
    // die/exit without parentheses
    js = js.replace(/(?<!\$)\b(die|exit)\b\s*;/g, () => {
        return `throw new Error(\`Process terminated\`);`;
    });
    return js;
}

// Helper: Convert alternative if/endif syntax
function convertAlternativeIf(js) {
    js = js.replace(/\bif\s*\((.*?)\)\s*:/g, 'if ($1) {');
    js = js.replace(/\belse\s*:/g, '} else {');
    js = js.replace(/\belse\s+if\s*\((.*?)\)\s*:/g, '} else if ($1) {');
    js = js.replace(/\bendif\s*;/g, '}');
    return js;
}

// Helper: Convert foreach loops
function convertForeach(js) {
    // Alternative syntax with colon - associative
    js = js.replace(/\bforeach\s*\(\s*(.+?)\s+as\s+(\$\w+)\s*=>\s*(\$\w+)\s*\)\s*:/g, 
        (m, arrayExpr, key, value) => {
            let arrName = arrayExpr.replace(/\$/g, '').replace(/->/g, '.');
            const keyName = key.substring(1);
            const valName = value.substring(1);
            return `for (const [${keyName}, ${valName}] of Object.entries(${arrName})) {`;
        });
    
    // Alternative syntax with colon - simple
    js = js.replace(/\bforeach\s*\(\s*(.+?)\s+as\s+(\$\w+)\s*\)\s*:/g,
        (m, arrayExpr, value) => {
            let arrName = arrayExpr.replace(/\$/g, '').replace(/->/g, '.');
            const valName = value.substring(1);
            return `for (const ${valName} of ${arrName}) {`;
        });
    
    js = js.replace(/\bendforeach\s*;/g, '}');
    
    // Standard syntax - associative
    js = js.replace(/\bforeach\s*\(\s*(.+?)\s+as\s+(\$\w+)\s*=>\s*(\$\w+)\s*\)/g, 
        (m, arrayExpr, key, value) => {
            let arrName = arrayExpr.replace(/\$/g, '').replace(/->/g, '.');
            const keyName = key.substring(1);
            const valName = value.substring(1);
            return `for (const [${keyName}, ${valName}] of Object.entries(${arrName}))`;
        });
    
    // Standard syntax - simple
    js = js.replace(/\bforeach\s*\(\s*(.+?)\s+as\s+(\$\w+)\s*\)/g,
        (m, arrayExpr, value) => {
            let arrName = arrayExpr.replace(/\$/g, '').replace(/->/g, '.');
            const valName = value.substring(1);
            return `for (const ${valName} of ${arrName})`;
        });
    
    return js;
}

// Helper: Convert alternative while/endwhile syntax
function convertAlternativeWhile(js) {
    js = js.replace(/\bwhile\s*\((.*?)\)\s*:/g, 'while ($1) {');
    js = js.replace(/\bendwhile\s*;/g, '}');
    return js;
}

// Helper: Convert alternative for/endfor syntax
function convertAlternativeFor(js) {
    js = js.replace(/\bfor\s*\((.*?)\)\s*:/g, 'for ($1) {');
    js = js.replace(/\bendfor\s*;/g, '}');
    return js;
}

// Convert PHP language constructs to JavaScript equivalents
function convertPhpConstructs(js, relPhpPath) {
    js = convertDefine(js);
    js = convertEchoPrint(js);
    js = convertRequireInclude(js, relPhpPath);
    js = convertDieExit(js);
    js = convertAlternativeIf(js);
    js = convertForeach(js);
    js = convertAlternativeWhile(js);
    js = convertAlternativeFor(js);
    return js;
}

// Helper: Convert class properties and methods
function convertClassMembers(classBody) {
    let converted = classBody;
    
    // Convert properties: public $name = value; or private $name = value;
    // Also handle static: public static $name or static $name
    // Also handle if $ was already stripped: public name = value;
    converted = converted.replace(/(public|private|protected)?\s*(static)?\s+\$?(\w+)(\s*=\s*[^;]+)?;/g, (m, visibility, isStatic, name, init) => {
        // Clean up the init value if present (remove $, convert -> to .)
        let cleanInit = init || '';
        if (cleanInit) {
            cleanInit = cleanInit.replace(/\$/g, '').replace(/->/g, '.');
        }
        
        const staticKeyword = isStatic ? 'static ' : '';
        
        // In JavaScript, private fields use #, public fields don't need a prefix
        if (visibility === 'private') {
            return `${staticKeyword}#${name}${cleanInit};`;
        } else {
            // Public and protected are just regular properties (no visibility keyword in JS)
            return `${staticKeyword}${name}${cleanInit};`;
        }
    });
    
    // Convert methods: public function name() or private function name()
    // Also handle static: public static function name() or static function name()
    converted = converted.replace(/(public|private|protected)?\s*(static)?\s*function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, (m, visibility, isStatic, name, params) => {
        const jsParams = params.split(',').map(p => p.trim()).filter(Boolean)
            .map(p => p.replace(/^[^$]*\$/, '').replace(/\s*=.*/, '')).join(', ');
        
        const staticKeyword = isStatic ? 'static ' : '';
        
        if (visibility === 'private') {
            return `${staticKeyword}#${name}(${jsParams}) {`;
        } else {
            // Public and protected methods (no visibility keyword in JS)
            return `${staticKeyword}${name}(${jsParams}) {`;
        }
    });
    
    // Handle properties without visibility (default to public in PHP)
    // Handle both $name and name (if $ was already stripped)
    converted = converted.replace(/^\s*\$?(\w+)(\s*=\s*[^;]+)?;/gm, (m, name, init) => {
        let cleanInit = init || '';
        if (cleanInit) {
            cleanInit = cleanInit.replace(/\$/g, '').replace(/->/g, '.');
        }
        return `${name}${cleanInit};`;
    });
    
    // Handle methods without visibility (default to public)
    converted = converted.replace(/^\s*function\s+(\w+)\s*\(([^)]*)\)\s*\{/gm, (m, name, params) => {
        const jsParams = params.split(',').map(p => p.trim()).filter(Boolean)
            .map(p => p.replace(/^[^$]*\$/, '').replace(/\s*=.*/, '')).join(', ');
        return `${name}(${jsParams}) {`;
    });
    
    // Convert $this-> to this. (handle both $this-> and this. if already converted)
    converted = converted.replace(/(\$this->|this\.)/g, 'this.');
    
    // Convert parent:: to super. (handle both parent:: and parent. if already converted)
    converted = converted.replace(/parent(\.|::)/g, 'super.');
    
    // Convert self:: or self. to this.constructor. (for static method calls within the class)
    // Handle both self:: and self. (if already converted by earlier passes)
    converted = converted.replace(/self(\.|::)/g, 'this.constructor.');
    
    return converted;
}

// Convert PHP declarations (functions, classes) to JavaScript
function convertDeclarations(js) {
    // Process classes FIRST (before function conversion)
    // This prevents class methods from being converted to export functions
    js = js.replace(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)(\s+extends\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*\{([\s\S]*?)\n\}/g, 
        (m, name, ext, body) => {
            const convertedBody = convertClassMembers(body);
            return `export class ${name}${ext || ''} {${convertedBody}\n}`;
        });

    // Then convert standalone function declarations -> export function
    // This won't match functions inside classes (already processed)
    js = js.replace(/^function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{/gm,
        (m, name, params) => {
            const jsParams = params.split(',').map(p => p.trim()).filter(Boolean)
                .map(p => p.replace(/^[^$]*\$/, '').replace(/\s*=.*/, '')).join(', ');
            return `export function ${name}(${jsParams}) {`;
        });

    return js;
}

// Helper: Remove PHP global keyword statements
function removeGlobalKeywords(js) {
    const before = js;
    js = js.replace(/^\s*global\s+[^;]+;\s*$/gm, '// (global variables hoisted to IIFE scope)');
    if (js !== before) {
        const count = (before.match(/^\s*global\s+[^;]+;\s*$/gm) || []).length;
        logger.debug(`  Removed ${count} global keyword statement(s)`);
    }
    return js;
}

// Helper: Convert error control operator @
function convertErrorControlOperator(js) {
    logger.debug('  convertErrorControlOperator: Processing @ operators');
    return js.replace(/@(\s*)(\$?\w+(?:\([^)]*\))?|\$\w+(?:->\w+(?:\([^)]*\))?)*)/g, (match, space, expr, offset, fullString) => {
        // Check if this @ is inside a comment
        const beforeMatch = fullString.substring(0, offset);
        
        // Check for /* ... */ block comment
        const lastBlockCommentStart = beforeMatch.lastIndexOf('/*');
        const lastBlockCommentEnd = beforeMatch.lastIndexOf('*/');
        if (lastBlockCommentStart > lastBlockCommentEnd) {
            return match;
        }
        
        // Check for // line comment
        const lastNewline = beforeMatch.lastIndexOf('\n');
        const textAfterNewline = beforeMatch.substring(lastNewline + 1);
        if (textAfterNewline.includes('//')) {
            return match;
        }
        
        return `/* @suppress-errors */ ${expr}`;
    });
}

// Helper: Convert elseif to else if
function convertElseif(js) {
    const before = js;
    js = js.replace(/\belseif\b/g, 'else if');
    if (js !== before) {
        const count = (before.match(/\belseif\b/g) || []).length;
        logger.debug(`  Converted ${count} elseif to else if`);
    }
    return js;
}

// Helper: Convert equality operators
function convertEqualityOperators(js) {
    const before = js;
    js = js.replace(/!=(?!=)/g, '!==');
    js = js.replace(/(?<![!=])==(?![=])/g, '===');
    if (js !== before) {
        const eqCount = (before.match(/(?<![!=])==(?![=])/g) || []).length;
        const neqCount = (before.match(/!=(?!=)/g) || []).length;
        logger.debug(`  Converted ${eqCount} == to ===, ${neqCount} != to !==`);
    }
    return js;
}

// Helper: Convert superglobals
function convertSuperglobals(js) {
    const before = js;
    
    // First, convert superglobals with array access: $_POST['key'] -> _.POST['key']
    js = js.replace(/\$_(GET|POST|SERVER|COOKIE|SESSION|REQUEST|FILES|ENV)\s*\[(.*?)\]/g,
        (m, which, key) => `_.${which}[${key}]`);
    
    // Then, convert superglobals without array access: $_POST -> _.POST
    // Use word boundary to avoid matching partial names
    js = js.replace(/\$_(GET|POST|SERVER|COOKIE|SESSION|REQUEST|FILES|ENV)\b/g,
        (m, which) => `_.${which}`);
    
    if (js !== before) {
        const arrayCount = (before.match(/\$_(GET|POST|SERVER|COOKIE|SESSION|REQUEST|FILES|ENV)\s*\[/g) || []).length;
        const directCount = (before.match(/\$_(GET|POST|SERVER|COOKIE|SESSION|REQUEST|FILES|ENV)\b/g) || []).length - arrayCount;
        logger.debug(`  Converted ${arrayCount} superglobal(s) with array access, ${directCount} direct reference(s) to _.* notation`);
    }
    return js;
}

// Helper: Convert magic constants
function convertMagicConstants(js) {
    logger.debug('  convertMagicConstants: Processing __DIR__ and __FILE__');
    const before = js;
    js = js.replace(/\b__DIR__\b/g, '__dirname');
    js = js.replace(/\b__FILE__\b/g, '__filename');
    if (js !== before) {
        const dirCount = (before.match(/\b__DIR__\b/g) || []).length;
        const fileCount = (before.match(/\b__FILE__\b/g) || []).length;
        if (dirCount > 0 || fileCount > 0) {
            logger.debug(`    Converted ${dirCount} __DIR__, ${fileCount} __FILE__`);
        }
    }
    return js;
}

// Helper: Convert string concatenation operators
function convertStringConcatenation(js) {
    logger.debug('  convertStringConcatenation: Processing . and .= operators');
    const before = js;
    
    // .= -> +=
    js = js.replace(/(\$?\w+)\s*\.=/g, '$1 +=');
    
    // . -> + (with context awareness)
    js = js.replace(/(\$?\w+|["'`\]\)])\s*\.\s*(?=["'`$\w])/g, (match, prefix, offset, fullString) => {
        // Check if this is part of -> (already handled separately)
        if (fullString[offset + match.length] === '>') {
            return match;
        }
        
        // Check if this looks like property/method access
        const afterDot = fullString.substring(offset + match.length);
        const nextTokenMatch = afterDot.match(/^(\w+)/);
        const isIdentifier = /^\$?\w+$/.test(prefix);
        const nextIsIdentifier = nextTokenMatch && !/^["'`]/.test(afterDot);
        
        if (isIdentifier && nextIsIdentifier) {
            return match; // Property access
        }
        
        // Check if inside string or comment
        const dotPosition = offset + prefix.length + match.substring(prefix.length).indexOf('.');
        const beforeDot = fullString.substring(0, dotPosition);
        let inString = false;
        let stringChar = null;
        let escaped = false;
        let inBlockComment = false;
        let inLineComment = false;
        
        for (let i = 0; i < beforeDot.length; i++) {
            const char = beforeDot[i];
            const nextChar = i + 1 < beforeDot.length ? beforeDot[i + 1] : '';
            
            // Handle newlines - reset line comment state
            if (char === '\n') {
                inLineComment = false;
                continue;
            }
            
            // If we're in a line comment, skip everything until newline
            if (inLineComment) {
                continue;
            }
            
            // Check for start of block comment (only if not in string)
            if (!inString && !inBlockComment && char === '/' && nextChar === '*') {
                inBlockComment = true;
                i++;
                continue;
            }
            
            // Check for end of block comment
            if (inBlockComment && char === '*' && nextChar === '/') {
                inBlockComment = false;
                i++;
                continue;
            }
            
            // If in block comment, skip character processing
            if (inBlockComment) continue;
            
            // Check for start of line comment (only if not in string)
            if (!inString && char === '/' && nextChar === '/') {
                inLineComment = true;
                i++;
                continue;
            }
            
            // Handle escape sequences in strings
            if (escaped) {
                escaped = false;
                continue;
            }
            if (inString && char === '\\') {
                escaped = true;
                continue;
            }
            
            // Handle string delimiters
            if ((char === '"' || char === "'" || char === '`') && !inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar && inString) {
                inString = false;
                stringChar = null;
            }
        }
        
        if (inString || inBlockComment || inLineComment) {
            return match;
        }
        
        // Check for decimal number
        if (/\d/.test(prefix) && /\d/.test(fullString[offset + match.length])) {
            return match;
        }
        
        return prefix + ' + ';
    });
    
    if (js !== before) {
        const concatCount = (before.match(/(\$?\w+|["'`\]\)])\s*\.\s*(?=["'`$\w])/g) || []).length;
        const assignCount = (before.match(/(\$?\w+)\s*\.=/g) || []).length;
        if (concatCount > 0 || assignCount > 0) {
            logger.debug(`    Converted ${concatCount} . operators, ${assignCount} .= operators`);
        }
    }
    
    return js;
}

// Helper: Convert object and static operators
function convertObjectOperators(js) {
    logger.debug('  convertObjectOperators: Processing -> and :: operators');
    const before = js;
    js = js.replace(/->/g, '.');
    js = js.replace(/::/g, '.');
    if (js !== before) {
        const arrowCount = (before.match(/->/g) || []).length;
        const colonCount = (before.match(/::/g) || []).length;
        logger.debug(`    Converted ${arrowCount} ->, ${colonCount} ::`);
    }
    return js;
}

// Helper: Strip $ from variable names
function stripDollarSigns(js) {
    logger.debug('  stripDollarSigns: Removing $ from variable names');
    const before = js;
    const result = js.replace(/\$(\w+)/g, (match, varName, offset, fullString) => {
        const beforeMatch = fullString.substring(0, offset);
        
        // Check for block comment
        const lastBlockCommentStart = beforeMatch.lastIndexOf('/*');
        const lastBlockCommentEnd = beforeMatch.lastIndexOf('*/');
        if (lastBlockCommentStart > lastBlockCommentEnd) {
            return match;
        }
        
        // Check for line comment
        const lastNewline = beforeMatch.lastIndexOf('\n');
        const textAfterNewline = beforeMatch.substring(lastNewline + 1);
        const commentIndex = textAfterNewline.indexOf('//');
        if (commentIndex !== -1) {
            const beforeComment = textAfterNewline.substring(0, commentIndex);
            const quotesBefore = (beforeComment.match(/['"]/g) || []).length;
            if (quotesBefore % 2 === 0) {
                return match;
            }
        }
        
        return varName;
    });
    
    if (result !== before) {
        const count = (before.match(/\$(\w+)/g) || []).length;
        logger.debug(`    Stripped $ from ${count} variable(s)`);
    }
    
    return result;
}

// Helper: Convert PHP array() to JS arrays/objects
function convertArraySyntax(js) {
    logger.debug('  convertArraySyntax: Processing array() syntax');
    let changed = true;
    while (changed) {
        changed = false;
        let arrayIndex = 0;
        while ((arrayIndex = js.indexOf('array(', arrayIndex)) !== -1) {
            const beforeArray = arrayIndex > 0 ? js[arrayIndex - 1] : ' ';
            if (/\w/.test(beforeArray)) {
                arrayIndex++;
                continue;
            }
            
            let depth = 1;
            let i = arrayIndex + 6;
            while (i < js.length && depth > 0) {
                if (js[i] === '(') depth++;
                else if (js[i] === ')') depth--;
                i++;
            }
            
            if (depth === 0) {
                const inside = js.substring(arrayIndex + 6, i - 1);
                if (!inside.includes('array(')) {
                    const replacement = inside.includes('=>') 
                        ? `{ ${inside.replace(/=>/g, ':')} }`
                        : `[ ${inside} ]`;
                    js = js.substring(0, arrayIndex) + replacement + js.substring(i);
                    changed = true;
                    break;
                }
            }
            arrayIndex++;
        }
    }
    return js;
}

// Helper: Convert array append operator
function convertArrayAppend(js) {
    const before = js;
    js = js.replace(/(\w+)\s*\[\s*\]\s*=\s*([^;]+);/g, '$1.push($2);');
    if (js !== before) {
        const count = (before.match(/(\w+)\s*\[\s*\]\s*=\s*([^;]+);/g) || []).length;
        logger.debug(`  Converted ${count} array append operator(s)`);
    }
    return js;
}

// Helper: Convert # comments to //
function convertHashComments(js) {
    const before = js;
    js = js.replace(/^\s*#(.*)$/gm, '//$1');
    if (js !== before) {
        const count = (before.match(/^\s*#(.*)$/gm) || []).length;
        logger.debug(`  Converted ${count} # comment(s) to //`);
    }
    return js;
}

// Helper: Convert array destructuring (list)
function convertArrayDestructuring(js) {
    logger.debug('  convertArrayDestructuring: Processing list() syntax');
    const before = js;
    
    // Pattern: list($a, $b, $c) = $array; or list($a, , $c) = $array;
    // Convert to: [a, b, c] = array; or [a, , c] = array;
    js = js.replace(/\blist\s*\(\s*([^)]+)\s*\)\s*=\s*([^;]+);/g, (m, vars, source) => {
        // Handle empty slots in destructuring - preserve commas for skipped elements
        const varList = vars.split(',').map(v => {
            const trimmed = v.trim();
            if (!trimmed || trimmed === '') return ''; // Empty slot - preserve it
            return trimmed.replace(/^\$/, ''); // Remove $
        });
        
        const cleanSource = source.trim().replace(/^\$/, '');
        return `[${varList.join(', ')}] = ${cleanSource};`;
    });
    
    if (js !== before) {
        const count = (before.match(/\blist\s*\(/g) || []).length;
        logger.debug(`    Converted ${count} list() destructuring assignment(s)`);
    }
    
    return js;
}

// Convert PHP syntax to JavaScript syntax
function convertPhpSyntax(js) {
    logger.debug('convertPhpSyntax: Starting PHP syntax conversion');
    const startLength = js.length;
    
    // Apply all conversions in sequence
    js = removeGlobalKeywords(js);
    js = convertErrorControlOperator(js);
    js = convertElseif(js);
    js = convertEqualityOperators(js);
    js = convertSuperglobals(js);
    js = convertMagicConstants(js);
    js = convertStringConcatenation(js);
    js = convertObjectOperators(js);
    js = convertArrayDestructuring(js);
    js = stripDollarSigns(js);
    js = convertArraySyntax(js);
    js = convertArrayAppend(js);
    js = convertHashComments(js);
    
    const endLength = js.length;
    logger.debug(`convertPhpSyntax: Complete (${startLength} -> ${endLength} chars, ${endLength - startLength > 0 ? '+' : ''}${endLength - startLength} change)`);
    
    return js;
}

// Extract variables declared with PHP 'global' keyword
function extractGlobalKeywordVars(code) {
    const globalVars = new Set();
    
    // Match: global $var1, $var2, $var3;
    const globalMatches = code.matchAll(/\bglobal\s+([^;]+);/g);
    for (const match of globalMatches) {
        const varList = match[1];
        // Extract variable names (with $)
        const vars = varList.match(/\$\w+/g);
        if (vars) {
            vars.forEach(v => {
                // Remove $ prefix
                globalVars.add(v.substring(1));
            });
        }
    }
    
    return globalVars;
}

// Extract global variable declarations from the code
function extractGlobalVariables(code) {
    const globalVars = new Set();
    const lines = code.split('\n');
    
    // Track if we're inside a function or class
    let depth = 0;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Track scope depth
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        
        // Check for variable declarations at global scope (depth 0)
        if (depth === 0) {
            // Match: let/var/const variable declarations
            const varMatch = trimmed.match(/^(let|var|const)\s+(\w+)/);
            if (varMatch) {
                globalVars.add(varMatch[2]);
            }
            
            // Match: simple assignments without declaration (variable = value)
            const assignMatch = trimmed.match(/^(\w+)\s*=\s*/);
            if (assignMatch && 
                !trimmed.startsWith('function ') && 
                !trimmed.startsWith('class ') &&
                !trimmed.startsWith('export ') &&
                !trimmed.startsWith('import ') &&
                !trimmed.startsWith('const ') &&
                !trimmed.startsWith('let ') &&
                !trimmed.startsWith('var ')) {
                globalVars.add(assignMatch[1]);
            }
        }
        
        // Update depth after processing the line
        depth += openBraces - closeBraces;
        if (depth < 0) depth = 0; // Safety check
    }
    
    return Array.from(globalVars).sort();
}

// Remove global variable declarations and convert to assignments
function hoistGlobalVariables(code, globalVars) {
    if (globalVars.length === 0) return code;
    
    const lines = code.split('\n');
    const processedLines = [];
    let depth = 0;
    
    for (const line of lines) {
        const trimmed = line.trim();
        let processedLine = line;
        
        // Track scope depth
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        
        // At global scope, convert declarations to assignments
        if (depth === 0) {
            for (const varName of globalVars) {
                // Convert: let/var/const varName = value; -> varName = value;
                const declPattern = new RegExp(`^(\\s*)(let|var|const)\\s+${varName}\\s*=`, 'g');
                processedLine = processedLine.replace(declPattern, `$1${varName} =`);
                
                // Remove: let/var/const varName; (declaration without assignment)
                const declOnlyPattern = new RegExp(`^(\\s*)(let|var|const)\\s+${varName}\\s*;\\s*$`, 'g');
                processedLine = processedLine.replace(declOnlyPattern, '');
            }
        }
        
        // Preserve all lines including blank lines
        processedLines.push(processedLine);
        
        // Update depth
        depth += openBraces - closeBraces;
        if (depth < 0) depth = 0;
    }
    
    return processedLines.join('\n');
}

// Separate imports from code and organize the output
function organizeOutput(js, relPhpPath, globalKeywordVars = new Set()) {
    // Collect exported function names
    const exportedFunctions = [];
    const functionMatches = js.matchAll(/export function (\w+)\(/g);
    for (const match of functionMatches) {
        exportedFunctions.push(match[1]);
    }

    // Separate imports and export const declarations from code
    const imports = [];
    const exportConsts = [];
    const codeLines = js.split('\n');
    const nonImportLines = [];

    for (const line of codeLines) {
        if (line.trim().startsWith('import ')) {
            imports.push(line);
        } else if (line.trim().startsWith('export const ')) {
            // Extract export const declarations to keep them outside IIFE
            exportConsts.push(line);
        } else {
            nonImportLines.push(line);
        }
    }

    const codeWithoutImports = nonImportLines.join('\n');

    // Remove export keywords for IIFE wrapping (functions and classes only)
    let wrappedCode = codeWithoutImports.replace(/^export (function|class) /gm, '$1 ');
    
    // Extract global variables from the code
    const globalVars = extractGlobalVariables(wrappedCode);
    
    // Merge both sets of global variables
    const allGlobalVars = Array.from(new Set([...globalKeywordVars, ...globalVars])).sort();
    
    // Hoist global variables (convert declarations to assignments)
    wrappedCode = hoistGlobalVariables(wrappedCode, allGlobalVars);

    // Build final output
    const header = buildBanner(relPhpPath, relPhpPath);
    const importsSection = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
    const exportConstsSection = exportConsts.length > 0 ? exportConsts.join('\n') + '\n\n' : '';

    // Build global variables declaration
    const globalVarsDecl = allGlobalVars.length > 0 
        ? `  // Global scope variables (accessible to all functions)\n  let ${allGlobalVars.join(', ')};\n  \n`
        : '  // No global variables detected\n  \n';

    const prelude = `// Environment shims (Node + Browser)
const __ENV__ = { isNode: typeof process !== 'undefined' && process.versions?.node, isBrowser: typeof window !== 'undefined' };

// HTML output helper function
function __outputHtml(lines) {
  console.log(lines.join('\\n'));
}

// Module wrapper - encapsulates all code
// The _ parameter provides access to environment variables (GET, POST, SERVER, etc.)
(function(_) {
${globalVarsDecl}`;

    const epilogue = `
})({
  GET: {},
  POST: {},
  SERVER: {},
  COOKIE: {},
  SESSION: {},
  REQUEST: {},
  FILES: {},
  ENV: process?.env || {}
});

// Selective exports
${exportedFunctions.length > 0 ? `export { ${exportedFunctions.join(', ')} };` : '// No functions to export'}
export { __ENV__, __outputHtml };
`;

    return `${header}${importsSection}${exportConstsSection}${prelude}${wrappedCode}\n${epilogue}`;
}

function transformPhpToJs(php, relPhpPath) {
    let js = php;

    // Normalize line endings
    js = js.replace(/\r\n?/g, '\n');

    // Extract global keyword variables BEFORE they're removed
    const globalKeywordVars = extractGlobalKeywordVars(js);

    // Transform embedded HTML blocks
    js = transformEmbeddedHtml(js);

    // Remove remaining PHP tags
    js = js.replace(/<\?(?:php)?/gi, '').replace(/\?>/g, '');

    // Remove PHP type casts early (before foreach conversion)
    js = js.replace(/\(\s*(int|integer|bool|boolean|float|double|real|string|array|object|unset)\s*\)/g, '');

    // Convert PHP language constructs
    js = convertPhpConstructs(js, relPhpPath);

    // Convert PHP syntax to JavaScript (but not classes/functions yet)
    js = convertPhpSyntax(js);

    // Convert PHP declarations (functions, classes) - AFTER syntax conversion
    // This way classes are processed after $ stripping and other conversions
    js = convertDeclarations(js);

    // Organize and wrap the output
    return organizeOutput(js, relPhpPath, globalKeywordVars);
}

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

// Calculate P90 (90th percentile) from an array of numbers
function calculateP90(values) {
    if (values.length === 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.9) - 1;
    return sorted[Math.max(0, index)];
}

async function main() {
    const { src, dst, recurse, stats: showStats, logLevel } = parseArgs();
    
    // Set log level from command line
    logger.level = logLevel;
    
    const stats = { processed: 0, written: 0, errors: 0 };
    const processingTimes = [];

    logger.info(`Starting conversion... (recurse: ${recurse}, stats: ${showStats}, log level: ${logLevel})`);
    logger.info(`Source: ${src}`);
    logger.info(`Destination: ${dst}`);

    // Check if src is a file or directory
    const srcStat = await fs.stat(src);
    const isFile = srcStat.isFile();
    
    // If src is a file, create an iterator that yields just that file
    const fileIterator = isFile 
        ? (async function*() { yield src; })()
        : walk(src, recurse);
    
    // Determine the base directory for relative path calculation
    const baseDir = isFile ? path.dirname(src) : src;

    for await (const file of fileIterator) {
        if (!file.toLowerCase().endsWith('.php')) continue;
        const rel = path.relative(baseDir, file);
        const targetRel = rel.replace(/\.php$/i, '.js');
        const target = path.join(dst, targetRel);
        
        const startTime = showStats ? performance.now() : 0;
        
        try {
            logger.debug(`Processing: ${file}`);
            const php = await fs.readFile(file, 'utf8');
            const transformed = transformPhpToJs(php, rel.replace(/\\/g, '/'));
            await ensureDir(path.dirname(target));
            await fs.writeFile(target, transformed, 'utf8');
            stats.processed++;
            stats.written++;
            logger.info(`Converted: ${file} -> ${target}`);
            
            if (showStats) {
                const elapsed = performance.now() - startTime;
                processingTimes.push(elapsed);
                logger.debug(`Processing time: ${elapsed.toFixed(2)}ms`);
            }
        } catch (err) {
            logger.error(`Error converting ${file}: ${err.message}`);
            logger.debug(err.stack);
            stats.errors++;
        }
    }

    logger.info(`Conversion complete. Files processed: ${stats.processed}, written: ${stats.written}, errors: ${stats.errors}`);
    
    if (showStats && processingTimes.length > 0) {
        const p90 = calculateP90(processingTimes);
        const avg = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        const min = Math.min(...processingTimes);
        const max = Math.max(...processingTimes);
        
        logger.info('\n--- Processing Statistics ---');
        logger.info(`Total files: ${processingTimes.length}`);
        logger.info(`Average time: ${avg.toFixed(2)}ms`);
        logger.info(`Min time: ${min.toFixed(2)}ms`);
        logger.info(`Max time: ${max.toFixed(2)}ms`);
        logger.info(`P90 time: ${p90.toFixed(2)}ms`);
    }
    
    // Shutdown log4js to flush logs
    log4js.shutdown(() => {
        process.exit(stats.errors > 0 ? 1 : 0);
    });
}

main().catch(err => { console.error(err); process.exit(1); });
