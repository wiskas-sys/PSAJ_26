import { NextResponse } from 'next/server';
import { isPaidStatus, methodFromPaymentType, verifyNotificationSignature } from '@/lib/midtrans';
import { createClient } from '@/lib/supabase/server';

function mapStatus(transactionStatus) {
    if (isPaidStatus(transactionStatus))
        return 'paid';
    if (transactionStatus === 'expire')
        return 'expired';
    if (['cancel', 'deny', 'failure'].includes(transactionStatus))
        return 'failed';
    return 'pending';
}

export async function POST(request) {
    let payload;
    try {
        payload = await request.json();
    }
    catch {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    if (!verifyNotificationSignature(payload))
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    if (!payload.order_id)
        return NextResponse.json({ error: 'order_id missing' }, { status: 400 });
    const paid = isPaidStatus(payload.transaction_status);
    const supabase = await createClient();
    if (!supabase)
        return NextResponse.json({ status: 'ok' });
    const { error } = await supabase.from('payments').upsert({
        order_id: payload.order_id,
        amount: Number(payload.gross_amount ?? 0),
        payment_type: payload.payment_type ?? null,
        method: methodFromPaymentType(payload.payment_type),
        status: mapStatus(payload.transaction_status),
        transaction_status: payload.transaction_status ?? null,
        payload,
        paid_at: paid ? new Date().toISOString() : null,
    }, { onConflict: 'order_id' });
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: 'ok' });
}