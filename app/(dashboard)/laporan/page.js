'use client';
import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { SalesChart } from '@/components/sales-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StockBadge } from '@/components/stock-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { dateLabel, kindLabel, rupiah, todayISO } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/client';
import { listStockMovements, listStockProducts } from '@/lib/supabase/stock-products';

function downloadSales(sales) {
    const esc = (v) => `"${`${v}`.replace(/"/g, '""')}"`;
    const csv = ['Hari;Total Penjualan (IDR)', ...sales.map(s => `${esc(s.day)};${s.total}`)].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laporan-penjualan.csv';
    a.click();
    URL.revokeObjectURL(url);
}

const serviceOrders = [];
const lightTable = 'w-full text-sm';
const thCls = 'border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground';
const tdCls = 'border-b border-border px-3.5 py-3 last:border-0';

const IN_KINDS = ['PEMASOKAN', 'STOKAWAL', 'KOREKSI', 'OPNAME'];
const OUT_KINDS = ['PEMAKAIAN', 'KOREKSI', 'OPNAME'];

function MovementTable({ rows, kind }) {
    const [filter, setFilter] = useState('ALL');
    const available = kind === 'IN' ? IN_KINDS : OUT_KINDS;
    const shown = filter === 'ALL' ? rows : rows.filter(r => r[3] === filter);
    const totalQty = shown.reduce((s, r) => s + Math.abs(Number(r[2].split(' ')[0]) || 0), 0);
    return <Card className="rounded-[17px]">
        <CardHeader className="border-b border-border">
            <CardTitle>{kind === 'IN' ? 'Realisasi Barang Masuk' : 'Realisasi Barang Keluar'}</CardTitle>
            <CardDescription>{filter === 'ALL' ? (kind === 'IN' ? 'Semua pencatatan stok bertambah, termasuk penerimaan supplier dan stok awal.' : 'Semua pengeluaran stok, termasuk penjualan, servis, dan penyesuaian.') : `Disaring ke jenis ${kindLabel(filter)}.`}</CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 border-b border-border p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
                {[['ALL', 'Semua'], ...available.map(k => [k, kindLabel(k)])].map(([v, l]) => {
                    const n = v === 'ALL' ? rows.length : rows.filter(r => r[3] === v).length;
                    return <button key={v} type="button" onClick={() => setFilter(v)} className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${filter === v ? 'bg-primary text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{l}<span className="rounded-full bg-black/10 px-1.5 font-mono text-[10px] dark:bg-white/10">{n}</span></button>;
                })}
            </div>
            <p className="text-xs text-muted-foreground">{shown.length} baris · <strong className="text-foreground">{totalQty}</strong> unit</p>
        </div>
        <CardContent className="overflow-x-auto p-0"><table className={lightTable}><thead><tr>{[['No. Pergerakan', 'text-left'], ['Barang', 'text-left'], ['Jumlah', 'text-left'], ['Jenis', 'text-left'], [kind === 'IN' ? 'Supplier' : 'Jenis Penggunaan', 'text-left'], ['Referensi', 'text-left'], ['Tanggal', 'text-left']].map(([h, a]) => <th key={h} className={`${thCls} ${a}`}>{h}</th>)}</tr></thead><tbody>{shown.map(r => <tr key={r[0]} className="transition-colors hover:bg-muted/50">{r.map((c, j) => <td key={j} className={`${tdCls} ${j === 0 ? 'font-mono text-xs' : j === 1 ? 'font-semibold' : j === 3 ? '' : 'text-muted-foreground'}`}>{j === 3 ? <span className="stock-chip">{kindLabel(c)}</span> : c}</td>)}</tr>)}</tbody></table>{!shown.length && <p className="py-14 text-center text-muted-foreground">Belum ada pencatatan {filter === 'ALL' ? `barang ${kind === 'IN' ? 'masuk' : 'keluar'}` : `jenis ${kindLabel(filter)}`}.</p>}</CardContent>
    </Card>;
}

export default function Page() {
    const [logs, setLogs] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [sales, setSales] = useState([]);
    useEffect(() => {
        let live = true;
        const supabase = createClient();
        const refresh = async () => {
            try {
                const month = `${todayISO().slice(0, 7)}-01`;
                const [movements, products, transactions] = await Promise.all([
                    listStockMovements(), listStockProducts(),
                    supabase.from('transactions').select('transaction_code,total,created_at').gte('created_at', month).order('created_at', { ascending: true }),
                ]);
                if (!live) return;
                setLogs(movements); setCatalog(products); setSales(transactions.data || []);
            } catch (error) { toast.error(error.message || 'Gagal memuat laporan dari Supabase.'); }
        };
        refresh();
        const channel = supabase.channel('reports-live').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, refresh).subscribe();
        return () => { live = false; supabase.removeChannel(channel); };
    }, []);
    const totalSales = sales.reduce((sum, row) => sum + Number(row.total || 0), 0);
    const chartSales = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(); day.setDate(day.getDate() - 6 + i);
        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        return { day: day.toLocaleDateString('id-ID', { weekday: 'short' }), total: sales.filter(row => row.created_at?.slice(0, 10) === key).reduce((sum, row) => sum + Number(row.total || 0), 0) };
    });
    const toRow = (m) => [m.code, m.productName, `${m.quantity} ${m.unit}`, m.kind, m.party || '—', m.reference || '—', dateLabel(m.date)];
    const movementsIn = useMemo(() => logs.filter(m => m.type === 'IN').map(toRow), [logs]);
    const movementsOut = useMemo(() => logs.filter(m => m.type === 'OUT').map(toRow), [logs]);
    return <div className="flex flex-col gap-5"><PageHeader title="Laporan" description="Analisis operasional dan kinerja DIAN MOTOR."> <Button onClick={() => downloadSales(chartSales)}><Download data-icon="inline-start"/>Unduh Laporan</Button></PageHeader>
    <Tabs defaultValue="sales" className="gap-4"><TabsList variant="line" className="h-auto w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-card p-1 shadow-sm ring-1 ring-foreground/10"><TabsTrigger value="sales" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Penjualan</TabsTrigger><TabsTrigger value="in" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Barang Masuk</TabsTrigger><TabsTrigger value="out" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Barang Keluar</TabsTrigger><TabsTrigger value="stock" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Stok</TabsTrigger><TabsTrigger value="service" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Servis</TabsTrigger></TabsList>
      <TabsContent value="sales" className="mt-4 flex flex-col gap-4"><section className="grid gap-3 sm:grid-cols-3">{[['Total Penjualan Bulan Ini', rupiah(totalSales), 'data transaksi Supabase'], ['Jumlah Transaksi', String(sales.length), 'bulan ini'], ['Rata-rata Transaksi', rupiah(sales.length ? totalSales / sales.length : 0), 'bulan ini']].map(([label, value, note]) => <div key={label} className="metric-card"><p className="text-sm text-muted-foreground">{label}</p><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</section><Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Tren Penjualan Mingguan</CardTitle></CardHeader><CardContent className="pt-4"><SalesChart sales={chartSales}/></CardContent></Card></TabsContent>
      <TabsContent value="in" className="mt-4"><MovementTable rows={movementsIn} kind="IN"/></TabsContent>
      <TabsContent value="out" className="mt-4"><MovementTable rows={movementsOut} kind="OUT"/></TabsContent>
      <TabsContent value="stock" className="mt-4"><Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Status Stok Terkini</CardTitle><CardDescription>Ketersediaan barang per SKU.</CardDescription></CardHeader><CardContent className="grid gap-1 p-5">{catalog.map(p => <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"><span className="min-w-0"><strong className="block truncate text-[13px]">{p.name}</strong><small className="font-mono text-[10px] text-muted-foreground">{p.code} · tersisa {p.stock} {p.unit} · {rupiah(p.sellingPrice)}</small></span><StockBadge stock={p.stock} minimum={p.minimumStock}/></div>)}</CardContent></Card></TabsContent>
      <TabsContent value="service" className="mt-4"><Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Ringkasan Servis</CardTitle><CardDescription>Perkembangan servis kendaraan pelanggan.</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><table className={lightTable}><thead><tr>{[['Nomor Servis', 'text-left'], ['Pelanggan', 'text-left'], ['Kendaraan', 'text-left'], ['Jenis Servis', 'text-left'], ['Status', 'text-left']].map(([h, a]) => <th key={h} className={`${thCls} ${a}`}>{h}</th>)}</tr></thead><tbody>{serviceOrders.map(([id, customer, plate, job, status]) => <tr key={id} className="transition-colors hover:bg-muted/50"><td className={`${tdCls} font-mono text-xs`}>{id}</td><td className={`${tdCls} font-semibold`}>{customer}</td><td className={`${tdCls} font-mono text-xs`}>{plate}</td><td className={tdCls}>{job}</td><td className={tdCls}><span className={`stock-chip ${status === 'Dikerjakan' ? 'low' : ''}`}>{status}</span></td></tr>)}</tbody></table></CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}
