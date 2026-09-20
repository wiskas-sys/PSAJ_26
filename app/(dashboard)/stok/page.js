'use client';
import { useEffect, useMemo, useState } from 'react';
import { Boxes, Minus, MoreHorizontal, PackagePlus, PackageX, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getProducts, products, rupiah, setStoredProducts, stockStatus } from '@/lib/demo-data';
import { StockBadge } from '@/components/stock-badge';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const filters = ['Semua', 'Stok Aman', 'Stok Menipis', 'Stok Habis'];

const statusCounts = (list) => ({
    'Stok Aman': list.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Aman').length,
    'Stok Menipis': list.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Menipis').length,
    'Stok Habis': list.filter(p => stockStatus(p.stock, p.minimumStock) === 'Stok Habis').length,
});

export default function StockPage() {
    const [data, setData] = useState(() => products.map(p => ({ ...p })));
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('Semua');
    const [targetId, setTargetId] = useState(null);
    const [direction, setDirection] = useState('in');
    const [qtyInput, setQtyInput] = useState(1);
    const shown = useMemo(() => data.filter(p => (`${p.name} ${p.code}`).toLowerCase().includes(query.toLowerCase()) && (filter === 'Semua' || stockStatus(p.stock, p.minimumStock) === filter)), [query, filter, data]);
    const counts = statusCounts(data);
    const lowCount = counts['Stok Menipis'] + counts['Stok Habis'];
    const target = data.find(p => p.id === targetId);
    function applyAdjust() {
        const qty = Number(qtyInput) || 0;
        if (qty <= 0)
            return toast.error('Jumlah harus lebih dari 0.');
        setData(prev => prev.map(p => p.id === targetId ? { ...p, stock: Math.max(0, p.stock + (direction === 'in' ? qty : -qty)) } : p));
        toast.success(direction === 'in' ? `Stok ${target?.name} ditambahkan.` : `Stok ${target?.name} dikurangi.`);
        setTargetId(null); setQtyInput(1);
    }
    function open(targetId, direction) { setTargetId(targetId); setDirection(direction); setQtyInput(1); }
    function syncStock() { setData(getProducts().map(p => ({ ...p }))); toast.success('Data stok disinkronkan.'); }
    useEffect(() => { setData(getProducts().map(p => ({ ...p }))); }, []);
    useEffect(() => { setStoredProducts(data); }, [data]);
    return <div className="flex flex-col gap-5"><PageHeader title="Cek Stok" description="Pantau ketersediaan barang secara cepat dan akurat."> <Button variant="outline" onClick={syncStock}><Boxes data-icon="inline-start"/>Sinkronkan</Button></PageHeader>
    <section className="grid gap-3 sm:grid-cols-3">{[['Total SKU', String(data.length), 'sku tercatat'], ['Stok Menipis', String(lowCount), 'perlu tindakan'], ['Nilai Persediaan', rupiah(64325000), 'estimasi harga beli']].map(([label, value, note], i) => <div key={label} className={`metric-card ${i === 1 ? 'warning' : ''}`}><p className="text-sm text-muted-foreground">{label}</p><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</section>
    <div className="table-surface">
      <div className="flex flex-col gap-3 border-b border-border p-3.5 xl:flex-row xl:items-center xl:justify-between"><div className="input-with-icon min-w-0 flex-1"><Search className="size-4"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama barang atau kode barang..." className="h-10 min-w-0 w-full rounded-xl border border-border bg-transparent pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/10"/></div><div className="flex gap-1.5 overflow-x-auto">{filters.map(v => <button key={v} type="button" onClick={() => setFilter(v)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${filter === v ? 'bg-primary text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{v}{v !== 'Semua' && <span className="rounded-full bg-black/10 px-1.5 font-mono text-[10px] dark:bg-white/10">{counts[v]}</span>}</button>)}</div></div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full"><thead><tr className="border-b border-border">{[['Kode Barang', 'mono'], ['Nama Barang', 'left'], ['Kategori', 'left'], ['Stok', 'left'], ['Minimum', 'left'], ['Harga Jual', 'right'], ['Status', 'left'], ['Aksi', 'right']].map(([h, align]) => <th key={h} className={`px-3.5 py-2.5 font-medium uppercase tracking-wide ${align === 'right' ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead><tbody>{shown.map(p => <tr key={p.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"><td className="px-3.5 py-3 font-mono text-xs">{p.code}</td><td className="px-3.5 py-3 text-[13px] font-semibold">{p.name}</td><td className="px-3.5 py-3 text-[13px] text-muted-foreground">{p.category}</td><td className="px-3.5 py-3"><strong className="text-base">{p.stock}</strong> <small className="text-xs text-muted-foreground">{p.unit}</small></td><td className="px-3.5 py-3 text-[13px]">{p.minimumStock}</td><td className="px-3.5 py-3 text-right text-[13px] font-semibold">{rupiah(p.sellingPrice)}</td><td className="px-3.5 py-3"><StockBadge stock={p.stock} minimum={p.minimumStock}/></td><td className="px-3.5 py-3 text-right"><DropdownMenu><DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-open:bg-accent"><MoreHorizontal/><span className="sr-only">Aksi</span></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44 p-1.5"><DropdownMenuItem className="h-9" onClick={() => open(p.id, 'in')}><PackagePlus className="size-4 text-emerald-500"/>Tambah Stok</DropdownMenuItem><DropdownMenuItem className="h-9" onClick={() => open(p.id, 'out')}><PackageX className="size-4 text-red-500"/>Kurangi Stok</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></div>
      <div className="grid gap-3 p-3 md:hidden">{shown.map(p => <article key={p.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-mono text-[10px] text-muted-foreground">{p.code}</p><h2 className="mt-1 text-sm font-semibold">{p.name}</h2></div><span className="part-cell"><span>{p.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}</span></span></div><div className="mt-3 flex items-center justify-between"><strong>{p.stock} <small className="font-normal text-muted-foreground">{p.unit}</small></strong><StockBadge stock={p.stock} minimum={p.minimumStock}/></div><p className="mt-1 text-xs text-muted-foreground">{p.category} · {rupiah(p.sellingPrice)}</p><div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={() => open(p.id, 'in')}><Plus data-icon="inline-start"/>Tambah</Button><Button variant="outline" size="sm" onClick={() => open(p.id, 'out')}><Minus data-icon="inline-start"/>Kurangi</Button></div></article>)}</div>
    </div>
    <Dialog open={targetId !== null} onOpenChange={o => { if (!o) setTargetId(null); }}><DialogContent><DialogHeader><DialogTitle>{direction === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}</DialogTitle><DialogDescription>{direction === 'in' ? `Masukkan stok masuk untuk ${target?.name ?? ''}.` : `Kurangi stok untuk ${target?.name ?? ''}. Stok tidak akan kurang dari 0.`}</DialogDescription></DialogHeader><FieldGroup><Field><FieldLabel>Jumlah ({target?.unit})</FieldLabel><Input type="number" min="1" value={qtyInput} onChange={e => setQtyInput(e.target.value)} className="h-11" autoFocus/></Field></FieldGroup><DialogFooter><Button variant="outline" onClick={() => setTargetId(null)}>Batal</Button><Button onClick={applyAdjust}>{direction === 'in' ? 'Simpan Stok Masuk' : 'Simpan Pengurangan'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}