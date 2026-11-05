import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const KASIR_USER_ID = 'b18e8f2b-da9e-47cd-86f9-1565d1ad2adb';

/**
 * Ekstrak nominal angka dari teks notifikasi e-Wallet (Tasker / MacroDroid)
 * Contoh: "DANA: Transfer Rp 50.012 dari..." -> 50012
 */
function extractNominalFromText(text) {
  if (!text || typeof text !== 'string') return null;
  // Cari pola "Rp 50.012" atau "Rp50012" atau "sebesar 50.012"
  const match = text.match(/(?:rp|sebesar|idr)\s*([\d\.,]+)/i) || text.match(/([\d\.,]{4,})/);
  if (!match) return null;
  // Bersihkan titik ribuan
  const cleaned = match[1].replace(/\./g, '').replace(/,/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      orderId,
      amount,
      nominal,
      rawText,
      message,
      text,
      sender = 'DANA / E-Wallet',
      payerName,
    } = body;

    // Tentukan nominal dari parameter langsung atau dari parsing notifikasi
    let targetAmount = Number(amount || nominal);
    if (!targetAmount || !Number.isFinite(targetAmount)) {
      const extracted = extractNominalFromText(rawText || message || text);
      if (extracted) targetAmount = extracted;
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database tidak terhubung.' }, { status: 500 });
    }

    // Cari transaksi pending di tabel payments
    let query = supabase.from('payments').select('*');
    if (orderId) {
      query = query.eq('order_id', orderId);
    } else if (targetAmount && targetAmount > 0) {
      query = query.eq('amount', targetAmount).eq('status', 'pending').order('created_at', { ascending: false }).limit(1);
    } else {
      return NextResponse.json(
        { error: 'orderId atau nominal pembayaran (amount) wajib diberikan.' },
        { status: 400 }
      );
    }

    const { data: payments, error: pError } = await query;
    const payment = Array.isArray(payments) ? payments[0] : payments;

    if (pError || !payment) {
      return NextResponse.json(
        {
          error: 'Pembayaran pending tidak ditemukan dengan nominal/orderId tersebut.',
          receivedAmount: targetAmount,
        },
        { status: 404 }
      );
    }

    const matchedOrderId = payment.order_id;

    // Jika sudah lunas sebelumnya
    if (payment.status === 'paid' || payment.status === 'settlement') {
      return NextResponse.json({
        success: true,
        message: 'Pembayaran ini sudah berstatus lunas sebelumnya.',
        orderId: matchedOrderId,
        status: 'paid',
      });
    }

    const paidAt = new Date().toISOString();
    const resolvedMethod = `QRIS (${sender})`;

    // 1. Update tabel payments
    await supabase
      .from('payments')
      .update({
        status: 'paid',
        transaction_status: 'settlement',
        method: resolvedMethod,
        customer_name: payerName || payment.customer_name || 'Pelanggan QRIS',
        paid_at: paidAt,
      })
      .eq('order_id', matchedOrderId);

    // 2. Insert ke tabel transactions jika belum ada
    const { data: existingTrx } = await supabase
      .from('transactions')
      .select('id')
      .eq('transaction_code', matchedOrderId)
      .maybeSingle();

    if (!existingTrx) {
      const items = payment.payload?.items || [];
      const totalAmount = Number(payment.amount);

      await supabase.from('transactions').insert({
        transaction_code: matchedOrderId,
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

      // 3. Potong stok produk di tabel products dan catat di stock_movements
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

            await supabase.from('stock_movements').insert({
              product_id: pId,
              type: 'OUT',
              quantity: qty,
              reference: matchedOrderId,
              notes: `Penjualan kasir via ${resolvedMethod} (Webhook)`,
              created_at: paidAt,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notifikasi pembayaran berhasil dicocokkan! Kasir Auto Lunas.',
      orderId: matchedOrderId,
      amount: payment.amount,
      status: 'paid',
      paidAt,
      method: resolvedMethod,
    });
  } catch (err) {
    console.error('API Gateway Webhook Error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses webhook pembayaran.' },
      { status: 500 }
    );
  }
}
