import { PaymentsDashboard } from '@/components/payments-dashboard';
import { createClient } from '@/lib/supabase/server';
import { midtransEnvironment } from '@/lib/midtrans';
import { RoleGuard } from '@/components/role-guard';

export default async function PaymentsPage() {
    const environment = midtransEnvironment();
    const hasServerKey = Boolean(process.env.MIDTRANS_SERVER_KEY && !process.env.MIDTRANS_SERVER_KEY.startsWith('your-') && process.env.MIDTRANS_SERVER_KEY !== 'your-server-key');
    const hasClientKey = Boolean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY && !process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY.startsWith('your-') && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY !== 'your-client-key');
    let payments = [];
    let supabaseConnected = false;
    const supabase = await createClient();
    if (supabase) {
        supabaseConnected = true;
        const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(100);
        if (data)
            payments = data;
    }
    return (
        <RoleGuard allowRole="owner" fallbackTitle="Data Pembayaran & Gateway Khusus Owner">
            <PaymentsDashboard initialPayments={payments} environment={environment} configured={hasServerKey && hasClientKey} hasServerKey={hasServerKey} hasClientKey={hasClientKey} supabaseConnected={supabaseConnected}/>
        </RoleGuard>
    );
}
