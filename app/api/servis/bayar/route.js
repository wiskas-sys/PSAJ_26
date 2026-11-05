import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

const KASIR_USER_ID = '33333333-3333-3333-3333-333333333333';

export async function POST(request) {
  try {
    const body = await request.json();
    const { serviceId, customer, plate, brand, job, totalBill, method = 'Tunai', paidAmount, changeAmount } = body || {};

    const amount = Number(totalBill);
    if (!serviceId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Data pembayaran servis tidak valid.' }, { status: 400 });
    }

    const code = `SRV-TRX-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const supabase = getAdminClient();

    if (supabase) {
      // 1. Simpan ke tabel transactions
      await supabase.from('transactions').insert({
        transaction_code: code,
        idempotency_key: crypto.randomUUID(),
        subtotal: amount,
        total: amount,
        discount: 0,
        payment_method: method,
        payment_amount: Number(paidAmount || amount),
        change_amount: Number(changeAmount || 0),
        status: 'completed',
        created_by: KASIR_USER_ID,
        created_at: new Date().toISOString(),
      });

      // 2. Simpan juga ke tabel payments (agar muncul di Pembayaran & Gateway)
      await supabase.from('payments').upsert({
        order_id: code,
        amount: amount,
        customer_name: customer ? `${customer} (${plate || 'Motor'})` : 'Pelanggan Servis',
        method: method,
        payment_type: method === 'QRIS' ? 'qris' : (method === 'Tunai' ? 'cash' : 'bank_transfer'),
        status: 'paid',
        transaction_status: 'settlement',
        paid_at: new Date().toISOString(),
        payload: {
          serviceId,
          customer,
          plate,
          brand,
          job,
          totalBill: amount,
          paidAmount: Number(paidAmount || amount),
          changeAmount: Number(changeAmount || 0),
        },
      }, { onConflict: 'order_id' });
    }

    return NextResponse.json({
      success: true,
      transactionCode: code,
      serviceId,
      amount,
      method,
      paidAmount: Number(paidAmount || amount),
      changeAmount: Number(changeAmount || 0),
    });
  } catch (err) {
    console.error('Error bayar servis:', err);
    return NextResponse.json({ error: err.message || 'Gagal memproses pembayaran servis.' }, { status: 500 });
  }
}

