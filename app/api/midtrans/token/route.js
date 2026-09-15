import { NextResponse } from 'next/server';
import { createSnapToken, isMidtransConfigured } from '@/lib/midtrans';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
    if (!isMidtransConfigured())
        return NextResponse.json({ error: 'Midtrans belum dikonfigurasi.' }, { status: 503 });
    let body;
    try {
        body = await request.json();
    }
    catch {
        return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 });
    }
    const { orderId, grossAmount, customer, items } = body || {};
    const amount = Number(grossAmount);
    if (!orderId || !Number.isFinite(amount) || amount <= 0)
        return NextResponse.json({ error: 'orderId dan grossAmount wajib diisi.' }, { status: 400 });
    try {
        const snap = await createSnapToken({ orderId, grossAmount: Math.round(amount), customer, items });
        const supabase = await createClient();
        if (supabase) {
            await supabase.from('payments').upsert({
                order_id: orderId,
                amount: Math.round(amount),
                customer_name: customer?.name ?? customer?.first_name ?? null,
                status: 'pending',
            }, { onConflict: 'order_id' }).select().single();
        }
        return NextResponse.json({ token: snap.token, orderId, redirectUrl: snap.redirectUrl });
    }
    catch (err) {
        return NextResponse.json({ error: err.message || 'Gagal membuat token pembayaran.' }, { status: 502 });
    }
}