import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { rupiah } from '@/lib/demo-data';
import { CheckCircle2, Clock3, ReceiptText, Wallet, XCircle } from 'lucide-react';

export function PaymentGatewayCard({ environment, volume, totalCount, paidCount, pendingCount, failedCount }) {
    const unconfigured = environment === 'unconfigured';
    return <Card className="rounded-[17px]"><CardHeader>
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[#1d325e] font-mono text-[11px] font-extrabold text-white">MT</span>
                <div><CardTitle className="text-base">Payment Gateway</CardTitle><CardDescription>Midtrans Snap · Pembayaran digital</CardDescription></div>
            </div>
            <Badge variant={unconfigured ? 'secondary' : 'default'} className={unconfigured ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'}><span className={unconfigured ? 'size-1.5 rounded-full bg-amber-400' : 'size-1.5 rounded-full bg-emerald-400'} />{unconfigured ? 'Belum dikonfigurasi' : environment === 'production' ? 'Production' : 'Sandbox'}</Badge>
        </div>
    </CardHeader><CardContent>
        <div className="mb-4 flex items-end justify-between gap-3 rounded-2xl border border-border bg-gradient-to-br from-primary/[0.07] to-transparent p-4"><div><p className="text-xs text-muted-foreground">Volume via gateway</p><strong className="mt-1 block text-[26px] leading-none font-bold tracking-[-.03em]">{rupiah(Number(volume) || 0)}</strong></div><Wallet className="size-8 text-primary/50"/></div>
        <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-sidebar p-3"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><ReceiptText className="size-4"/></span><strong className="mt-2 block text-lg leading-none">{totalCount}</strong><small className="text-[10px] text-muted-foreground">Total transaksi</small></div>
            <div className="rounded-xl border border-border bg-sidebar p-3"><span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="size-4"/></span><strong className="mt-2 block text-lg leading-none">{paidCount}</strong><small className="text-[10px] text-muted-foreground">Berhasil</small></div>
            <div className="rounded-xl border border-border bg-sidebar p-3"><span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-500"><Clock3 className="size-4"/></span><strong className="mt-2 block text-lg leading-none">{pendingCount}</strong><small className="text-[10px] text-muted-foreground">Menunggu</small></div>
        </div>
        {failedCount > 0 && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-red-400"><XCircle className="size-3.5"/>{failedCount} transaksi gagal/kadaluarsa</p>}
        {unconfigured && <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Isi <code className="rounded bg-muted px-1 font-mono">MIDTRANS_SERVER_KEY</code> &amp; <code className="rounded bg-muted px-1 font-mono">NEXT_PUBLIC_MIDTRANS_CLIENT_KEY</code> lalu buat tabel <code className="rounded bg-muted px-1 font-mono">payments</code> (lihat <code className="rounded bg-muted px-1 font-mono">supabase/schema.sql</code>) untuk mengaktifkan pembayaran asli.</p>}
    </CardContent></Card>;
}