'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, Boxes, FileSpreadsheet, History, Search, TriangleAlert } from 'lucide-react';
import { StockMovementBulkDialog } from '@/components/stock-movement-bulk-dialog';
import { dateLabel, kindLabel, rupiah, stockStatus, todayISO } from '@/lib/demo-data';
import { getMovements, getProducts, subscribeStock } from '@/lib/stock-store';
import { PageHeader } from '@/components/page-header';
import { StockBadge } from '@/components/stock-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const rank = { 'Stok Habis': 0, 'Stok Menipis': 1, 'Stok Aman': 2 };

export function StockFlowOverview({ type }) {
    const incoming = type === 'IN';
    const router = useRouter();
    const [catalog, setCatalog] = useState(() => getProducts());
    const [logs, setLogs] = useState(() => getMovements());
    const [query, setQuery] = useState('');
    const [bulkOpen, setBulkOpen] = useState(false);
    useEffect(() => subscribeStock(() => { setCatalog(getProducts()); setLogs(getMovements()); }), []);
    const flow = useMemo(() => logs.filter(m => m.type === type), [logs, type]);
    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return flow.filter(m => !q || `${m.productName} ${m.productCode} ${m.code} ${m.reference} ${m.party}`.toLowerCase().includes(q));
    }, [flow, query]);
    const today = todayISO();
    const todayFlow = flow.filter(m => m.date === today);
    const todayQty = todayFlow.reduce((sum, m) => sum + m.quantity, 0);
    const low = catalog.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Menipis');
    const out = catalog.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Habis');
    const sorted = [...catalog].sort((a, b) => rank[stockStatus(a.stock, a.minimumStock)] - rank[stockStatus(b.stock, b.minimumStock)] || a.stock - b.stock);
    const value = catalog.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
    const Icon = incoming ? ArrowDownToLine : ArrowUpFromLine;
    const accent = incoming ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500';
    const amount = incoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500';
    return <div className="flex flex-col gap-5">
        <PageHeader
            title={`Barang ${incoming ? 'Masuk' : 'Keluar'}`}
            description={incoming
                ? 'Monitoring penambahan stok barang secara real-time dari riwayat restock dan penerimaan.'
                : 'Monitoring riwayat mutasi barang keluar otomatis dari transaksi kasir dan servis bengkel.'
            }
        >
            <Button variant="outline" onClick={() => router.push('/stok')}>
                <Boxes data-icon="inline-start"/>Buka Cek Stok
            </Button>
        </PageHeader>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[[`${incoming ? 'Masuk' : 'Keluar'} Hari Ini`, `${todayQty}`, incoming ? 'unit diterima' : 'unit terjual & terpakai'], [`Mutasi ${incoming ? 'Masuk' : 'Keluar'}`, String(flow.length), 'pencatatan otomatis'], ['Stok Menipis', String(low.length), 'perlu restock'], ['Stok Habis', String(out.length), 'perlu pembelian']].map(([label, value, note], i) => <div key={label} className={`metric-card ${i === 2 ? 'warning' : ''}`}><p className="text-sm text-muted-foreground">{label}</p><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}
        </section>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <Card className="rounded-[17px]">
                <CardHeader className="border-b border-border">
                    <CardTitle className="flex items-center gap-2"><History className="size-4"/>Mutasi Terbaru</CardTitle>
                    <CardDescription>{incoming ? 'Log mutasi penambahan stok dari restock bengkel.' : 'Log mutasi pengurangan stok otomatis dari aktivitas transaksi kasir dan servis motor.'}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-b border-border p-3.5"><div className="input-with-icon"><Search className="size-4"/><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari barang, nomor mutasi, atau referensi..." className="h-10"/></div></div>
                    <div className="divide-y divide-border">
                        {shown.map(m => <div key={m.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                            <span className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${accent}`}><Icon className="size-4"/></span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold">{m.productName}</p>
                                <p className="font-mono text-[10px] text-muted-foreground">{m.code} · {dateLabel(m.date)} · {m.reference || '—'}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="stock-chip">{kindLabel(m.kind)}</span>
                                <span className={`text-[13px] font-bold ${amount}`}>{incoming ? '+' : '-'}{m.quantity} <small className="font-normal text-muted-foreground">{m.unit}</small></span>
                            </div>
                            <div className="w-full text-right text-[11px] text-muted-foreground sm:w-auto sm:min-w-[120px]"><span className="text-muted-foreground">{m.before}</span><span className="mx-1">→</span><strong className="text-foreground">{m.after}</strong> <span className="ml-1">{m.party || ''}</span></div>
                        </div>)}
                        {!shown.length && <p className="px-4 py-16 text-center text-sm text-muted-foreground">{flow.length ? 'Tidak ada mutasi yang cocok dengan pencarian.' : `Belum ada barang ${incoming ? 'masuk' : 'keluar'} yang tercatat.`}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[17px]">
                <CardHeader className="border-b border-border">
                    <CardTitle className="flex items-center gap-2"><Boxes className="size-4"/>Informasi Stok</CardTitle>
                    <CardDescription>Kondisi persediaan saat ini.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="rounded-2xl bg-muted p-5"><p className="text-xs text-muted-foreground">Nilai persediaan</p><p className="mt-1 text-2xl font-bold tracking-[-.03em]">{rupiah(value)}</p><p className="mt-1 text-xs text-muted-foreground">{catalog.length} SKU terdaftar</p></div>
                    {(low.length > 0 || out.length > 0) && <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400"><TriangleAlert className="mt-0.5 size-4 shrink-0"/>{out.length} barang habis dan {low.length} barang menipis. Segera lakukan restock.</p>}
                    <div className="mt-4 grid gap-2">
                        {sorted.map(p => <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                            <div className="min-w-0"><p className="truncate text-[13px] font-semibold">{p.name}</p><p className="font-mono text-[10px] text-muted-foreground">{p.code} · min {p.minimumStock} {p.unit}</p></div>
                            <div className="flex shrink-0 items-center gap-2"><strong className="text-[13px]">{p.stock} <small className="font-normal text-muted-foreground">{p.unit}</small></strong><StockBadge stock={p.stock} minimum={p.minimumStock}/></div>
                        </div>)}
                    </div>
                </CardContent>
            </Card>
        </div>
        
    </div>;
}
