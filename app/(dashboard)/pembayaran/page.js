import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { PaymentGatewayCard } from '@/components/payment-gateway-card';
import { PaymentBreakdown } from '@/components/payment-breakdown';
import { createClient } from '@/lib/supabase/server';
import { midtransEnvironment } from '@/lib/midtrans';
import { rupiah } from '@/lib/demo-data';

const METHOD_SERIES = [
    { label: 'QRIS', color: '#dc2626' }, { label: 'Virtual Account', color: '#f59e0b' }, { label: 'E-Wallet', color: '#10b981' }, { label: 'Kartu Kredit', color: '#3b82f6' }, { label: 'Retail Outlet', color: '#a855f7' },
];
const SAMPLE_SERIES = [{ label: 'QRIS', color: '#dc2626', count: 42 }, { label: 'Virtual Account', color: '#f59e0b', count: 27 }, { label: 'E-Wallet', color: '#10b981', count: 18 }, { label: 'Kartu Kredit', color: '#3b82f6', count: 8 }, { label: 'Retail Outlet', color: '#a855f7', count: 5 }];

const STATUS_META = {
    paid: ['Berhasil', 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'],
    pending: ['Menunggu', 'border-amber-500/25 bg-amber-500/10 text-amber-500'],
    expired: ['Kadaluarsa', 'border-zinc-500/25 bg-zinc-500/10 text-zinc-400'],
    failed: ['Gagal', 'border-red-500/25 bg-red-500/10 text-red-400'],
};

function StatusBadge({ status }) {
    const [label, cls] = STATUS_META[status] || ['Pending', 'border-zinc-500/25 bg-zinc-500/10 text-zinc-400'];
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${cls}`}>{label}</span>;
}

export default async function PaymentsPage() {
    const environment = midtransEnvironment();
    let payments = [];
    let supabaseConnected = false;
    const supabase = await createClient();
    if (supabase) {
        supabaseConnected = true;
        const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50);
        if (data)
            payments = data;
    }
    const paidP = payments.filter(p => p.status === 'paid');
    const volume = paidP.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const paidCount = paidP.length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const failedCount = payments.filter(p => p.status === 'failed' || p.status === 'expired').length;
    const countByMethod = {};
    paidP.forEach(p => { const m = p.method || 'Lainnya'; countByMethod[m] = (countByMethod[m] || 0) + 1; });
    const series = payments.length ? [...METHOD_SERIES.map(s => ({ ...s, count: countByMethod[s.label] || 0 })).filter(s => s.count > 0), ...Object.entries(countByMethod).filter(([m]) => !METHOD_SERIES.some(s => s.label === m)).map(([m, c]) => ({ label: m, color: '#71717a', count: c }))] : SAMPLE_SERIES;
    return <div className="flex flex-col gap-5"><PageHeader eyebrow="PAYMENT GATEWAY" title="Pembayaran" description="Kelola transaksi pembayaran digital melalui Midtrans Snap."> <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3.5 py-2 text-[11px] font-bold text-emerald-500"><span className="size-1.5 rounded-full bg-emerald-400"/>{environment === 'production' ? 'PRODUCTION ONLINE' : environment === 'sandbox' ? 'SANDBOX CONNECTED' : 'NOT CONFIGURED'}</button></PageHeader>
    <section className="grid gap-4 xl:grid-cols-2"><PaymentGatewayCard environment={environment} volume={supabaseConnected ? volume : null} totalCount={payments.length} paidCount={paidCount} pendingCount={pendingCount} failedCount={failedCount} /><PaymentBreakdown series={series} sample={!supabaseConnected || payments.length === 0} /></section>
    <Card className="rounded-[17px]"><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Riwayat Pembayaran</CardTitle><CardDescription>Transaksi terbaru dari Midtrans Snap</CardDescription></div></CardHeader><CardContent>{payments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground"><th className="px-3 py-2.5">ID Transaksi</th><th className="px-3 py-2.5">Tanggal</th><th className="px-3 py-2.5">Pelanggan</th><th className="px-3 py-2.5">Metode</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-right">Jumlah</th></tr></thead><tbody>{payments.map(p => <tr key={p.id} className="border-b border-border last:border-0"><td className="px-3 py-3 font-mono text-xs">{p.order_id}</td><td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{new Date(p.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td className="px-3 py-3">{p.customer_name || 'Pelanggan Umum'}</td><td className="px-3 py-3">{p.method || '—'}</td><td className="px-3 py-3"><StatusBadge status={p.status}/></td><td className="px-3 py-3 text-right font-semibold">{rupiah(Number(p.amount) || 0)}</td></tr>)}</tbody></table></div> : <div className="grid place-items-center gap-1 rounded-2xl border border-dashed border-border py-14 text-center"><p className="text-sm font-semibold">Belum ada pembayaran</p><p className="text-xs text-muted-foreground">Transaksi yang dibuat lewat kasir (QRIS/Transfer) akan muncul di sini.</p></div>}</CardContent></Card>
  </div>;
}