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
