'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, FileSpreadsheet, MoreHorizontal, PackagePlus, PackageX, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getProducts, products as seedProducts, rupiah, stockStatus } from '@/lib/demo-data';
import { getMovements, removeProduct, stockSummary, subscribeStock } from '@/lib/stock-store';
import { movements as seedMovements } from '@/lib/demo-data';
import { StockBadge } from '@/components/stock-badge';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { StockMovementDialog } from '@/components/stock-movement-dialog';
import { StockProductDialog } from '@/components/stock-product-dialog';
import { StockOpnameDialog } from '@/components/stock-opname-dialog';
import { StockBulkImportDialog } from '@/components/stock-bulk-import-dialog';
import { StockMovementLog } from '@/components/stock-movement-log';

const filters = ['Semua', 'Stok Aman', 'Stok Menipis', 'Stok Habis'];
const statusCounts = (list) => ({
    'Stok Aman': list.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Aman').length,
    'Stok Menipis': list.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Menipis').length,
    'Stok Habis': list.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Habis').length,
});
function downloadStockCsv(list) {
    const esc = (v) => `"${`${v}`.replace(/"/g, '""')}"`;
    const head = ['Kode Barang', 'Nama Barang', 'Kategori', 'Stok', 'Satuan', 'Stok Minimum', 'Harga Beli', 'Harga Jual', 'Status'];
    const body = list.map(p => [p.code, p.name, p.category, p.stock, p.unit, p.minimumStock, p.purchasePrice, p.sellingPrice, stockStatus(p.stock, p.minimumStock)]);
    const blob = new Blob([`\uFEFF${[head, ...body].map(r => r.map(esc).join(';')).join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stok-terkini.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${list.length} baris stok diunduh sebagai CSV.`);
}

export default function StockPage() {
    const [data, setData] = useState(() => seedProducts.map(p => ({ ...p })));
    const [logs, setLogs] = useState(() => seedMovements.map(m => ({ ...m })));
    const [tab, setTab] = useState('stok');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('Semua');
    const [movement, setMovement] = useState({ open: false, productId: null, type: 'IN' });
    const [productForm, setProductForm] = useState({ open: false, product: null });
    const [opnameOpen, setOpnameOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const refresh = useCallback(() => { setData(getProducts().map(p => ({ ...p }))); setLogs(getMovements()); }, []);
    useEffect(() => {
        refresh();
        return subscribeStock(refresh);
    }, [refresh]);
    const shown = useMemo(() => data.filter(p => `${p.name} ${p.code}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'Semua' || stockStatus(p.stock, p.minimumStock) === filter)), [query, filter, data]);
    const counts = statusCounts(data);
    const summary = stockSummary(data);
    const openMovement = (productId, type) => setMovement({ open: true, productId: productId ?? null, type });
    function confirmDelete() {
        const result = removeProduct(deleteTarget.id);
        if (!result.ok) return toast.error(result.error);
        toast.success(`${deleteTarget.code} dihapus dari katalog.`);
        setDeleteTarget(null);
    }
    return <div className="flex flex-col gap-5">
        <PageHeader title="Stok & Inventori" description="Masukkan data barang, catat mutasi, dan pantau ketersediaan secara akurat.">
            <Button onClick={() => setProductForm({ open: true, product: null })}><Plus data-icon="inline-start"/>Tambah Barang</Button>
            <Button variant="outline" onClick={() => openMovement(null, 'IN')}><ArrowDownToLine data-icon="inline-start"/>Barang Masuk</Button>
            <Button variant="outline" onClick={() => openMovement(null, 'OUT')}><ArrowUpFromLine data-icon="inline-start"/>Barang Keluar</Button>
            <DropdownMenu><DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground data-open:bg-muted"><MoreHorizontal/><span className="sr-only">Alat stok</span></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52 p-1.5">
                <DropdownMenuItem className="h-9" onClick={() => setOpnameOpen(true)}><ClipboardCheck className="size-4 text-muted-foreground"/>Stok Opname</DropdownMenuItem>
                <DropdownMenuItem className="h-9" onClick={() => setBulkOpen(true)}><FileSpreadsheet className="size-4 text-muted-foreground"/>Impor Massal</DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem className="h-9" onClick={() => downloadStockCsv(shown)} disabled={!shown.length}><FileSpreadsheet className="size-4 text-muted-foreground"/>Unduh CSV Stok</DropdownMenuItem>
                <DropdownMenuItem className="h-9" onClick={() => { refresh(); toast.success('Data stok disinkronkan.'); }}><RefreshCw className="size-4 text-muted-foreground"/>Sinkronkan Stok</DropdownMenuItem>
            </DropdownMenuContent></DropdownMenu>
        </PageHeader>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[['Total SKU', String(summary.total), 'barang terdaftar'], ['Stok Menipis', String(summary.low), 'perlu restock'], ['Stok Habis', String(summary.out), 'perlu pembelian'], ['Nilai Persediaan', rupiah(summary.value), 'estimasi harga beli']].map(([label, value, note], i) => <div key={label} className={`metric-card ${i === 1 ? 'warning' : ''}`}><p className="text-sm text-muted-foreground">{label}</p><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}
        </section>

        <div className="grid gap-4">
            <div className="flex gap-1.5 overflow-x-auto">
                {[['stok', 'Daftar Stok', data.length], ['mutasi', 'Riwayat Mutasi', logs.length]].map(([v, l, n]) => <button key={v} type="button" onClick={() => setTab(v)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-colors ${tab === v ? 'bg-primary text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{l}<span className="rounded-full bg-black/10 px-1.5 font-mono text-[10px] dark:bg-white/10">{n}</span></button>)}
            </div>

            {tab === 'mutasi' ? <StockMovementLog movements={logs}/> : <div className="table-surface">
                <div className="flex flex-col gap-3 border-b border-border p-3.5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="input-with-icon min-w-0 flex-1"><Search className="size-4"/><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama barang atau kode barang..." className="h-10"/></div>
                    <div className="flex gap-1.5 overflow-x-auto">{filters.map(v => <button key={v} type="button" onClick={() => setFilter(v)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${filter === v ? 'bg-primary text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{v}{v !== 'Semua' && <span className="rounded-full bg-black/10 px-1.5 font-mono text-[10px] dark:bg-white/10">{counts[v]}</span>}</button>)}</div>
                </div>
                <div className="hidden overflow-x-auto md:block"><table className="w-full"><thead><tr className="border-b border-border">{[['Kode Barang', 'left'], ['Nama Barang', 'left'], ['Kategori', 'left'], ['Stok', 'left'], ['Minimum', 'left'], ['Harga Jual', 'right'], ['Status', 'left'], ['Aksi', 'right']].map(([h, align]) => <th key={h} className={`px-3.5 py-2.5 font-medium uppercase tracking-wide ${align === 'right' ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
                    <tbody>{shown.map(p => <tr key={p.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                        <td className="px-3.5 py-3 font-mono text-xs">{p.code}</td>
                        <td className="px-3.5 py-3 text-[13px] font-semibold">{p.name}</td>
                        <td className="px-3.5 py-3 text-[13px] text-muted-foreground">{p.category}</td>
                        <td className="px-3.5 py-3"><strong className="text-base">{p.stock}</strong> <small className="text-xs text-muted-foreground">{p.unit}</small></td>
                        <td className="px-3.5 py-3 text-[13px]">{p.minimumStock}</td>
                        <td className="px-3.5 py-3 text-right text-[13px] font-semibold">{rupiah(p.sellingPrice)}</td>
                        <td className="px-3.5 py-3"><StockBadge stock={p.stock} minimum={p.minimumStock}/></td>
                        <td className="px-3.5 py-3 text-right"><DropdownMenu><DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-open:bg-accent"><MoreHorizontal/><span className="sr-only">Aksi {p.code}</span></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48 p-1.5">
                            <DropdownMenuItem className="h-9" onClick={() => openMovement(p.id, 'IN')}><PackagePlus className="size-4 text-emerald-500"/>Tambah Stok</DropdownMenuItem>
                            <DropdownMenuItem className="h-9" onClick={() => openMovement(p.id, 'OUT')}><PackageX className="size-4 text-red-500"/>Kurangi Stok</DropdownMenuItem>
                            <DropdownMenuItem className="h-9" onClick={() => setProductForm({ open: true, product: p })}><Pencil className="size-4 text-muted-foreground"/>Ubah Barang</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem variant="destructive" className="h-9 text-red-500" onClick={() => setDeleteTarget(p)}><Trash2 className="size-4 text-red-500"/>Hapus Barang</DropdownMenuItem>
                        </DropdownMenuContent></DropdownMenu></td>
                    </tr>)}</tbody></table></div>
                <div className="grid gap-3 p-3 md:hidden">{shown.map(p => <article key={p.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-mono text-[10px] text-muted-foreground">{p.code}</p><h2 className="mt-1 text-sm font-semibold">{p.name}</h2></div><span className="part-cell"><span>{p.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}</span></span></div>
                    <div className="mt-3 flex items-center justify-between"><strong>{p.stock} <small className="font-normal text-muted-foreground">{p.unit}</small></strong><StockBadge stock={p.stock} minimum={p.minimumStock}/></div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.category} · {rupiah(p.sellingPrice)}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2"><Button variant="outline" size="sm" onClick={() => openMovement(p.id, 'IN')}><Plus data-icon="inline-start"/>Tambah</Button><Button variant="outline" size="sm" onClick={() => openMovement(p.id, 'OUT')}><PackageX data-icon="inline-start"/>Kurangi</Button><Button variant="outline" size="sm" onClick={() => setProductForm({ open: true, product: p })}><Pencil data-icon="inline-start"/>Ubah</Button></div>
                </article>)}</div>
                {!shown.length && <p className="py-16 text-center text-muted-foreground">{data.length ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada barang. Klik Tambah Barang untuk mulai.'}</p>}
            </div>}
        </div>

        <StockMovementDialog open={movement.open} onOpenChange={o => setMovement(m => ({ ...m, open: o }))} products={data} initial={{ productId: movement.productId, type: movement.type }}/>
        <StockProductDialog open={productForm.open} onOpenChange={o => setProductForm(f => ({ ...f, open: o }))} product={productForm.product}/>
        <StockOpnameDialog open={opnameOpen} onOpenChange={setOpnameOpen} products={data}/>
        <StockBulkImportDialog open={bulkOpen} onOpenChange={setBulkOpen} products={data}/>

        <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Hapus Barang</DialogTitle><DialogDescription>Hapus <strong className="text-foreground">{deleteTarget?.name}</strong> dari katalog? Riwayat mutasi barang ini tetap disimpan.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button><Button onClick={confirmDelete}><Trash2 data-icon="inline-start"/>Hapus Barang</Button></DialogFooter></DialogContent></Dialog>
    </div>;
}
