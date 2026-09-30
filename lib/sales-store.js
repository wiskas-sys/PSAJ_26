import { makeId, nowStamp, parseNumber, todayISO, transactions as seedSales } from '@/lib/demo-data';

const SALES_KEY = 'dian-motor-sales';
const CHANGE_EVENT = 'dian-motor:sales-change';

function readSales() {
    try {
        const raw = window.localStorage.getItem(SALES_KEY);
        const list = !raw ? seedSales : JSON.parse(raw);
        return Array.isArray(list) ? list : seedSales;
    }
    catch { return seedSales; }
}
function writeSales(list) {
    try { window.localStorage.setItem(SALES_KEY, JSON.stringify(list)); } catch {}
}
function newestFirst(list) { return [...list].sort((a, b) => `${b.createdAt}`.localeCompare(`${a.createdAt}`)); }
function announce() {
    try { window.dispatchEvent(new CustomEvent(CHANGE_EVENT)); } catch {}
}

export function getSales() { return readSales(); }

export function subscribeSales(listener) {
    const onChange = () => listener();
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function saveSale({ code, date, customer, method, items, subtotal, discount, total, paid, change, channel = 'KASIR', reference, pendingVerification = false, needsReview = false, status }) {
    const list = readSales();
    const sale = {
        id: makeId('trx'),
        code,
        date: date || todayISO(),
        customer: customer?.trim() || 'Pelanggan Umum',
        method,
        channel,
        reference: reference || '',
        items: (items ?? []).map(i => ({ productId: i.productId, productCode: i.productCode, productName: i.productName, unit: i.unit, quantity: Math.trunc(parseNumber(i.quantity)), price: parseNumber(i.price) })),
        subtotal: parseNumber(subtotal),
        discount: parseNumber(discount),
        total: parseNumber(total),
        paid: parseNumber(paid),
        change: parseNumber(change),
        pendingVerification: Boolean(pendingVerification),
        needsReview: Boolean(needsReview),
        status: status || (needsReview ? 'Perlu Tinjauan' : pendingVerification ? 'Menunggu Verifikasi' : 'Selesai'),
        createdAt: nowStamp(),
    };
    writeSales(newestFirst([sale, ...list]));
    announce();
    return { ok: true, sale };
}

export function setSaleVerified(code) {
    const list = readSales();
    const sale = list.find(s => s.code === code);
    if (!sale) return { ok: false, error: 'Transaksi tidak ditemukan.' };
    if (!sale.pendingVerification) return { ok: true, sale, changed: false };
    const next = list.map(s => (s.code === code ? { ...s, pendingVerification: false, status: 'Selesai' } : s));
    writeSales(next);
    announce();
    return { ok: true, sale: next.find(s => s.code === code), changed: true };
}

export function setSaleFailed(code) {
    const list = readSales();
    if (!list.some(s => s.code === code)) return { ok: false, error: 'Transaksi tidak ditemukan.' };
    writeSales(list.map(s => (s.code === code ? { ...s, pendingVerification: false, status: 'Gagal' } : s)));
    announce();
    return { ok: true };
}

export function pendingOrders() { return readSales().filter(s => s.pendingVerification && s.channel === 'KASIR'); }
