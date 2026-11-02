import { findMovements, reverseMovement } from '@/lib/stock-store';
import { pendingOrders, setSaleFailed, setSaleVerified } from '@/lib/sales-store';

const BAD_STATUS = ['expired', 'failed'];

/**
 * QRIS dan Transfer dicatat di browser saat Midtrans melapor berhasil, tapi
 * pembayaran bisa ditolak belakangan (fraud, expire). Order yang masih
 * menggantung dicek ulang ke Midtrans supaya stok tidak berkurang diam-diam.
 *
 * Dijalankan ulang tiap buka aplikasi, jadi seluruhnya harus idempotent:
 * mutasi pembalik yang sudah ada dilewati dan order cukup satu kali
 * diturunkan ke status akhir, bukan menggantung selamanya.
 */
export async function reconcilePendingOrders() {
    const orders = pendingOrders();
    if (!orders.length) return { checked: 0, reversed: 0, verified: 0, failed: 0, reversedSales: [] };
    const result = { checked: orders.length, reversed: 0, verified: 0, failed: 0, reversedSales: [] };
    for (const order of orders) {
        try {
            const res = await fetch(`/api/midtrans/status/${encodeURIComponent(order.code)}`);
            if (!res.ok) { result.failed += 1; continue; }
            const data = await res.json().catch(() => ({}));
            if (data.status === 'paid') {
                if (setSaleVerified(order.code).changed) result.verified += 1;
                continue;
            }
            if (!BAD_STATUS.includes(data.status)) continue;
            const movements = findMovements(order.code);
            for (const movement of movements) {
                const reversed = reverseMovement(movement.id, { notes: `Pembayaran ${order.code} berstatus ${data.status}, stok dikembalikan.` });
                if (reversed.ok) result.reversed += 1;
            }
            setSaleFailed(order.code);
            if (movements.length) result.reversedSales.push({ code: order.code, status: data.status });
        }
        catch { result.failed += 1; }
    }
    return result;
}
