import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PaymentBreakdown({ series, sample }) {
    const max = Math.max(...series.map(s => s.value), 1);
    return <Card className="rounded-[17px]"><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Distribusi Metode Pembayaran</CardTitle><CardDescription>Transaksi gateway berhasil berdasarkan metode</CardDescription></div>{sample && <Badge variant="outline" className="text-muted-foreground">contoh</Badge>}</CardHeader><CardContent className="flex flex-col gap-3">{series.map(s => <div key={s.label}><div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }}/>{s.label}</span><span className="font-semibold">{s.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(s.value / max) * 100}%`, backgroundColor: s.color }}/></div></div>)}</CardContent></Card>;
}