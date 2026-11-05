import { ArrowDownToLine, ArrowUpFromLine, Boxes, PackageSearch, ReceiptText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StockBadge } from '@/components/stock-badge';
import { PageHeader } from '@/components/page-header';
import { createClient } from '@/lib/supabase/server';
import { rupiah, todayISO } from '@/lib/demo-data';
import { SalesChart } from '@/components/sales-chart';
import { DashboardRealtime } from '@/components/dashboard-realtime';

const statusChip = (s) => (s === 'Selesai' ? 'stock-chip' : s === 'Menunggu' || s === 'Dibatalkan' ? 'stock-chip low' : 'stock-chip out');

const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function DashboardPage() {
    const supabase = await createClient();
    const todayKey = todayISO();
    const monthKey = `${todayKey.slice(0, 7)}-01`;
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
    const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    const [productResult, transactionResult, incomingResult, outgoingResult, categoryResult, weeklyResult] = await Promise.all([
        supabase.from('products').select('id,code,name,unit,stock,minimum_stock,selling_price').eq('is_active', true),
        supabase.from('transactions').select('id,transaction_code,total,payment_method,status,created_at,customers(name)').gte('created_at', todayKey).order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('id', { count: 'exact', head: true }).eq('type', 'IN').gte('movement_date', monthKey),
        supabase.from('stock_movements').select('id', { count: 'exact', head: true }).eq('type', 'OUT').gte('movement_date', monthKey),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('created_at,total').gte('created_at', weekKey),
    ]);
    const products = (productResult.data || []).map(row => ({ ...row, minimumStock: row.minimum_stock, sellingPrice: Number(row.selling_price) }));
    const allTodayTransactions = transactionResult.data || [];
    const transactions = allTodayTransactions.slice(0, 8);
    const low = products.filter((p) => p.stock <= p.minimumStock);
    const todayTotal = allTodayTransactions.reduce((sum, row) => sum + Number(row.total || 0), 0);
    const salesByDay = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(); day.setDate(day.getDate() - 6 + i);
        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        return { day: day.toLocaleDateString('id-ID', { weekday: 'short' }), total: (weeklyResult.data || []).filter(row => row.created_at?.slice(0, 10) === key).reduce((sum, row) => sum + Number(row.total || 0), 0) };
    });
    const stats = [
        ['Penjualan Hari Ini', rupiah(todayTotal), 'dari transaksi Supabase hari ini', TrendingUp],
        ['Transaksi Hari Ini', String(allTodayTransactions.length), 'transaksi tercatat hari ini', ReceiptText],
        ['Total Produk', String(products.length), `${categoryResult.count || 0} kategori`, Boxes],
        ['Stok Menipis', String(low.length), 'perlu tindakan', PackageSearch],
        ['Barang Masuk', String(incomingResult.count || 0), 'bulan ini', ArrowDownToLine],
        ['Barang Keluar', String(outgoingResult.count || 0), 'bulan ini', ArrowUpFromLine],
    ];

    return (
        <div className="flex flex-col gap-5">
            <DashboardRealtime />
            <PageHeader eyebrow="OPERATION OVERVIEW" title="Dashboard" description="Selamat datang kembali di sistem DIAN MOTOR">
                <Button variant="outline">{today}</Button>
            </PageHeader>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map(([label, value, note, Icon], i) => (
                    <div key={label} className={`metric-card ${i === 3 ? 'warning' : ''}`}>
                        <div className="flex items-start justify-between">
                            <p className="text-sm text-muted-foreground">{label}</p>
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="size-5" />
                            </span>
                        </div>
                        <strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{value}</strong>
                        <p className={`mt-1 text-xs ${i === 3 ? 'font-medium text-primary' : 'text-muted-foreground'}`}>{note}</p>
                    </div>
                ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
                <Card className="rounded-[17px]">
                    <CardHeader className="flex-row items-start justify-between">
                        <div>
                            <CardTitle>Ringkasan Penjualan</CardTitle>
                            <CardDescription>Performa penjualan 7 hari terakhir</CardDescription>
                        </div>
                        <Badge variant="secondary">Minggu Ini</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[250px] w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                            <SalesChart sales={salesByDay}/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[17px]">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Perhatian Stok</CardTitle>
                            <CardDescription>Produk yang perlu segera ditindaklanjuti</CardDescription>
                        </div>
                        {low.length > 0 && <Badge variant="destructive" className="font-mono text-[11px]">{low.length} Perlu Restok</Badge>}
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {low.slice(0, 5).map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {p.code} · Tersisa {p.stock} {p.unit}
                                    </p>
                                </div>
                                <StockBadge stock={p.stock} minimum={p.minimumStock} />
                            </div>
                        ))}
                        {low.length > 5 && <p className="py-1 text-center text-xs text-muted-foreground">+ {low.length - 5} produk lainnya membutuhkan restok</p>}
                        <Button nativeButton={false} render={<Link href="/stok" />} variant="outline" className="w-full">
                            Lihat Semua di Stok &amp; Inventori ({low.length})
                        </Button>
                    </CardContent>
                </Card>
            </section>

            <Card className="rounded-[17px]">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaksi Terbaru</CardTitle>
                        <CardDescription>Aktivitas penjualan terkini</CardDescription>
                    </div>
                    <Button nativeButton={false} render={<Link href="/transaksi" />} variant="ghost">
                        Lihat Semua
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Transaksi</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-mono text-xs">{t.transaction_code}</TableCell>
                                        <TableCell>{new Date(t.created_at).toLocaleString('id-ID')}</TableCell>
                                        <TableCell>{t.customers?.name || 'Pelanggan Umum'}</TableCell>
                                        <TableCell>{t.payment_method}</TableCell>
                                        <TableCell>
                                            <span className={statusChip(t.status)}>{t.status}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{rupiah(Number(t.total))}</TableCell>
                                    </TableRow>
                                ))}
                                {!transactions.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada transaksi di Supabase.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
