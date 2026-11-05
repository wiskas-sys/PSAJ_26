import { NextResponse } from 'next/server';
import { generateQrisDataUrl, generateUniqueNominal } from '@/lib/qris';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, amount, customer, items } = body || {};

    const baseAmount = Number(amount);
    if (!orderId || !Number.isFinite(baseAmount) || baseAmount <= 0) {
      return NextResponse.json(
        { error: 'orderId dan amount harus diisi dengan valid.' },
        { status: 400 }
      );
    }

    // 1. Tambahkan kode unik nominal acak (misal Rp 50.000 -> Rp 50.012)
    const { uniqueCode, totalAmount } = generateUniqueNominal(baseAmount);

    // 2. Generate QRIS Dinamis standar EMVCo (PNG Base64)
    const { qrisString, dataUrl: qrisDataUrl } = await generateQrisDataUrl({
      amount: totalAmount,
      orderId,
    });

    // 3. Simpan pembayaran berstatus pending ke database Supabase
    const supabase = await createClient();
    if (supabase) {
      await supabase.from('payments').upsert(
        {
          order_id: orderId,
          amount: totalAmount,
          customer_name: customer?.name || customer?.first_name || 'Pelanggan Umum',
          payment_type: 'qris',
          method: 'QRIS Dinamis',
          status: 'pending',
          payload: {
            baseAmount,
            uniqueCode,
            totalAmount,
            items: items || [],
          },
        },
        { onConflict: 'order_id' }
      );
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const payUrl = `${protocol}://${host}/bayar/${orderId}`;

    return NextResponse.json({
      success: true,
      orderId,
      baseAmount,
      uniqueCode,
      totalAmount,
      qrisString,
      qrisDataUrl,
      payUrl,
    });
  } catch (err) {
    console.error('API Gateway Create Error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal membuat QRIS dinamis.' },
      { status: 500 }
    );
  }
}
