import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { rupiah } from '@/lib/demo-data';
import { ArrowUpRight, CheckCircle2, Clock3, ReceiptText, Wallet, XCircle } from 'lucide-react';

export function PaymentGatewayCard({ environment, volume, totalCount, paidCount, pendingCount, failedCount, pendingAmount, successRate }) {
    const unconfigured = environment === 'unconfigured';
    const rate = Math.max(0, Math.min(100, Math.round(Number(successRate) || 0)));
    return <Card className="rounded-[17px]"><CardHeader>
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[#1d325e] font-mono text-[11px] font-extrabold text-white">MT</span>
                <div><CardTitle className="text-base">Payment Gateway</CardTitle><CardDescription>Midtrans Snap · Pembayaran digital</CardDescription></div>
            </div>
            <Badge variant={unconfigured ? 'secondary' : 'default'} className={unconfigured ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'}><span className={unconfigured ? 'size-1.5 rounded-full bg-amber-400' : 'size-1.5 rounded-full bg-emerald-400'} />{unconfigured ? 'Belum dikonfigurasi' : environment === 'production' ? 'Production' : 'Sandbox'}</Badge>
        </div>
    </CardHeader><CardContent>
        <div className="mb-4 flex items-end justify-between gap-3 rounded-2xl border border-border bg-gradient-to-br from-primary/[0.07] to-transparent p-4">
            <div className="min-w-0"><p className="text-xs text-muted-foreground">Volume berhasil via gateway</p><strong className="mt-1 block truncate text-[26px] leading-none font-bold tracking-[-.03em]">{rupiah(Number(volume) || 0)}</strong><p className="mt-1 text-[11px] text-muted-foreground">{paidCount} dari {totalCount} transaksi lunas</p></div>
            <Wallet className="size-8 shrink-0 text-primary/50"/>
        </div>
        <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="text-muted-foreground">Tingkat keberhasilan</span><strong>{rate}%</strong></div>
            <div className="progress-track"><span style={{ width: `${rate}%`, background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : 'var(--primary)' }}/></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-sidebar p-3"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><ReceiptText className="size-4"/></span><strong className="mt-2 block text-lg leading-none">{totalCount}</strong><small className="text-[10px] text-muted-foreground">Total transaksi</small></div>
            <div className="rounded-xl border border-border bg-sidebar p-3"><span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="size-4"/></span><strong className="mt-2 block text-lg leading-none">{paidCount}</strong><small className="text-[10px] text-muted-foreground">Berhasil</small></div>
            <div className="rounded-xl border border-border bg-sidebar p-3"><span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-500"><Clock3 className="size-4"/></span><strong className="mt-2 block text-lg leading-none">{pendingCount}</strong><small className="text-[10px] text-muted-foreground">Menunggu</small></div>
        </div>
        {(failedCount > 0 || pendingAmount > 0) && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-border pt-3 text-[11px]">
            {pendingAmount > 0 ? <span className="flex items-center gap-1.5 text-amber-500"><Clock3 className="size-3.5"/>{rupiah(Number(pendingAmount) || 0)} menunggu pembayaran</span> : <span/>}
            {failedCount > 0 && <span className="flex items-center gap-1.5 text-red-400"><XCircle className="size-3.5"/>{failedCount} gagal/kadaluarsa</span>}
        </div>}
        <a href={environment === 'production' ? 'https://dashboard.midtrans.com' : 'https://dashboard.sandbox.midtrans.com'} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline">Buka dashboard Midtrans<ArrowUpRight className="size-3.5"/></a>
    </CardContent></Card>;
}
