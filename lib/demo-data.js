export const products = [
    { id: '1', code: 'OLI-001', name: 'Oli Mesin MPX 1 0.8L', category: 'Oli', purchasePrice: 47000, sellingPrice: 58000, stock: 24, minimumStock: 10, unit: 'Botol' },
    { id: '2', code: 'REM-014', name: 'Kampas Rem Depan Vario', category: 'Sparepart', purchasePrice: 52000, sellingPrice: 68000, stock: 4, minimumStock: 5, unit: 'Set' },
    { id: '3', code: 'BUS-007', name: 'Busi NGK CPR9EA-9', category: 'Kelistrikan', purchasePrice: 18000, sellingPrice: 26000, stock: 18, minimumStock: 8, unit: 'Pcs' },
    { id: '4', code: 'FLT-021', name: 'Filter Oli Yamaha', category: 'Mesin', purchasePrice: 28000, sellingPrice: 39000, stock: 0, minimumStock: 6, unit: 'Pcs' },
    { id: '5', code: 'RNT-008', name: 'Rantai Motor 428H', category: 'Sparepart', purchasePrice: 97000, sellingPrice: 125000, stock: 9, minimumStock: 4, unit: 'Set' },
    { id: '6', code: 'BAN-032', name: 'Ban Motor 80/90-14', category: 'Ban', purchasePrice: 185000, sellingPrice: 225000, stock: 7, minimumStock: 3, unit: 'Pcs' },
    { id: '7', code: 'AKI-009', name: 'Aki MF GTZ5S', category: 'Kelistrikan', purchasePrice: 165000, sellingPrice: 205000, stock: 3, minimumStock: 4, unit: 'Pcs' },
    { id: '8', code: 'UDR-005', name: 'Filter Udara Beat', category: 'Mesin', purchasePrice: 32000, sellingPrice: 45000, stock: 13, minimumStock: 5, unit: 'Pcs' },
];
export const transactions = [
    { id: 'TRX-260827-018', date: '27 Agu 2026, 14.32', customer: 'Budi Santoso', total: 246000, method: 'Tunai', status: 'Selesai' },
    { id: 'TRX-260827-017', date: '27 Agu 2026, 13.18', customer: 'Pelanggan Umum', total: 116000, method: 'QRIS', status: 'Selesai' },
    { id: 'TRX-260827-016', date: '27 Agu 2026, 11.45', customer: 'Andi Pratama', total: 390000, method: 'Transfer', status: 'Selesai' },
    { id: 'TRX-260827-015', date: '27 Agu 2026, 10.02', customer: 'Siti Aminah', total: 152000, method: 'Tunai', status: 'Selesai' },
];
export const sales = [
    { day: 'Sen', total: 1250000 }, { day: 'Sel', total: 1680000 }, { day: 'Rab', total: 1420000 },
    { day: 'Kam', total: 2100000 }, { day: 'Jum', total: 1840000 }, { day: 'Sab', total: 2640000 }, { day: 'Min', total: 1980000 },
];
export const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export const stockStatus = (stock, minimum) => stock === 0 ? 'Stok Habis' : stock <= minimum ? 'Stok Menipis' : 'Stok Aman';
export const categories = ['Oli', 'Sparepart', 'Kelistrikan', 'Mesin', 'Ban', 'Aksesoris', 'Lainnya'];
export const units = ['Pcs', 'Botol', 'Set', 'Pasang', 'Lusin', 'Bungkus', 'Dus'];
export const outReasons = ['Penjualan', 'Servis', 'Rusak', 'Retur', 'Pemakaian Internal', 'Lainnya'];
export const suppliers = ['PT Sumber Motor', 'CV Karya Otomotif', 'UD Berkah Sparepart', 'Toko Sparepart Mandiri'];

export const movements = [
    { id: 'mv-1', code: 'MI-260827-004', productId: '1', productCode: 'OLI-001', productName: 'Oli Mesin MPX 1 0.8L', type: 'IN', quantity: 40, delta: 40, unit: 'Botol', reference: 'INV-8821', party: 'PT Sumber Motor', notes: 'Penerimaan PO bulan Agustus', date: '2026-08-27', before: 12, after: 52, createdAt: '2026-08-27 09:12:00' },
    { id: 'mv-2', code: 'MO-260827-003', productId: '1', productCode: 'OLI-001', productName: 'Oli Mesin MPX 1 0.8L', type: 'OUT', quantity: 28, delta: -28, unit: 'Botol', reference: 'TRX-260827-018', party: 'Penjualan', notes: '', date: '2026-08-27', before: 52, after: 24, createdAt: '2026-08-27 14:32:00' },
    { id: 'mv-3', code: 'MI-260827-002', productId: '3', productCode: 'BUS-007', productName: 'Busi NGK CPR9EA-9', type: 'IN', quantity: 24, delta: 24, unit: 'Pcs', reference: 'INV-8814', party: 'CV Karya Otomotif', notes: '', date: '2026-08-27', before: 0, after: 24, createdAt: '2026-08-27 10:05:00' },
    { id: 'mv-4', code: 'MO-260826-006', productId: '8', productCode: 'UDR-005', productName: 'Filter Udara Beat', type: 'OUT', quantity: 7, delta: -7, unit: 'Pcs', reference: 'SRV-260826-010', party: 'Servis', notes: 'Ganti filter udara berkala', date: '2026-08-26', before: 20, after: 13, createdAt: '2026-08-26 11:05:00' },
    { id: 'mv-5', code: 'MI-260826-001', productId: '6', productCode: 'BAN-032', productName: 'Ban Motor 80/90-14', type: 'IN', quantity: 12, delta: 12, unit: 'Pcs', reference: 'INV-8802', party: 'PT Sumber Motor', notes: '', date: '2026-08-26', before: 0, after: 12, createdAt: '2026-08-26 09:00:00' },
    { id: 'mv-6', code: 'MO-260825-007', productId: '2', productCode: 'REM-014', productName: 'Kampas Rem Depan Vario', type: 'OUT', quantity: 6, delta: -6, unit: 'Set', reference: 'TRX-260825-016', party: 'Penjualan', notes: '', date: '2026-08-25', before: 10, after: 4, createdAt: '2026-08-25 16:20:00' },
    { id: 'mv-7', code: 'MI-260825-005', productId: '4', productCode: 'FLT-021', productName: 'Filter Oli Yamaha', type: 'IN', quantity: 6, delta: 6, unit: 'Pcs', reference: 'INV-8795', party: 'CV Karya Otomotif', notes: '', date: '2026-08-25', before: 0, after: 6, createdAt: '2026-08-25 10:15:00' },
    { id: 'mv-8', code: 'MO-260824-004', productId: '4', productCode: 'FLT-021', productName: 'Filter Oli Yamaha', type: 'OUT', quantity: 6, delta: -6, unit: 'Pcs', reference: 'OPNAME-0824', party: 'Stok Opname', notes: 'Selisih fisik tidak ditemukan', date: '2026-08-24', before: 6, after: 0, createdAt: '2026-08-24 17:00:00' },
];

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
export function nextProductCode(category, list = []) {
    const prefix = `${category ?? ''}`.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'BRG';
    const used = new Set(list.map(p => p.code));
    let n = 1, code = `${prefix}-${String(n).padStart(3, '0')}`;
    while (used.has(code)) { n += 1; code = `${prefix}-${String(n).padStart(3, '0')}`; }
    return code;
}

const STOCK_KEY = 'dian-motor-stock';
export function getProducts() {
    let base = products;
    try {
        if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem(STOCK_KEY);
            if (raw)
                base = JSON.parse(raw);
            else
                window.localStorage.setItem(STOCK_KEY, JSON.stringify(base));
        }
    }
    catch {}
    return base;
}
export function setStoredProducts(list) { try { window.localStorage.setItem(STOCK_KEY, JSON.stringify(list)); } catch {} }
