'use client';
import { Download } from 'lucide-react';
import { SalesChart } from '@/components/sales-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StockBadge } from '@/components/stock-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { products, rupiah, stockStatus } from '@/lib/demo-data';

const movementsIn = [
    ['MI-260827-004', 'Oli Mesin MPX 1 0.8L', '40 Botol', 'PT Sumber Motor', '27 Agu 2026'],
    ['MI-260827-003', 'Busi NGK CPR9EA-9', '24 Pcs', 'CV Karya Otomotif', '27 Agu 2026'],
    ['MI-260826-002', 'Ban Motor 80/90-14', '12 Pcs', 'PT Sumber Motor', '26 Agu 2026'],
];
const movementsOut = [
    ['MO-260827-007', 'Kampas Rem Depan Vario', '6 Set', 'Penjualan', '27 Agu 2026'],
    ['MO-260827-006', 'Oli Mesin MPX 1 0.8L', '18 Botol', 'Servis', '27 Agu 2026'],
    ['MO-260826-005', 'Filter Udara Beat', '7 Pcs', 'Penjualan', '26 Agu 2026'],
];
const serviceOrders = [
    ['SRV-260827-012', 'Budi Santoso', 'B 4123 KLM', 'Ganti oli & tune up', 'Dikerjakan'],
    ['SRV-260827-011', 'Andi Pratama', 'B 9081 PQR', 'Perbaikan rem depan', 'Menunggu'],
    ['SRV-260826-010', 'Siti Aminah', 'F 2281 AA', 'Servis berkala 10.000 km', 'Selesai'],
];
const lightTable = 'w-full text-sm';
const thCls = 'border-b border-border px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground';
const tdCls = 'border-b border-border px-3.5 py-3 last:border-0';

export default function Page() { return <div className="flex flex-col gap-5"><PageHeader eyebrow="ANALYTICS & REPORTING" title="Laporan" description="Analisis operasional dan kinerja DIAN MOTOR."> <Button><Download data-icon="inline-start"/>Unduh Laporan</Button></PageHeader>
    <Tabs defaultValue="sales" className="gap-4"><TabsList variant="line" className="h-auto w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-card p-1 shadow-sm ring-1 ring-foreground/10"><TabsTrigger value="sales" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Penjualan</TabsTrigger><TabsTrigger value="in" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Barang Masuk</TabsTrigger><TabsTrigger value="out" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Barang Keluar</TabsTrigger><TabsTrigger value="stock" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Stok</TabsTrigger><TabsTrigger value="service" className="h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary">Servis</TabsTrigger></TabsList>
      <TabsContent value="sales" className="mt-4 flex flex-col gap-4"><section className="grid gap-3 sm:grid-cols-3">{[['Total Penjualan', rupiah(12910000), 'Agustus 2026'], ['Jumlah Transaksi', '86', 'transaksi tercatat'], ['Rata-rata Transaksi', rupiah(150116), 'per transaksi']].map(([label, value, note]) => <div key={label} className="metric-card"><p className="text-sm text-muted-foreground">{label}</p><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</section><Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Tren Penjualan Mingguan</CardTitle></CardHeader><CardContent className="pt-4"><SalesChart /></CardContent></Card></TabsContent>
      <TabsContent value="in" className="mt-4"><Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Realisasi Barang Masuk</CardTitle><CardDescription>Pencatatan barang masuk dari supplier.</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><table className={lightTable}><thead><tr>{[['No. Pergerakan', 'text-left'], ['Barang', 'text-left'], ['Jumlah', 'text-left'], ['Supplier', 'text-left'], ['Tanggal', 'text-left']].map(([h, a]) => <th key={h} className={`${thCls} ${a}`}>{h}</th>)}</tr></thead><tbody>{movementsIn.map(r => <tr key={r[0]} className="transition-colors hover:bg-muted/50">{r.map((c, j) => <td key={j} className={`${tdCls} ${j === 0 ? 'font-mono text-xs' : j === 1 ? 'font-semibold' : 'text-muted-foreground'}`}>{c}</td>)}</tr>)}</tbody></table></CardContent></Card></TabsContent>
      <TabsContent value="out" className="mt-4"><Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Realisasi Barang Keluar</CardTitle><CardDescription>Pengeluaran stok untuk penjualan & servis.</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><table className={lightTable}><thead><tr>{[['No. Pergerakan', 'text-left'], ['Barang', 'text-left'], ['Jumlah', 'text-left'], ['Jenis Penggunaan', 'text-left'], ['Tanggal', 'text-left']].map(([h, a]) => <th key={h} className={`${thCls} ${a}`}>{h}</th>)}</tr></thead><tbody>{movementsOut.map(r => <tr key={r[0]} className="transition-colors hover:bg-muted/50">{r.map((c, j) => <td key={j} className={`${tdCls} ${j === 0 ? 'font-mono text-xs' : j === 1 ? 'font-semibold' : 'text-muted-foreground'}`}>{c}</td>)}</tr>)}</tbody></table></CardContent></Card></TabsContent>
      <TabsContent value="stock" className="mt-4"><Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Status Stok Terkini</CardTitle><CardDescription>Ketersediaan barang per SKU.</CardDescription></CardHeader><CardContent className="grid gap-1 p-5">{products.map(p => <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"><span className="min-w-0"><strong className="block truncate text-[13px]">{p.name}</strong><small className="font-mono text-[10px] text-muted-foreground">{p.code} · tersisa {p.stock} {p.unit} · {rupiah(p.sellingPrice)}</small></span><StockBadge stock={p.stock} minimum={p.minimumStock}/></div>)}</CardContent></Card></TabsContent>
      <TabsContent value="service" className="mt-4"><Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Ringkasan Servis</CardTitle><CardDescription>Perkembangan servis kendaraan pelanggan.</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><table className={lightTable}><thead><tr>{[['Nomor Servis', 'text-left'], ['Pelanggan', 'text-left'], ['Kendaraan', 'text-left'], ['Jenis Servis', 'text-left'], ['Status', 'text-left']].map(([h, a]) => <th key={h} className={`${thCls} ${a}`}>{h}</th>)}</tr></thead><tbody>{serviceOrders.map(([id, customer, plate, job, status]) => <tr key={id} className="transition-colors hover:bg-muted/50"><td className={`${tdCls} font-mono text-xs`}>{id}</td><td className={`${tdCls} font-semibold`}>{customer}</td><td className={`${tdCls} font-mono text-xs`}>{plate}</td><td className={tdCls}>{job}</td><td className={tdCls}><span className={`stock-chip ${status === 'Dikerjakan' ? 'low' : ''}`}>{status}</span></td></tr>)}</tbody></table></CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}