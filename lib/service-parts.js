import { recordStockMovement } from '@/lib/supabase/stock-products';

/** Baris yang menunjuk produk sama dijumlahkan, bukan ditimpa. */
function indexParts(parts) {
    const map = new Map();
    for (const part of parts ?? []) map.set(part.productId, (map.get(part.productId) ?? 0) + part.quantity);
    return map;
}

export function totalParts(parts) {
    return (parts ?? []).reduce((sum, p) => sum + p.quantity, 0);
}

/**
 * Sisa perubahan sparepart untuk satu servis.
 *
 * Selisih positif dipotong sebagai PEMAKAIAN, selisih negatif dikembalikan
 * sebagai KOREKSI supaya jejaknya tetap terlihat di riwayat mutasi. Sisa nol
 * tidak menghasilkan mutasi apa pun, jadi mengedit status atau progress saja
 * tidak menyentuh stok. Semua penulisan dilewatkan ke satu order yang sama,
 * sehingga gagal di tengah jalan tidak meninggalkan sebagian perubahan.
 */
export async function applyPartDelta(service, before, after) {
    const beforeQty = indexParts(before);
    const afterQty = indexParts(after);
    const ids = new Set([...beforeQty.keys(), ...afterQty.keys()]);
    const out = [];
    const back = [];
    for (const id of ids) {
        const delta = (afterQty.get(id) ?? 0) - (beforeQty.get(id) ?? 0);
        if (delta > 0) out.push({ productId: id, quantity: delta });
        else if (delta < 0) back.push({ productId: id, quantity: -delta });
    }
    if (!out.length && !back.length) return { ok: true, out: 0, back: 0 };

    let consumed = 0;
    for (const line of out) {
        try {
            await recordStockMovement({ productId: line.productId, type: 'OUT', quantity: line.quantity,
                reference: service.id, party: service.customer || 'Servis', notes: `Sparepart untuk ${service.job}.`, kind: 'PEMAKAIAN' });
            consumed++;
        } catch (error) {
            return { ok: false, error: error.message || 'Gagal memotong stok sparepart di Supabase.', out: consumed, back: 0 };
        }
    }
    let restored = 0;
    for (const line of back) {
        try {
            await recordStockMovement({ productId: line.productId, type: 'IN', kind: 'KOREKSI', quantity: line.quantity,
                reference: service.id, party: service.customer || 'Servis', notes: `Sparepart ${service.id} dikurangi, stok dikembalikan.` });
            restored++;
        } catch (error) { return { ok: false, error: error.message || 'Gagal mengembalikan stok sparepart.', out: consumed, back: restored }; }
    }
    return { ok: true, out: consumed, back: restored };
}
