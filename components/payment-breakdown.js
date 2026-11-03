import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { rupiah } from '@/lib/demo-data';

export function PaymentBreakdown({ series, sample }) {
    const total = series.reduce((sum, s) => sum + (Number(s.count) || 0), 0);
    const totalAmount = series.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const filled = series.every(s => (Number(s.count) || 0) > 0);
    const conic = filled && total > 0
        ? (() => {
            let acc = 0;
            const stops = series.map(s => {
                const start = (acc / total) * 360;
                acc += Number(s.count);
                const end = (acc / total) * 360;
                return `${s.color} ${start}deg ${end}deg`;
            });
            return `conic-gradient(${stops.join(', ')})`;
        })()
        : total > 0
            ? (() => {
                let acc = 0;
                const stops = series.filter(s => Number(s.count) > 0).map(s => {
                    const start = (acc / total) * 360;
                    acc += Number(s.count);
                    const end = (acc / total) * 360;
                    return `${s.color} ${start}deg ${end}deg`;
                });
                return `conic-gradient(${stops.join(', ')})`;
            })()
            : 'conic-gradient(var(--muted) 0deg 360deg)';
    return <Card className="rounded-[17px]"><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Distribusi Metode Pembayaran</CardTitle><CardDescription>Transaksi gateway berhasil berdasarkan metode</CardDescription></div>{sample && <Badge variant="outline" className="text-muted-foreground">contoh</Badge>}</CardHeader><CardContent className="flex flex-col gap-4">
        {total === 0 ? <div className="grid h-[210px] place-items-center rounded-2xl border border-dashed border-border text-center"><div><p className="text-sm font-semibold">Belum ada pembayaran berhasil</p><p className="mt-1 text-xs text-muted-foreground">Distribusi metode muncul setelah ada transaksi lunas.</p></div></div> : <>
            <div className="flex items-center gap-5">
                <div className="relative size-[150px] shrink-0 rounded-full" style={{ background: conic }}>
                    <div className="absolute inset-[24px] grid place-items-center rounded-full bg-background text-center"><strong className="block text-xl leading-none">{total}</strong><small className="mt-1 text-[10px] text-muted-foreground">transaksi</small></div>
                </div>
                <div className="grid flex-1 gap-2.5">{series.map(s => {
                        const percent = total ? Math.round((Number(s.count) / total) * 100) : 0;
                        return <div key={s.label} className="min-w-0">
                            <div className="flex items-center justify-between gap-3 text-[13px]"><span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }}/><span className="truncate">{s.label}</span></span><span className="flex shrink-0 items-baseline gap-2"><strong>{s.count}</strong><small className="font-mono text-[10px] text-muted-foreground">{percent}%</small></span></div>
                            <div className="mt-1 flex items-center gap-2"><div className="progress-track h-1.5 flex-1"><span style={{ width: `${percent}%`, background: s.color }}/></div><small className="w-[92px] shrink-0 text-right font-mono text-[10px] text-muted-foreground">{rupiah(Number(s.amount) || 0)}</small></div>
                        </div>;
                    })}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted px-3.5 py-2.5 text-[11px]"><span className="text-muted-foreground">Total nilai berhasil</span><strong>{rupiah(totalAmount)}</strong></div>
        </>}
    </CardContent></Card>;
}
