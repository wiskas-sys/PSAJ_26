// Deteksi import yang tidak terpakai di seluruh kode sumber.
const fs = require('node:fs');
const path = require('node:path');

const ROOTS = ['app', 'components', 'lib', 'tools'];
const SKIP = new Set(['node_modules', '.next', '.git', 'out']);

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.(js|jsx|mjs|cjs)$/.test(entry.name)) out.push(full);
    }
    return out;
}

const files = ROOTS.filter(d => fs.existsSync(d)).flatMap(d => walk(d));
let found = 0;
for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const unused = [];
    const re = /import\s+(?:type\s+)?\{([^}]+)\}\s*from\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(src))) {
        const body = src.slice(m.index + m[0].length);
        for (const raw of m[1].split(',')) {
            const name = raw.trim().split(/\s+as\s+/).pop().replace(/^type\s+/, '').trim();
            if (!name) continue;
            const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
            if (!(body.match(pattern) || []).length) unused.push(name);
        }
    }
    if (unused.length) { found += 1; console.log(`${file} -> ${unused.join(', ')}`); }
}
console.log(found ? `\n${found} file punya import tak terpakai (${files.length} file diperiksa).` : `Semua import terpakai (${files.length} file diperiksa).`);
process.exit(found ? 1 : 0);
