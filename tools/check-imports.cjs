// Deteksi import yang tidak terpakai pada file yang diubah.
const fs = require('node:fs');

const files = [
    'app/(dashboard)/laporan/page.js',
    'app/(dashboard)/stok/page.js',
    'components/movement-form.js',
    'components/stock-movement-dialog.js',
    'components/stock-product-dialog.js',
    'components/stock-opname-dialog.js',
    'components/stock-bulk-import-dialog.js',
    'components/stock-movement-log.js',
    'components/app-shell.js',
    'lib/stock-store.js',
    'lib/demo-data.js',
    'lib/validators.js',
];

let found = 0;
for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const unused = [];
    const re = /import\s*\{([^}]+)\}\s*from\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(src))) {
        const body = src.slice(m.index + m[0].length);
        for (const raw of m[1].split(',')) {
            const name = raw.trim().split(/\s+as\s+/).pop().trim();
            if (!name) continue;
            const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
            if (!(body.match(pattern) || []).length) unused.push(name);
        }
    }
    if (unused.length) { found += 1; console.log(`${file} -> ${unused.join(', ')}`); }
}
console.log(found ? `\n${found} file punya import tak terpakai.` : 'Semua import terpakai.');
