import { NextResponse } from 'next/server';
import { generateQrisDataUrl, generateUniqueNominal } from '@/lib/qris';
import { createCoreQris, isMidtransConfigured } from '@/lib/midtrans';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, amount, customer, items, storeQris: requestedStoreQris } = body || {};

    const baseAmount = Number(amount);
    if (!orderId || !Number.isFinite(baseAmount) || baseAmount <= 0) {
      return NextResponse.json(
        { error: 'orderId dan amount harus diisi dengan valid.' },
        { status: 400 }
      );
    }

    // 1. Tambahkan kode unik nominal acak (misal Rp 50.000 -> Rp 50.012)
    const { uniqueCode, totalAmount } = generateUniqueNominal(baseAmount);

    let qrisString = '';
    let qrisDataUrl = '';
    let isMidtrans = false;
    let isOfficialQris = false;

    // 2. Jika Midtrans dikonfigurasi, coba buat QRIS Core API langsung
    if (isMidtransConfigured()) {
      try {
        const midtransRes = await createCoreQris({
          orderId,
          grossAmount: totalAmount,
          customer,
        });
        if (midtransRes?.qrString || midtransRes?.qrCodeUrl) {
          isMidtrans = true;
          qrisString = midtransRes.qrString || '';
          if (midtransRes.qrString) {
            const gen = await generateQrisDataUrl({
              amount: totalAmount,
              orderId,
              staticQris: midtransRes.qrString,
            });
            qrisDataUrl = gen.dataUrl;
          } else if (midtransRes.qrCodeUrl) {
            qrisDataUrl = midtransRes.qrCodeUrl;
          }
        }
      } catch (mtErr) {
        console.warn('Midtrans core QRIS charge failed, fallback to store QRIS:', mtErr?.message);
      }
    }

    // 3. Jika belum ada dari Midtrans, cek string QRIS resmi toko Dian Motor
    const activeStoreQris =
      requestedStoreQris ||
      process.env.STORE_QRIS_STRING ||
      process.env.NEXT_PUBLIC_STORE_QRIS_STRING ||
      null;

    if (!qrisDataUrl) {
      if (activeStoreQris) {
        isOfficialQris = true;
      }
      const gen = await generateQrisDataUrl({
        amount: totalAmount,
        orderId,
        staticQris: activeStoreQris,
      });
      qrisString = gen.qrisString;
      qrisDataUrl = gen.dataUrl;
    }

    // 4. Simpan pembayaran berstatus pending ke database Supabase
    const supabase = getAdminClient();
    if (supabase) {
      const { error: upsertErr } = await supabase.from('payments').upsert(
        {
          order_id: orderId,
          amount: totalAmount,
          customer_name: customer?.name || customer?.first_name || 'Pelanggan Umum',
          payment_type: 'qris',
          method: isMidtrans ? 'Midtrans QRIS' : isOfficialQris ? 'QRIS Toko Dian Motor' : 'QRIS Dinamis',
          status: 'pending',
          payload: {
            baseAmount,
            uniqueCode,
            totalAmount,
            items: items || [],
            isMidtrans,
            isOfficialQris,
          },
        },
        { onConflict: 'order_id' }
      );
      if (upsertErr) {
        console.error('Error upserting pending payment:', upsertErr);
      }
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
      isMidtrans,
      isOfficialQris,
      bankAccount: '1590676221',
      bankHolder: 'Diyan Purwanti',
    });
  } catch (err) {
    console.error('API Gateway Create Error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal membuat QRIS dinamis.' },
      { status: 500 }
    );
  }
}
