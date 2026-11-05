import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const KASIR_USER_ID = 'b18e8f2b-da9e-47cd-86f9-1565d1ad2adb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, method = 'DANA', payerName } = body || {};

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database tidak terhubung.' }, { status: 500 });
    }

    // 1. Ambil data payment pending dari database
    const { data: payment, error: pError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (pError || !payment) {
      return NextResponse.json({ error: 'Data pembayaran tidak ditemukan.' }, { status: 404 });
    }

    if (payment.status === 'paid' || payment.status === 'settlement') {
      return NextResponse.json({
        success: true,
        message: 'Pembayaran sudah lunas sebelumnya.',
        orderId,
      });
    }

    const paidAt = new Date().toISOString();
    const resolvedMethod = `QRIS (${method})`;

    // 2. Update status pembayaran di tabel payments menjadi 'paid'
    await supabase
      .from('payments')
      .update({
        status: 'paid',
        transaction_status: 'settlement',
        method: resolvedMethod,
        customer_name: payerName || payment.customer_name || 'Pelanggan QRIS',
        paid_at: paidAt,
      })
      .eq('order_id', orderId);

    // 3. Masukkan transaksi ke tabel transactions jika belum ada
    const { data: existingTrx } = await supabase
      .from('transactions')
      .select('id')
      .eq('transaction_code', orderId)
      .maybeSingle();

    if (!existingTrx) {
      const items = payment.payload?.items || [];
      const totalAmount = Number(payment.amount);

      await supabase.from('transactions').insert({
        transaction_code: orderId,
        idempotency_key: crypto.randomUUID(),
        subtotal: payment.payload?.baseAmount || totalAmount,
        total: totalAmount,
        discount: 0,
        payment_method: resolvedMethod,
        payment_amount: totalAmount,
        change_amount: 0,
        status: 'completed',
        created_by: KASIR_USER_ID,
        created_at: paidAt,
      });

      // 4. Potong stok produk di tabel products dan catat di stock_movements
      for (const item of items) {
        const pId = item.id || item.product?.id || item.product_id;
        const qty = Number(item.qty || item.quantity || 1);
        if (pId) {
          const { data: curProd } = await supabase
            .from('products')
            .select('stock, name, code, unit')
            .eq('id', pId)
            .single();

          if (curProd) {
            const nextStock = Math.max(0, (curProd.stock || 0) - qty);
            await supabase
              .from('products')
              .update({ stock: nextStock, updated_at: paidAt })
              .eq('id', pId);

            // Catat mutasi barang keluar
            await supabase.from('stock_movements').insert({
              product_id: pId,
              type: 'OUT',
              quantity: qty,
              reference: orderId,
              notes: `Penjualan kasir via ${resolvedMethod}`,
              created_at: paidAt,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil diverifikasi! Kasir otomatis lunas.',
      orderId,
      status: 'paid',
      paidAt,
      method: resolvedMethod,
    });
  } catch (err) {
    console.error('API Gateway Pay Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
