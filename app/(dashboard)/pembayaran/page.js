import { PaymentsDashboard } from '@/components/payments-dashboard';
import { createClient } from '@/lib/supabase/server';
import { midtransEnvironment } from '@/lib/midtrans';

export default async function PaymentsPage() {
    const environment = midtransEnvironment();
    const hasServerKey = Boolean(process.env.MIDTRANS_SERVER_KEY);
    const hasClientKey = Boolean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
    let payments = [];
    let supabaseConnected = false;
    const supabase = await createClient();
    if (supabase) {
        supabaseConnected = true;
        const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(100);
        if (data)
            payments = data;
    }
    return <PaymentsDashboard initialPayments={payments} environment={environment} configured={hasServerKey && hasClientKey} hasServerKey={hasServerKey} hasClientKey={hasClientKey} supabaseConnected={supabaseConnected}/>;
}
