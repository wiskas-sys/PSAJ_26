// Runtime sanity check untuk lib/stock-store.js dan lib/validators.js
// Jalankan: node --experimental-strip-types tools/verify-stock.mjs  (atau lewat npm)
import assert from 'node:assert/strict';

const store = {};
globalThis.window = {
    localStorage: {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
    },
    dispatchEvent: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
};

const { recordMovement, saveProduct, removeProduct, applyOpname, bulkSaveProducts, getMovements, getProducts, stockSummary, suggestCode } = await import('../lib/stock-store.js');
const { productSchema, movementSchema, bulkRowSchema, openingSchema, fieldErrors } = await import('../lib/validators.js');
const { products: seedProducts, movements: seedMovements, movementKinds, deriveKind, kindLabel } = await import('../lib/demo-data.js');

const read = (k) => JSON.parse(store[k]);
let n = 0;
const t = (label, fn) => { fn(); n += 1; console.log(`  ok  ${label}`); };

console.log('validators');
t('productSchema menolak nama kosong', () => {
    const r = productSchema.safeParse({ code: 'X-1', name: '   ', category: 'Oli', unit: 'Pcs', purchasePrice: '1', sellingPrice: '2', stock: '1', minimumStock: '0' });
    assert.equal(r.success, false);
    assert.match(fieldErrors(r).name, /Nama barang wajib diisi/);
});
t('productSchema menerima angka terformat', () => {
    const r = productSchema.safeParse({ code: 'X-1', name: 'Busi', category: 'Oli', unit: 'Pcs', purchasePrice: '47.000', sellingPrice: '58000', stock: '24', minimumStock: '10' });
    assert.equal(r.success, true);
    assert.equal(r.data.purchasePrice, 47);
    assert.equal(r.data.stock, 24);
});
t('movementSchema menolak jumlah 0 dan negatif', () => {
    for (const quantity of ['0', '-3']) {
        const r = movementSchema.safeParse({ productId: '1', type: 'IN', quantity, date: '2026-09-30' });
        assert.equal(r.success, false, `quantity=${quantity} seharusnya gagal`);
    }
});
t('bulkRowSchema menolak harga jual negatif', () => {
    const r = bulkRowSchema.safeParse({ code: 'A', name: 'A', category: 'Oli', unit: 'Pcs', stock: '1', minimumStock: '0', purchasePrice: '1', sellingPrice: '-5' });
    assert.equal(r.success, false);
});
t('openingSchema menolak tanggal kosong', () => {
    const r = openingSchema.safeParse({ date: '', reference: 'INV-1', party: 'PT A' });
    assert.equal(r.success, false);
    assert.match(fieldErrors(r).date, /Tanggal penerimaan wajib diisi/);
});
t('openingSchema menerima referensi kosong', () => {
    const r = openingSchema.safeParse({ date: '2026-09-30', reference: '', party: '' });
    assert.equal(r.success, true);
    assert.equal(r.data.reference, '');
});

console.log('jenis mutasi');
t('lima jenis mutasi terdaftar dengan label', () => {
    assert.deepEqual(movementKinds.map(([k]) => k), ['PEMASOKAN', 'PEMAKAIAN', 'STOKAWAL', 'KOREKSI', 'OPNAME']);
    assert.equal(kindLabel('PEMASOKAN'), 'Pemasukan');
    assert.equal(kindLabel('OPNAME'), 'Opname');
    assert.equal(kindLabel('NGAWUR'), 'NGAWUR');
});
t('semua mutasi seed punya kind yang dikenal', () => {
    for (const m of getMovements()) assert.ok(movementKinds.some(([k]) => k === m.kind), `kind tidak dikenal: ${m.kind}`);
});
t('deriveKind menebak mutasi lama dari referensi', () => {
    assert.equal(deriveKind({ type: 'IN', reference: 'STOKAWAL' }), 'STOKAWAL');
    assert.equal(deriveKind({ type: 'IN', reference: 'KOREKSI' }), 'KOREKSI');
    assert.equal(deriveKind({ type: 'OUT', reference: 'OPNAME' }), 'OPNAME');
    assert.equal(deriveKind({ type: 'IN', reference: 'INV-9' }), 'PEMASOKAN');
    assert.equal(deriveKind({ type: 'OUT', reference: 'TRX-1' }), 'PEMAKAIAN');
    assert.equal(deriveKind({ type: 'IN', kind: 'OPNAME', reference: 'INV-9' }), 'OPNAME', 'kind eksplisit harus menang');
});
t('mutasi lama tanpa kind dimigrasikan saat dibaca', () => {
    const legacy = [
        { id: 'legacy-1', code: 'MI-260801-001', productId: '1', productName: 'Oli', type: 'IN', quantity: 5, delta: 5, unit: 'Botol', reference: 'STOKAWAL', party: 'Stok Awal', notes: '', date: '2026-08-01', before: 0, after: 5, createdAt: '2026-08-01 08:00:00' },
        { id: 'legacy-2', code: 'MO-260802-001', productId: '1', productName: 'Oli', type: 'OUT', quantity: 2, delta: -2, unit: 'Botol', reference: 'TRX-1', party: 'Penjualan', notes: '', date: '2026-08-02', before: 5, after: 3, createdAt: '2026-08-02 08:00:00' },
    ];
    store['dian-motor-movements'] = JSON.stringify(legacy);
    const migrated = getMovements();
    assert.equal(migrated.length, 2);
    const stokAwal = migrated.find(m => m.id === 'legacy-1');
    const penjualan = migrated.find(m => m.id === 'legacy-2');
    assert.equal(stokAwal.kind, 'STOKAWAL', 'referensi STOKAWAL harus jadi STOKAWAL');
    assert.equal(penjualan.kind, 'PEMAKAIAN', 'referensi TRX harus jadi PEMAKAIAN');
    assert.ok(migrated.every(m => m.kind), 'semua entri lama harus dapat kind');
});

console.log('stock-store');
t('data legacy dibersihkan sebelum diuji ulang', () => {
    delete store['dian-motor-movements'];
    store['dian-motor-stock'] = JSON.stringify(seedProducts);
    assert.equal(getMovements().length, seedMovements.length);
});
t('seed terhidrasi ke localStorage', () => {
    assert.equal(getProducts().length, 8);
    assert.ok(getMovements().length >= 8);
    assert.equal(read('dian-motor-stock').length, 8);
});
t('kode barang baru tidak bentrok', () => {
    assert.equal(saveProduct({ code: 'OLI-001', name: 'Duplikat', category: 'Oli', unit: 'Pcs', purchasePrice: 1, sellingPrice: 2, stock: 0, minimumStock: 0 }).ok, false);
    assert.equal(suggestCode('Oli'), 'OLI-002');
});
t('tambah barang + catat stok awal sebagai mutasi', () => {
    const before = getMovements().length;
    const r = saveProduct({ code: 'oli-009', name: '  Busi Iridium  ', category: 'Kelistrikan', unit: 'Pcs', purchasePrice: '22000', sellingPrice: '32000', stock: '30', minimumStock: '5' });
    assert.equal(r.ok, true);
    assert.equal(r.product.code, 'OLI-009');
    assert.equal(r.product.name, 'Busi Iridium');
    assert.equal(r.product.stock, 30);
    const added = getMovements();
    assert.equal(added.length, before + 1);
    assert.equal(added[0].reference, 'STOKAWAL');
    assert.equal(added[0].type, 'IN');
    assert.equal(added[0].after, 30);
    assert.equal(added[0].kind, 'STOKAWAL');
});
t('tambah barang tanpa opening tetap kompatibel', () => {
    const r = saveProduct({ code: 'KAT-010', name: 'Kampas Kopling', category: 'Sparepart', unit: 'Set', purchasePrice: '35000', sellingPrice: '45000', stock: '8', minimumStock: '3' });
    assert.equal(r.ok, true);
    const m = getMovements()[0];
    assert.equal(m.kind, 'STOKAWAL');
    assert.equal(m.reference, 'STOKAWAL');
    assert.equal(m.party, 'Stok Awal');
    assert.match(m.date, /^\d{4}-\d{2}-\d{2}$/);
});
t('opening diteruskan ke mutasi stok awal', () => {
    const r = saveProduct({ code: 'AKU-011', name: 'Aki 12V 7Ah', category: 'Kelistrikan', unit: 'Pcs', purchasePrice: '210000', sellingPrice: '265000', stock: '12', minimumStock: '4' }, { date: '2026-08-15', reference: 'INV-9001', party: 'UD Berkah Sparepart' });
    assert.equal(r.ok, true);
    const m = getMovements()[0];
    assert.equal(m.kind, 'STOKAWAL');
    assert.equal(m.date, '2026-08-15', 'tanggal dari opening harus dipakai');
    assert.equal(m.reference, 'INV-9001');
    assert.equal(m.party, 'UD Berkah Sparepart');
    assert.equal(m.after, 12);
});
t('opening tidak mengotori objek produk', () => {
    const product = getProducts().find(p => p.code === 'AKU-011');
    assert.equal(product.opening, undefined, 'field opening tidak boleh ikut ke produk');
    assert.equal(product.date, undefined);
    assert.equal(product.party, undefined);
    assert.equal(product.reference, undefined);
});
t('opening diabaikan saat mengubah barang', () => {
    const target = getProducts().find(p => p.code === 'AKU-011');
    const before = getMovements().length;
    saveProduct({ ...target, stock: 20 }, { date: '2026-01-01', reference: 'INV-X', party: 'PT Palsu' });
    const m = getMovements()[0];
    assert.equal(m.kind, 'KOREKSI', 'ubah barang harus KOREKSI bukan STOKAWAL');
    assert.equal(m.reference, 'KOREKSI');
    assert.equal(m.party, 'Koreksi Data');
    assert.notEqual(m.date, '2026-01-01');
    assert.equal(getMovements().length, before + 1);
});
t('barang masuk menambah stok dan nomor urut naik', () => {
    const used = getMovements().filter(m => m.code.startsWith('MI-260930-')).length;
    const r = recordMovement({ productId: '1', type: 'IN', quantity: 12, date: '2026-09-30', reference: 'INV-9', party: 'PT Sumber Motor' });
    assert.equal(r.ok, true);
    assert.equal(r.movement.before, 24);
    assert.equal(r.movement.after, 36);
    assert.equal(r.movement.delta, 12);
    assert.equal(r.movement.code, `MI-260930-${String(used + 1).padStart(3, '0')}`);
    assert.equal(r.movement.kind, 'PEMASOKAN');
    assert.equal(getProducts().find(p => p.id === '1').stock, 36);
    const second = recordMovement({ productId: '1', type: 'IN', quantity: 1, date: '2026-09-30' });
    assert.equal(second.movement.code, `MI-260930-${String(used + 2).padStart(3, '0')}`);
});
t('barang keluar melebihi stok ditolak tanpa mengubah data', () => {
    const snapshot = read('dian-motor-stock');
    const r = recordMovement({ productId: '1', type: 'OUT', quantity: 999, date: '2026-09-30' });
    assert.equal(r.ok, false);
    assert.match(r.error, /tidak mencukupi/);
    assert.deepEqual(read('dian-motor-stock'), snapshot);
});
t('barang keluar valid mengurangi stok', () => {
    const used = getMovements().filter(m => m.code.startsWith('MO-260930-')).length;
    const r = recordMovement({ productId: '1', type: 'OUT', quantity: '6', date: '2026-09-30', party: 'Servis' });
    assert.equal(r.ok, true);
    assert.equal(r.movement.before, 37);
    assert.equal(r.movement.after, 31);
    assert.equal(r.movement.code, `MO-260930-${String(used + 1).padStart(3, '0')}`);
    assert.equal(r.movement.delta, -6);
    assert.equal(r.movement.kind, 'PEMAKAIAN');
});
t('ubah barang tanpa ubah stok tidak menambah mutasi', () => {
    const target = getProducts().find(p => p.code === 'OLI-001');
    const before = getMovements().length;
    const r = saveProduct({ ...target, sellingPrice: 60000 });
    assert.equal(r.ok, true);
    assert.equal(r.product.sellingPrice, 60000);
    assert.equal(getMovements().length, before);
});
t('ubah barang dengan ubah stok menambah mutasi KOREKSI', () => {
    const target = getProducts().find(p => p.code === 'OLI-001');
    const before = getMovements().length;
    saveProduct({ ...target, stock: 40 });
    assert.equal(getMovements().length, before + 1);
    assert.equal(getMovements()[0].reference, 'KOREKSI');
    assert.equal(getMovements()[0].delta, 9);
    assert.equal(getMovements()[0].kind, 'KOREKSI');
    assert.equal(getProducts().find(p => p.code === 'OLI-001').stock, 40);
});
t('opname hanya menulis selisih', () => {
    const catalog = getProducts();
    const r = applyOpname({ date: '2026-09-30', notes: 'Hitung bulanan', lines: [{ productId: '3', count: 15 }, { productId: '4', count: 6 }, { productId: '5', count: 9 }] });
    assert.equal(r.ok, true);
    assert.equal(r.adjusted, 2);
    assert.equal(getProducts().find(p => p.id === '3').stock, 15);
    assert.equal(getProducts().find(p => p.id === '4').stock, 6);
    assert.equal(getProducts().find(p => p.id === '5').stock, 9);
    const log = getMovements()[0];
    assert.equal(log.reference, 'OPNAME');
    assert.equal(log.party, 'Stok Opname');
    assert.equal(log.notes, 'Hitung bulanan');
    assert.equal(log.kind, 'OPNAME');
    assert.ok(catalog.length === getProducts().length);
});
t('opname tanpa selisih ditolak', () => {
    const r = applyOpname({ date: '2026-09-30', lines: [{ productId: '3', count: 15 }] });
    assert.equal(r.ok, false);
    assert.match(r.error, /Tidak ada selisih/);
});
t('impor massal membuat dan memperbarui tanpa menghapus katalog', () => {
    const before = getProducts().length;
    const r = bulkSaveProducts([
        { code: 'oli-001', name: 'Oli Mesin MPX 1 0.8L', category: 'Oli', unit: 'Botol', stock: '30', minimumStock: '10', purchasePrice: '47000', sellingPrice: '60000' },
        { code: 'KAT-007', name: 'Kawat Kopling', category: 'Sparepart', unit: 'Pcs', stock: '15', minimumStock: '5', purchasePrice: '8500', sellingPrice: '12000' },
    ]);
    assert.equal(r.ok, true);
    assert.equal(r.created, 1);
    assert.equal(r.updated, 1);
    assert.equal(getProducts().length, before + 1, 'barang lama harus tetap ada');
    assert.equal(getProducts().find(p => p.code === 'KAT-007').stock, 15);
    assert.equal(getProducts().find(p => p.code === 'OLI-001').stock, 30);
    assert.ok(getProducts().some(p => p.code === 'BAN-032'), 'barang yang tidak ikut diimpor harus utuh');
    assert.equal(getMovements()[0].reference, 'STOKAWAL');
    assert.equal(getMovements()[0].kind, 'STOKAWAL');
});
t('impor massal memakai tanggal dari argumen opening', () => {
    bulkSaveProducts([{ code: 'BLT-009', name: 'Baut 8mm', category: 'Sparepart', unit: 'Pcs', stock: '50', minimumStock: '10', purchasePrice: '300', sellingPrice: '600' }], { date: '2026-07-01', reference: 'INV-7788', party: 'Toko Sparepart Mandiri' });
    const m = getMovements()[0];
    assert.equal(m.kind, 'STOKAWAL');
    assert.equal(m.date, '2026-07-01');
    assert.equal(m.reference, 'INV-7788');
    assert.equal(m.party, 'Toko Sparepart Mandiri');
});
t('barang baru berstok 0 tidak menambah mutasi', () => {
    const before = getMovements().length;
    saveProduct({ code: 'ZER-001', name: 'Barang Tanpa Stok', category: 'Lainnya', unit: 'Pcs', purchasePrice: '1000', sellingPrice: '1500', stock: '0', minimumStock: '0' });
    assert.equal(getMovements().length, before, 'stok 0 tidak boleh menulis mutasi');
});
t('impor massal banyak baris tidak saling menimpa', () => {
    const before = getProducts().length;
    bulkSaveProducts([
        { code: 'BLT-001', name: 'Baut 10mm', category: 'Sparepart', unit: 'Pcs', stock: '100', minimumStock: '20', purchasePrice: '500', sellingPrice: '900' },
        { code: 'BLT-002', name: 'Mur 10mm', category: 'Sparepart', unit: 'Pcs', stock: '80', minimumStock: '20', purchasePrice: '400', sellingPrice: '800' },
    ]);
    assert.equal(getProducts().length, before + 2);
    assert.ok(getProducts().some(p => p.code === 'BLT-001' && p.stock === 100));
    assert.ok(getProducts().some(p => p.code === 'BLT-002' && p.stock === 80));
});
t('jumlah desimal dipotong menjadi bilangan bulat', () => {
    const r = recordMovement({ productId: '1', type: 'IN', quantity: '4.7', date: '2026-09-30' });
    assert.equal(r.ok, true);
    assert.equal(r.movement.quantity, 4);
    assert.equal(getProducts().find(p => p.id === '1').stock, r.movement.after);
    assert.ok(Number.isInteger(getProducts().find(p => p.id === '1').stock));
});
t('hapus barang', () => {
    const id = getProducts().find(p => p.code === 'KAT-007').id;
    const before = getProducts().length;
    assert.equal(removeProduct(id).ok, true);
    assert.equal(getProducts().length, before - 1);
    assert.equal(removeProduct(id).ok, false);
});
t('ringkasan stok dihitung dari data', () => {
    const s = stockSummary();
    const expected = getProducts().reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
    assert.equal(s.total, getProducts().length);
    assert.equal(s.low + s.out + (s.total - s.low - s.out), s.total);
    assert.equal(s.value, expected);
    assert.ok(s.value > 0);
});
t('riwayat tetap urut terbaru ke terlama', () => {
    const stamps = getMovements().map(m => m.createdAt);
    assert.deepEqual(stamps, [...stamps].sort().reverse());
});
t('setiap mutasi punya kind saat dibaca dari localStorage', () => {
    const written = read('dian-motor-movements');
    assert.ok(written.length > 0);
    assert.ok(written.every(m => m.kind), 'semua mutasi tersimpan harus punya kind');
    assert.ok(written.every(m => movementKinds.some(([k]) => k === m.kind)));
});

console.log(`\n${n} pemeriksaan lulus.`);
