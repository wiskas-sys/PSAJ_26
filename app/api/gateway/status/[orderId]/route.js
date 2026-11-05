import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request, context) {
  try {
    const { orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database tidak terhubung.' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('payments')
      .select('id, order_id, amount, customer_name, payment_type, method, status, paid_at, payload')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ status: 'not_found', orderId });
    }

    return NextResponse.json({
      status: data.status,
      isPaid: data.status === 'paid' || data.status === 'settlement' || data.status === 'sukses',
      orderId: data.order_id,
      amount: data.amount,
      paidAt: data.paid_at,
      method: data.method,
      customerName: data.customer_name,
      payload: data.payload,
    });
  } catch (err) {
    console.error('API Gateway Status Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
