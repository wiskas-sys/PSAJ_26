export const products = [];
export const transactions = [];
export const sales = [];
export const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export const stockStatus = (stock, minimum) => stock === 0 ? 'Stok Habis' : stock <= minimum ? 'Stok Menipis' : 'Stok Aman';
export const categories = [];
export const units = ['Pcs', 'Botol', 'Set', 'Pasang', 'Lusin', 'Bungkus', 'Dus'];
export const outReasons = ['Penjualan', 'Servis', 'Rusak', 'Retur', 'Pemakaian Internal', 'Lainnya'];
export const suppliers = [];

export const movementKinds = [
    ['PEMASOKAN', 'Pemasukan'], ['PEMAKAIAN', 'Pemakaian'], ['STOKAWAL', 'Stok Awal'],
    ['KOREKSI', 'Koreksi'], ['OPNAME', 'Opname'],
];
export const kindLabel = (kind) => movementKinds.find(([k]) => k === kind)?.[1] ?? kind;
export const deriveKind = (m) => m.kind ?? (m.reference === 'STOKAWAL' ? 'STOKAWAL' : m.reference === 'KOREKSI' ? 'KOREKSI' : m.reference === 'OPNAME' ? 'OPNAME' : m.type === 'IN' ? 'PEMASOKAN' : 'PEMAKAIAN');

export const movements = [];

export const dateLabel = (iso) => { const d = new Date(`${iso}T00:00:00`); return Number.isNaN(d.getTime()) ? (iso ?? '') : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); };
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const nowStamp = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
export const parseNumber = (value) => { const n = Number(String(value ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : 0; };
export const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export function nextMovementCode(type, date, list = []) {
    const prefix = type === 'IN' ? 'MI' : 'MO';
    const ymd = `${date}`.replaceAll('-', '').slice(2);
    const seq = list.filter(m => `${m.code}`.startsWith(`${prefix}-${ymd}-`)).length + 1;
    return `${prefix}-${ymd}-${String(seq).padStart(3, '0')}`;
}
function nextSequence(prefix, list, key) {
    const top = list.reduce((max, item) => {
        const code = `${item[key]}`;
        if (!code.startsWith(`${prefix}-`)) return max;
        const suffix = Number(code.split('-').pop());
        return Number.isFinite(suffix) && suffix > max ? suffix : max;
    }, 0);
    return `${prefix}-${String(top + 1).padStart(3, '0')}`;
}
export function nextSaleCode(date, list = []) {
    return nextSequence(`TRX-${`${date}`.replaceAll('-', '').slice(2)}`, list, 'code');
}
export function nextServiceCode(date, list = []) {
    return nextSequence(`SRV-${`${date}`.replaceAll('-', '').slice(2)}`, list, 'id');
}
export function nextProductCode(category, list = []) {
    const prefix = `${category ?? ''}`.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'BRG';
    const used = new Set(list.map(p => p.code));
    let n = 1, code = `${prefix}-${String(n).padStart(3, '0')}`;
    while (used.has(code)) { n += 1; code = `${prefix}-${String(n).padStart(3, '0')}`; }
    return code;
}

const STOCK_KEY = 'dian-motor-stock';
export function getProducts() {
    return [];
}
export function setStoredProducts() {}
