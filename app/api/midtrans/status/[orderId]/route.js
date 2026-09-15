import { NextResponse } from 'next/server';
import { getTransactionStatus, isPaidStatus, methodFromPaymentType } from '@/lib/midtrans';
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

export async function GET(_request, context) {
    const { orderId } = await context.params;
    if (!orderId)
        return NextResponse.json({ error: 'orderId wajib.' }, { status: 400 });
    try {
        const data = await getTransactionStatus(orderId);
        const paid = isPaidStatus(data.transaction_status);
        const supabase = await createClient();
        if (supabase) {
            await supabase.from('payments').upsert({
                order_id: orderId,
                amount: Number(data.gross_amount ?? 0),
                payment_type: data.payment_type ?? null,
                method: methodFromPaymentType(data.payment_type),
                status: mapStatus(data.transaction_status),
                transaction_status: data.transaction_status ?? null,
                payload: data,
                paid_at: paid ? new Date().toISOString() : null,
            }, { onConflict: 'order_id' });
        }
        return NextResponse.json({
            orderId,
            status: mapStatus(data.transaction_status),
            transactionStatus: data.transaction_status ?? null,
            paymentType: data.payment_type ?? null,
            method: methodFromPaymentType(data.payment_type),
        });
    }
    catch (err) {
        return NextResponse.json({ error: err.message || 'Gagal mengambil status.' }, { status: 502 });
    }
}