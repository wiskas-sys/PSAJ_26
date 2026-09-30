import { deriveKind, getProducts, makeId, movements, nextMovementCode, nextProductCode, nowStamp, parseNumber, setStoredProducts, stockStatus, todayISO } from '@/lib/demo-data';

const MOVEMENT_KEY = 'dian-motor-movements';
const CHANGE_EVENT = 'dian-motor:stock-change';

function readMovements() {
    try {
        const raw = window.localStorage.getItem(MOVEMENT_KEY);
        const list = !raw ? movements : JSON.parse(raw);
        const source = Array.isArray(list) ? list : movements;
        return source.map(m => (m.kind ? m : { ...m, kind: deriveKind(m) }));
    }
    catch { return movements.map(m => ({ ...m, kind: deriveKind(m) })); }
}
function writeMovements(list) {
    try { window.localStorage.setItem(MOVEMENT_KEY, JSON.stringify(list)); } catch {}
}
function newestFirst(list) { return [...list].sort((a, b) => `${b.createdAt}`.localeCompare(`${a.createdAt}`)); }
function announce() {
    try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)); } catch {}
}

export function getMovements() { return readMovements(); }
export { getProducts, setStoredProducts };
export function subscribeStock(listener) {
    const onChange = () => listener();
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function buildMovement({ product, type, kind, quantity, before, date, reference, party, notes, pool }) {
    const stamp = date || todayISO();
    const after = type === 'OUT' ? before - quantity : before + quantity;
    return {
        id: makeId('mv'),
        code: nextMovementCode(type, stamp, pool),
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        type,
        kind,
        quantity,
        delta: after - before,
        unit: product.unit,
        reference: reference?.trim() || '',
        party: party?.trim() || (type === 'IN' ? '' : 'Penjualan'),
        notes: notes?.trim() || '',
        date: stamp,
        before,
        after,
        createdAt: nowStamp(),
    };
}

const OPENING = { reference: 'STOKAWAL', party: 'Stok Awal' };

export function recordMovement({ productId, type, quantity, date, reference, party, notes }) {
    const list = getProducts();
    const product = list.find(p => p.id === productId);
    if (!product) return { ok: false, error: 'Produk tidak ditemukan.' };
    const qty = Math.trunc(parseNumber(quantity));
    if (qty <= 0) return { ok: false, error: 'Jumlah harus lebih dari 0.' };
    if (type === 'OUT' && qty > product.stock) return { ok: false, error: `Stok ${product.name} tidak mencukupi. Tersedia ${product.stock} ${product.unit}.` };
    const movement = buildMovement({ product, type, kind: type === 'IN' ? 'PEMASOKAN' : 'PEMAKAIAN', quantity: qty, before: product.stock, date, reference, party, notes, pool: readMovements() });
    setStoredProducts(list.map(p => (p.id === productId ? { ...p, stock: movement.after } : p)));
    writeMovements(newestFirst([movement, ...readMovements()]));
    announce();
    return { ok: true, movement, product: { ...product, stock: movement.after } };
}

export function saveProduct(draft, opening = {}) {
    const list = getProducts();
    const payload = {
        ...draft,
        code: draft.code.trim().toUpperCase(),
        name: draft.name.trim(),
        purchasePrice: parseNumber(draft.purchasePrice),
        sellingPrice: parseNumber(draft.sellingPrice),
        stock: Math.trunc(parseNumber(draft.stock)),
        minimumStock: Math.trunc(parseNumber(draft.minimumStock)),
    };
    if (list.some(p => p.code.toLowerCase() === payload.code.toLowerCase() && p.id !== draft.id))
        return { ok: false, error: `Kode barang ${payload.code} sudah dipakai.` };
    if (draft.id) {
        const current = list.find(p => p.id === draft.id);
        if (!current) return { ok: false, error: 'Produk tidak ditemukan.' };
        if (payload.stock < 0) return { ok: false, error: 'Stok tidak boleh negatif.' };
        setStoredProducts(list.map(p => (p.id === draft.id ? { ...p, ...payload } : p)));
        if (payload.stock !== current.stock) {
            const added = payload.stock > current.stock;
            const movement = buildMovement({ product: { ...current, ...payload }, type: added ? 'IN' : 'OUT', kind: 'KOREKSI', quantity: Math.abs(payload.stock - current.stock), before: current.stock, date: todayISO(), reference: 'KOREKSI', party: 'Koreksi Data', notes: 'Penyesuaian stok dari formulir ubah barang.', pool: readMovements() });
            writeMovements(newestFirst([movement, ...readMovements()]));
        }
        announce();
        return { ok: true, product: { ...current, ...payload } };
    }
    const product = { id: makeId('prd'), ...payload };
    setStoredProducts([...list, product]);
    if (product.stock > 0) {
        const movement = buildMovement({ product, type: 'IN', kind: 'STOKAWAL', quantity: product.stock, before: 0, date: opening.date || todayISO(), notes: 'Pencatatan stok awal saat barang didaftarkan.', pool: readMovements(), reference: opening.reference || OPENING.reference, party: opening.party || OPENING.party });
        writeMovements(newestFirst([movement, ...readMovements()]));
    }
    announce();
    return { ok: true, product };
}

export function removeProduct(id) {
    const list = getProducts();
    if (!list.some(p => p.id === id)) return { ok: false, error: 'Produk tidak ditemukan.' };
    setStoredProducts(list.filter(p => p.id !== id));
    announce();
    return { ok: true };
}

export function applyOpname({ date, notes, lines }) {
    const list = getProducts();
    const pool = readMovements();
    const additions = [];
    const next = list.map(p => {
        const line = lines.find(l => l.productId === p.id);
        if (!line) return p;
        const counted = Math.trunc(parseNumber(line.count));
        if (counted === p.stock) return p;
        const added = counted > p.stock;
        additions.push(buildMovement({ product: p, type: added ? 'IN' : 'OUT', kind: 'OPNAME', quantity: Math.abs(counted - p.stock), before: p.stock, date, reference: 'OPNAME', party: 'Stok Opname', notes: notes?.trim() || 'Selisih hasil hitung fisik.', pool: [...additions, ...pool] }));
        return { ...p, stock: counted };
    });
    if (!additions.length) return { ok: false, error: 'Tidak ada selisih yang perlu disimpan.' };
    setStoredProducts(next);
    writeMovements(newestFirst([...additions, ...pool]));
    announce();
    return { ok: true, adjusted: additions.length };
}

export function bulkSaveProducts(rows, { date, reference, party } = {}) {
    const list = getProducts();
    const pool = readMovements();
    const updates = new Map();
    for (const row of rows) {
        const payload = {
            ...row,
            code: row.code.trim().toUpperCase(),
            name: row.name.trim(),
            purchasePrice: parseNumber(row.purchasePrice),
            sellingPrice: parseNumber(row.sellingPrice),
            stock: Math.trunc(parseNumber(row.stock)),
            minimumStock: Math.trunc(parseNumber(row.minimumStock)),
        };
        updates.set(payload.code, payload);
    }
    const created = [...updates.values()].filter(payload => !list.some(p => p.code === payload.code)).map(payload => ({ id: makeId('prd'), ...payload }));
    setStoredProducts([...list.map(p => (updates.has(p.code) ? { ...p, ...updates.get(p.code) } : p)), ...created]);
    const stamp = date || todayISO();
    const additions = [];
    for (const p of created) if (p.stock > 0) additions.push(buildMovement({ product: p, type: 'IN', kind: 'STOKAWAL', quantity: p.stock, before: 0, date: stamp, reference: reference || OPENING.reference, party: party || OPENING.party, notes: 'Diimpor lewat impor massal.', pool: [...additions, ...pool] }));
    if (additions.length) writeMovements(newestFirst([...additions, ...pool]));
    announce();
    return { ok: true, total: rows.length, created: created.length, updated: rows.length - created.length };
}

export function suggestCode(category) { return nextProductCode(category, getProducts()); }
export function stockSummary(list = getProducts()) {
    const low = list.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Menipis').length;
    const out = list.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Habis').length;
    return { total: list.length, low, out, value: list.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0) };
}
