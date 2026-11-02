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

const { recordMovement, saveProduct, removeProduct, applyOpname, bulkSaveProducts, getMovements, getProducts, stockSummary, suggestCode, sellCart, reverseMovement, findMovements } = await import('../lib/stock-store.js');
const { getSales, saveSale, setSaleVerified, setSaleFailed, pendingOrders, subscribeSales } = await import('../lib/sales-store.js');
const { productSchema, movementSchema, bulkRowSchema, openingSchema, fieldErrors } = await import('../lib/validators.js');
const { products: seedProducts, movements: seedMovements, movementKinds, deriveKind, kindLabel, nextSaleCode, nextServiceCode, transactions: seedSales } = await import('../lib/demo-data.js');

const read = (k) => JSON.parse(store[k]);
let n = 0;
const t = (label, fn) => { fn(); n += 1; console.log(`  ok  ${label}`); };
const ta = async (label, fn) => { await fn(); n += 1; console.log(`  ok  ${label}`); };

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

console.log('penjualan kasir (sellCart)');
const stockOf = (code) => getProducts().find(p => p.code === code).stock;
t('keranjang kosong ditolak', () => {
    assert.equal(sellCart({ items: [], reference: 'TRX-X-001' }).ok, false);
});
t('jumlah tidak valid diabaikan', () => {
    const before = getMovements().length;
    assert.equal(sellCart({ items: [{ productId: '1', quantity: 0 }, { productId: '1', quantity: -3 }], reference: 'TRX-X-002' }).ok, false);
    assert.equal(getMovements().length, before, 'tidak boleh ada mutasi dari jumlah tidak valid');
});
t('item melebihi stok ditolak tanpa efek samping', () => {
    const before = getMovements().length;
    const oliBefore = stockOf('OLI-001');
    const r = sellCart({ items: [{ productId: '1', quantity: oliBefore + 1 }], reference: 'TRX-X-003' });
    assert.equal(r.ok, false);
    assert.equal(r.short[0].have, oliBefore);
    assert.equal(getMovements().length, before, 'stok kurang tidak boleh menulis mutasi');
    assert.equal(stockOf('OLI-001'), oliBefore, 'stok tidak boleh berubah');
});
t('satu item kurang membatalkan seluruh transaksi', () => {
    const before = getMovements().length;
    const busiBefore = stockOf('BUS-007');
    const oliBefore = stockOf('OLI-001');
    const r = sellCart({
        items: [{ productId: '1', quantity: 2 }, { productId: '3', quantity: busiBefore + 5 }],
        reference: 'TRX-X-004',
    });
    assert.equal(r.ok, false, 'transaksi harus gagal karena satu item kurang');
    assert.equal(r.short.length, 1);
    assert.equal(getMovements().length, before, 'tidak boleh ada mutasi sama sekali');
    assert.equal(stockOf('BUS-007'), busiBefore, 'barang yang cukup tidak boleh ikut berubah');
    assert.equal(stockOf('OLI-001'), oliBefore, 'barang pertama tidak boleh ikut berubah');
});
t('penjualan valid mengurangi stok semua item sekaligus', () => {
    const oliBefore = stockOf('OLI-001');
    const busiBefore = stockOf('BUS-007');
    const r = sellCart({ items: [{ productId: '1', quantity: 2 }, { productId: '3', quantity: 5 }], reference: 'TRX-260930-001', party: 'Budi Santoso', notes: 'Penjualan dari kasir.' });
    assert.equal(r.ok, true);
    assert.equal(r.movements.length, 2);
    assert.equal(stockOf('OLI-001'), oliBefore - 2);
    assert.equal(stockOf('BUS-007'), busiBefore - 5);
    for (const m of r.movements) {
        assert.equal(m.type, 'OUT');
        assert.equal(m.kind, 'PEMAKAIAN');
        assert.equal(m.reference, 'TRX-260930-001', 'mutasi harus bisa dikejak ke struk');
        assert.equal(m.party, 'Budi Santoso');
        assert.equal(m.delta, -m.quantity);
    }
    assert.equal(findMovements('TRX-260930-001').length, 2);
});
t('produk sama digabung jadi satu pengurangan', () => {
    const before = stockOf('OLI-001');
    const movementsBefore = getMovements().length;
    const r = sellCart({ items: [{ productId: '1', quantity: 1 }, { productId: '1', quantity: 1 }], reference: 'TRX-260930-002' });
    assert.equal(r.ok, true);
    assert.equal(stockOf('OLI-001'), before - 2);
    assert.equal(getMovements().length, movementsBefore + 1, 'dua baris barang sama harus jadi satu mutasi');
});
t('after pada mutasi mengikuti urutan rak', () => {
    const r = sellCart({ items: [{ productId: '5', quantity: 1 }], reference: 'TRX-260930-003' });
    assert.equal(r.ok, true);
    assert.equal(r.movements[0].after, r.movements[0].before - 1);
    assert.equal(r.movements[0].before, stockOf('RNT-008') + 1);
});
t('stok nol tidak bisa dijual', () => {
    const zero = saveProduct({ code: 'NOL-001', name: 'Tanpa Stok', category: 'Lainnya', unit: 'Pcs', purchasePrice: '1000', sellingPrice: '1500', stock: '0', minimumStock: '0' });
    assert.equal(zero.ok, true);
    assert.equal(sellCart({ items: [{ productId: zero.product.id, quantity: 1 }], reference: 'TRX-260930-004' }).ok, false);
});

console.log('nomor urut');
t('nextSaleCode naik berurutan per hari', () => {
    assert.equal(nextSaleCode('2026-09-30', []), 'TRX-260930-001');
    const list = [{ code: 'TRX-260930-001' }, { code: 'TRX-260930-002' }, { code: 'TRX-260929-009' }];
    assert.equal(nextSaleCode('2026-09-30', list), 'TRX-260930-003');
    assert.equal(nextSaleCode('2026-09-29', list), 'TRX-260929-010', 'nomor urut per hari terpisah');
});
t('nextServiceCode naik berurutan per hari', () => {
    assert.equal(nextServiceCode('2026-09-30', []), 'SRV-260930-001');
    assert.equal(nextServiceCode('2026-09-30', [{ id: 'SRV-260930-001' }]), 'SRV-260930-002');
});

console.log('pembatalan pembayaran');
t('reverseMovement mengembalikan stok mutasi keluar', () => {
    const before = stockOf('BUS-007');
    const r = sellCart({ items: [{ productId: '3', quantity: 3 }], reference: 'TRX-260930-005' });
    assert.equal(r.ok, true);
    const sold = stockOf('BUS-007');
    assert.equal(sold, before - 3);
    const back = reverseMovement(r.movements[0].id, { notes: 'Pembayaran ditolak.' });
    assert.equal(back.ok, true);
    assert.equal(stockOf('BUS-007'), before, 'stok harus kembali seperti semula');
    assert.equal(back.movement.type, 'IN');
    assert.equal(back.movement.kind, 'KOREKSI');
    assert.equal(back.movement.reference, `PEMBATALAN ${r.movements[0].code}`);
    assert.equal(back.movement.delta, 3);
});
t('mutasi tidak bisa dibatalkan dua kali', () => {
    const r = sellCart({ items: [{ productId: '3', quantity: 1 }], reference: 'TRX-260930-006' });
    assert.equal(reverseMovement(r.movements[0].id).ok, true);
    const stock = stockOf('BUS-007');
    assert.equal(reverseMovement(r.movements[0].id).ok, false, 'pembatalan ganda harus ditolak');
    assert.equal(stockOf('BUS-007'), stock, 'stok tidak boleh dikembalikan dua kali');
});
t('mutasi masuk tidak bisa dibatalkan', () => {
    const saved = saveProduct({ code: 'BAT-010', name: 'Barang Batal', category: 'Lainnya', unit: 'Pcs', purchasePrice: '1000', sellingPrice: '1500', stock: '4', minimumStock: '0' });
    const opening = getMovements().find(m => m.productId === saved.product.id);
    assert.equal(opening.kind, 'STOKAWAL');
    assert.equal(reverseMovement(opening.id).ok, false);
});
t('mutasi yang tidak ada ditolak', () => {
    assert.equal(reverseMovement('mv-tidak-ada').ok, false);
});

console.log('sales-store');
t('penjualan tersimpan dengan kode dan status', () => {
    const r = saveSale({ code: 'TRX-260930-010', date: '2026-09-30', customer: 'Budi Santoso', method: 'Tunai', items: [{ productId: '1', productCode: 'OLI-001', productName: 'Oli Mesin MPX 1 0.8L', unit: 'Botol', quantity: 2, price: 58000 }], subtotal: 116000, discount: 0, total: 116000, paid: 120000, change: 4000 });
    assert.equal(r.ok, true);
    const sale = getSales().find(s => s.code === 'TRX-260930-010');
    assert.equal(sale.customer, 'Budi Santoso');
    assert.equal(sale.total, 116000);
    assert.equal(sale.status, 'Selesai');
    assert.equal(sale.pendingVerification, false);
    assert.equal(sale.items[0].quantity, 2);
});
t('pembayaran nontunai menunggu verifikasi', () => {
    saveSale({ code: 'TRX-260930-011', date: '2026-09-30', customer: 'Pelanggan Umum', method: 'QRIS', items: [], subtotal: 50000, discount: 0, total: 50000, paid: 50000, change: 0, reference: 'TRX-260930-011', pendingVerification: true });
    const sale = getSales().find(s => s.code === 'TRX-260930-011');
    assert.equal(sale.pendingVerification, true);
    assert.equal(sale.status, 'Menunggu Verifikasi');
    assert.deepEqual(pendingOrders().map(s => s.code), ['TRX-260930-011']);
});
t('verifikasi menandai transaksi selesai', () => {
    const r = setSaleVerified('TRX-260930-011');
    assert.equal(r.ok, true);
    assert.equal(r.changed, true);
    const sale = getSales().find(s => s.code === 'TRX-260930-011');
    assert.equal(sale.pendingVerification, false);
    assert.equal(sale.status, 'Selesai');
    assert.equal(pendingOrders().length, 0);
});
t('verifikasi ulang tidak mengubah apa pun', () => {
    const r = setSaleVerified('TRX-260930-011');
    assert.equal(r.ok, true);
    assert.equal(r.changed, false);
});
t('verifikasi kode yang tidak ada ditolak', () => {
    assert.equal(setSaleVerified('TRX-999999-999').ok, false);
});
t('penjualan tersimpan urut terbaru ke terlama', () => {
    const stamps = getSales().map(s => s.createdAt);
    assert.deepEqual(stamps, [...stamps].sort().reverse());
});
t('subscribeSales tidak melempar saat dilepas', () => {
    const off = subscribeSales(() => {});
    off();
    assert.ok(true);
});

console.log('rekap harian');
t('omzet harian dihitung dari penjualan tersimpan', () => {
    const today = getSales().filter(s => s.date === '2026-09-30');
    const omzet = today.reduce((s, x) => s + x.total, 0);
    assert.equal(omzet, 116000 + 50000);
});

console.log('rekonsiliasi pembayaran');
const { reconcilePendingOrders } = await import('../lib/payment-reconcile.js');
const stockNow = () => getProducts().find(p => p.id === '1').stock;
const mockStatus = (map) => { globalThis.fetch = async (url) => { const id = String(url).split('/').pop(); const status = map[id]; if (!status) return { ok: false, json: async () => ({}) }; return { ok: true, json: async () => ({ status }) }; }; };
const sold = sellCart({ items: [{ productId: '1', quantity: 2 }], reference: 'TRX-260930-012', party: 'Pelanggan Umum', notes: 'Penjualan dari kasir.' });
assert.equal(sold.ok, true);
saveSale({ code: 'TRX-260930-012', date: '2026-09-30', customer: 'Pelanggan Umum', method: 'QRIS', items: [{ productId: '1', productCode: 'OLI-001', productName: 'Oli Mesin MPX 1 0.8L', unit: 'Botol', quantity: 2, price: 58000 }], subtotal: 116000, discount: 0, total: 116000, paid: 116000, change: 0, reference: 'TRX-260930-012', pendingVerification: true });
const afterSell = stockNow();
await ta('pembayaran ditolak mengembalikan stok dan menutup order', async () => {
    mockStatus({ 'TRX-260930-012': 'expired' });
    const r = await reconcilePendingOrders();
    assert.equal(r.verified, 0);
    assert.equal(r.reversed, 1);
    assert.equal(stockNow(), afterSell + 2);
    assert.deepEqual(r.reversedSales.map(s => s.code), ['TRX-260930-012']);
});
await ta('order yang gagal tidak diulang pada pemanggilan berikutnya', async () => {
    const r = await reconcilePendingOrders();
    assert.equal(r.checked, 0);
    assert.equal(r.reversed, 0);
    assert.equal(stockNow(), afterSell + 2);
});
t('transaksi gagal tidak lagi menunggu verifikasi', () => {
    const sale = getSales().find(s => s.code === 'TRX-260930-012');
    assert.equal(sale.pendingVerification, false);
    assert.equal(sale.status, 'Gagal');
    assert.equal(pendingOrders().length, 0);
});
const verifiedCode = 'TRX-260930-013';
sellCart({ items: [{ productId: '1', quantity: 1 }], reference: verifiedCode, party: 'Pelanggan Umum', notes: 'Penjualan dari kasir.' });
saveSale({ code: verifiedCode, date: '2026-09-30', customer: 'Pelanggan Umum', method: 'QRIS', items: [], subtotal: 58000, discount: 0, total: 58000, paid: 58000, change: 0, reference: verifiedCode, pendingVerification: true });
const beforeVerified = stockNow();
await ta('pembayaran terverifikasi hanya menandai selesai', async () => {
    mockStatus({ [verifiedCode]: 'paid' });
    const r = await reconcilePendingOrders();
    assert.equal(r.verified, 1);
    assert.equal(r.reversed, 0);
    assert.equal(stockNow(), beforeVerified);
    assert.equal(getSales().find(s => s.code === verifiedCode).status, 'Selesai');
});
await ta('verifikasi kedua kali tidak dihitung lagi', async () => {
    const r = await reconcilePendingOrders();
    assert.equal(r.checked, 0);
    assert.equal(r.verified, 0);
});
await ta('status tidak dikenal membiarkan order tetap menggantung', async () => {
    const code = 'TRX-260930-014';
    sellCart({ items: [{ productId: '1', quantity: 1 }], reference: code, party: 'Pelanggan Umum', notes: 'Penjualan dari kasir.' });
    saveSale({ code, date: '2026-09-30', customer: 'Pelanggan Umum', method: 'QRIS', items: [], subtotal: 58000, discount: 0, total: 58000, paid: 58000, change: 0, reference: code, pendingVerification: true });
    mockStatus({ [code]: 'pending' });
    const r = await reconcilePendingOrders();
    assert.equal(r.verified, 0);
    assert.equal(r.reversed, 0);
    assert.equal(r.reversedSales.length, 0);
    assert.equal(r.failed, 0, 'status pending itu jawaban sah, bukan kegagalan koneksi');
    assert.deepEqual(pendingOrders().map(s => s.code), [code]);
    setSaleFailed(code);
});
await ta('server tidak bisa dihubungi tetap menggantungkan order', async () => {
    const code = 'TRX-260930-016';
    globalThis.fetch = async () => { throw new Error('jaringan mati'); };
    const r = await reconcilePendingOrders();
    assert.equal(r.failed, 0, 'tidak ada order yang bisa dicek karena fetch dimock error');
    globalThis.fetch = async () => { throw new Error('jaringan mati'); };
    saveSale({ code, date: '2026-09-30', customer: 'Pelanggan Umum', method: 'QRIS', items: [], subtotal: 58000, discount: 0, total: 58000, paid: 58000, change: 0, reference: code, pendingVerification: true });
    const r2 = await reconcilePendingOrders();
    assert.equal(r2.checked, 1);
    assert.equal(r2.failed, 1);
    assert.deepEqual(pendingOrders().map(s => s.code), [code], 'order tidak diubah saat gagal dicek');
    setSaleFailed(code);
});
t('penjualan perlu tinjauan tidak dipotong dua kali', () => {
    const code = 'TRX-260930-015';
    const before = stockNow();
    const first = saveSale({ code, date: '2026-09-30', customer: 'Pelanggan Umum', method: 'QRIS', items: [], subtotal: 58000, discount: 0, total: 58000, paid: 58000, change: 0, reference: code, needsReview: true });
    assert.equal(first.sale.status, 'Perlu Tinjauan');
    assert.equal(stockNow(), before);
    assert.equal(getSales().find(s => s.code === code).needsReview, true);
});
t('setSaleFailed menolak kode yang tidak ada', () => {
    assert.equal(setSaleFailed('TRX-999999-999').ok, false);
});

console.log('pemakaian sparepart servis');
const { applyPartDelta, totalParts } = await import('../lib/service-parts.js');
const svc = { id: 'SRV-260930-001', customer: 'Budi Santoso', job: 'Ganti oli' };
t('totalParts menjumlahkan quantity dan aman untuk parts kosong', () => {
    assert.equal(totalParts([{ quantity: 2 }, { quantity: 3 }]), 5);
    assert.equal(totalParts([]), 0);
    assert.equal(totalParts(undefined), 0);
});
t('sparepart servis dipotong sebagai PEMAKAIAN dengan referensi nomor servis', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [], [{ productId: '1', quantity: 1 }, { productId: '1', quantity: 2 }]);
    assert.equal(r.ok, true);
    assert.equal(r.out, 1, 'produk yang sama digabung jadi satu mutasi');
    assert.equal(stockNow(), before - 3);
    const logs = findMovements('SRV-260930-001');
    assert.equal(logs.length, 1);
    assert.equal(logs[0].kind, 'PEMAKAIAN');
    assert.equal(logs[0].type, 'OUT');
    assert.equal(logs[0].quantity, 3);
    assert.equal(logs[0].party, 'Budi Santoso');
});
t('servis tanpa sparepart tidak menghasilkan mutasi', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [], []);
    assert.deepEqual(r, { ok: true, out: 0, back: 0 });
    assert.equal(stockNow(), before);
});
t('servis tidak dilayani kalau sparepart kurang', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [], [{ productId: '1', quantity: before + 5 }]);
    assert.equal(r.ok, false);
    assert.equal(r.out, 0, 'tidak ada mutasi keluar yang tertinggal');
    assert.equal(r.back, 0);
    assert.equal(r.short.length, 1);
    assert.equal(r.short[0].have, before);
    assert.equal(stockNow(), before);
    assert.equal(findMovements('SRV-260930-002').length, 0);
});
t('mengedit status saja tidak menyentuh stok', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [{ productId: '1', quantity: 2 }], [{ productId: '1', quantity: 2 }]);
    assert.deepEqual(r, { ok: true, out: 0, back: 0 });
    assert.equal(stockNow(), before);
});
t('menaikkan quantity memotong selisihnya saja', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [{ productId: '1', quantity: 2 }], [{ productId: '1', quantity: 5 }]);
    assert.deepEqual(r, { ok: true, out: 1, back: 0 });
    assert.equal(stockNow(), before - 3);
    const out = findMovements('SRV-260930-001').find(m => m.type === 'OUT');
    assert.equal(out.quantity, 3, 'hanya selisih yang dicatat, bukan total');
});
t('menurunkan quantity mengembalikan stok sebagai mutasi masuk', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [{ productId: '1', quantity: 5 }], [{ productId: '1', quantity: 2 }]);
    assert.deepEqual(r, { ok: true, out: 0, back: 1 });
    assert.equal(stockNow(), before + 3);
    const back = findMovements('SRV-260930-001').find(m => m.type === 'IN');
    assert.equal(back.kind, 'KOREKSI');
    assert.equal(back.quantity, 3);
    assert.match(back.notes, /dikurangi/);
});
t('menghapus satu sparepart hanya mengembalikan bagian itu', () => {
    const stockOf2 = () => getProducts().find(p => p.id === '2').stock;
    const beforeOne = stockNow();
    const beforeTwo = stockOf2();
    const r = applyPartDelta(svc, [{ productId: '1', quantity: 4 }, { productId: '2', quantity: 1 }], [{ productId: '1', quantity: 4 }]);
    assert.equal(r.ok, true);
    assert.equal(r.out, 0);
    assert.equal(r.back, 1);
    assert.equal(stockNow(), beforeOne, 'produk yang tidak berubah tidak tersentuh');
    assert.equal(stockOf2(), beforeTwo + 1);
    const back = findMovements('SRV-260930-001').filter(m => m.type === 'IN');
    assert.equal(back[0].productId, '2');
});
t('menambah sparepart baru di servis yang sudah ada dipotong penuh', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [{ productId: '1', quantity: 2 }], [{ productId: '1', quantity: 2 }, { productId: '1', quantity: 1 }]);
    assert.equal(r.ok, true);
    assert.equal(stockNow(), before - 1);
});
t('kenaikan yang tidak cukup ditolak tanpa mutasi parsial', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [{ productId: '1', quantity: 1 }], [{ productId: '1', quantity: 1 }, { productId: '1', quantity: before + 1 }]);
    assert.equal(r.ok, false);
    assert.equal(stockNow(), before, 'seluruh perubahan batal, tidak ada yang terkirim');
    assert.equal(r.out, 0);
});
t('kenaikan tepat sama dengan stok yang ada masih dilayani', () => {
    const before = stockNow();
    const r = applyPartDelta(svc, [{ productId: '1', quantity: 1 }], [{ productId: '1', quantity: 1 + before }]);
    assert.equal(r.ok, true);
    assert.equal(stockNow(), 0, 'sisa satu unit dipakai habis, bukan ditolak');
});
t('nomor servis lanjut dari yang tersimpan', () => {
    const list = [{ id: 'SRV-260930-004' }, { id: 'SRV-260930-009' }, { id: 'SRX-260930-001' }];
    assert.equal(nextServiceCode('2026-09-30', list), 'SRV-260930-010');
});

console.log(`\n${n} pemeriksaan lulus.`);
