'use client';
import { useState } from 'react';
import { Download, Eye, MoreHorizontal, Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const INITIAL = {
    Produk: [['OLI-001', 'Oli Mesin MPX 1 0.8L', 'Oli', '24 Botol', 'Rp58.000', 'Aman'], ['REM-014', 'Kampas Rem Depan Vario', 'Sparepart', '4 Set', 'Rp68.000', 'Menipis'], ['BUS-007', 'Busi NGK CPR9EA-9', 'Kelistrikan', '18 Pcs', 'Rp26.000', 'Aman']],
    Kategori: [['Oli', 'Pelumas mesin dan transmisi', '12 produk'], ['Sparepart', 'Suku cadang kendaraan', '86 produk'], ['Ban', 'Ban dalam dan luar', '28 produk'], ['Kelistrikan', 'Komponen kelistrikan', '34 produk']],
    Supplier: [['PT Sumber Motor', '0812-4455-6677', 'sales@sumbermotor.id', '42 produk'], ['CV Karya Otomotif', '0813-8877-2211', 'order@karyaoto.id', '26 produk']],
    Pelanggan: [['Budi Santoso', '0812-3456-7890', 'Jl. Melati No. 18', '12 transaksi'], ['Siti Aminah', '0821-8855-4422', 'Jl. Kenanga No. 7', '8 transaksi']],
    Servis: [['SRV-260827-012', 'Budi Santoso', 'B 4123 KLM', 'Ganti oli & tune up', 'Dikerjakan'], ['SRV-260827-011', 'Andi Pratama', 'B 9081 PQR', 'Perbaikan rem', 'Menunggu'], ['SRV-260826-010', 'Siti Aminah', 'F 2281 AA', 'Servis berkala', 'Selesai']],
    Transaksi: [['TRX-260827-018', '27 Agu 2026', 'Budi Santoso', 'Tunai', 'Rp246.000', 'Selesai'], ['TRX-260827-017', '27 Agu 2026', 'Pelanggan Umum', 'QRIS', 'Rp116.000', 'Selesai']],
    Pengguna: [['Admin Bengkel', 'admin@dianmotor.id', 'Admin', 'Aktif'], ['Rina Kasir', 'rina@dianmotor.id', 'Kasir', 'Aktif'], ['Dedi Mekanik', 'dedi@dianmotor.id', 'Mekanik', 'Aktif']],
};
const headers = { Produk: ['Kode', 'Nama Produk', 'Kategori', 'Stok', 'Harga Jual', 'Status'], Kategori: ['Nama', 'Deskripsi', 'Jumlah'], Supplier: ['Nama Supplier', 'Nomor Telepon', 'Email', 'Produk'], Pelanggan: ['Nama', 'Nomor Telepon', 'Alamat', 'Riwayat'], Servis: ['Nomor Servis', 'Pelanggan', 'Kendaraan', 'Jenis Servis', 'Status'], Transaksi: ['ID Transaksi', 'Tanggal', 'Pelanggan', 'Metode', 'Total', 'Status'], Pengguna: ['Nama', 'Email', 'Peran', 'Status'] };
const eyebrows = { Produk: 'PRODUCT CATALOG', Kategori: 'CATEGORY', Supplier: 'SUPPLIER NETWORK', Pelanggan: 'CUSTOMER', Servis: 'SERVICE & WORK ORDER', Transaksi: 'SALES & TRANSACTION', Pengguna: 'TEAM & ACCESS' };
const codeCols = { Produk: 0, Servis: 0, Transaksi: 0 };
const editConfig = {
    Produk: { readonly: [0], selects: { 5: ['Aman', 'Menipis', 'Habis'] } },
    Kategori: { readonly: [], selects: {} },
    Supplier: { readonly: [], selects: {} },
    Pelanggan: { readonly: [], selects: {} },
    Servis: { readonly: [0], selects: { 4: ['Menunggu', 'Dikerjakan', 'Selesai'] } },
    Pengguna: { readonly: [], selects: { 2: ['Admin', 'Kasir', 'Mekanik'], 3: ['Aktif', 'Nonaktif'] } },
};
const transactionSorts = [['tanggal-desc', 'Tanggal terbaru'], ['tanggal-asc', 'Tanggal terlama'], ['total-desc', 'Total terbesar'], ['total-asc', 'Total terkecil']];

function initials(name) { return `${name}`.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
function CellContent({ title, c, j }) {
    if (codeCols[title] === j)
        return <span className="font-mono text-xs">{c}</span>;
    if (j === 0)
        return <div className="part-cell"><span>{initials(c)}</span><strong className="block text-[13px]">{c}</strong></div>;
    return <span className="text-[13px]">{c}</span>;
}
const tag = (s) => ['Selesai', 'Aktif', 'Aman', 'Dikerjakan'].includes(s) ? 'green' : s === 'Menunggu' || s === 'Menipis' ? 'red' : s === 'Habis' ? 'out' : '';
function statusPill(s) { const t = tag(s); if (!t)
        return <span className="text-[13px]">{s}</span>; return <span className={t === 'green' ? 'stock-chip' : `stock-chip ${t}`}>{s}</span>; }

function compareSortValue(a, b) {
    const sa = `${a}`, sb = `${b}`;
    const na = sa.includes('Rp') ? parseFloat(sa.replace(/[^0-9.]/g, '')) : NaN;
    const nb = sb.includes('Rp') ? parseFloat(sb.replace(/[^0-9.]/g, '')) : NaN;
    if (!Number.isNaN(na) && !Number.isNaN(nb))
        return na - nb;
    return sa.localeCompare(sb, 'id', { numeric: true, sensitivity: 'base' });
}

function sortRows(title, rows, sort) {
    if (title !== 'Transaksi' || !sort)
        return rows;
    const idx = sort.startsWith('total') ? 4 : 1;
    const asc = sort.endsWith('asc');
    return [...rows].sort((a, b) => { const r = compareSortValue(a[idx], b[idx]); return asc ? r : -r; });
}

function DetailSheet({ title, row, open, onClose }) {
    const head = headers[title] ?? [];
    const name = row?.[0] ?? '';
    return <Sheet open={open} onOpenChange={o => { if (!o)
            onClose(); }}><SheetContent side="right"><SheetHeader><SheetTitle>{name}</SheetTitle><SheetDescription>{eyebrows[title] ?? 'MODULE'} · Detail data</SheetDescription></SheetHeader>
        <div className="grid gap-2 px-4">{head.map((h, j) => <div key={h} className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-2 text-sm last:border-0"><span className="text-muted-foreground">{h}</span><strong className="text-right text-[13px]">{row?.[j]}</strong></div>)}</div>
    </SheetContent></Sheet>;
}

function StrukSheet({ row, open, onClose }) {
    const [id, tanggal, pelanggan, metode, total, status] = row ?? [];
    return <Sheet open={open} onOpenChange={o => { if (!o)
            onClose(); }}><SheetContent side="right" className="bg-background"><div className="px-4 py-6 font-mono text-[11px] leading-relaxed text-foreground">
        <div className="text-center"><strong className="block text-sm tracking-wide">DIAN MOTOR</strong><span className="mt-1 block text-[9px] tracking-[.14em] text-muted-foreground">ENTERPRISE POS v2.4.0</span></div>
        <div className="my-3 border-t-2 border-dashed border-border"/>
        <p><span className="text-muted-foreground">No.</span> {id}</p><p><span className="text-muted-foreground">Tanggal</span> {tanggal}</p><p><span className="text-muted-foreground">Pelanggan</span> {pelanggan}</p><p><span className="text-muted-foreground">Metode</span> {metode} · {status}</p>
        <div className="my-3 border-t-2 border-dashed border-border"/>
        <div className="flex justify-between"><span>Total Bayar</span><strong>{total}</strong></div>
        <div className="my-3 border-t-2 border-dashed border-border"/>
        <p className="text-center tracking-[.1em]">TERIMA KASIH · SAMPAI JUMPA</p>
    </div></SheetContent></Sheet>;
}

export function ManagementPage({ title, description, addLabel }) {
    const [open, setOpen] = useState(false);
    const [sortBy, setSortBy] = useState('');
    const [rows, setRows] = useState(() => (INITIAL[title] ?? []).map(r => [...r]));
    const [detailIdx, setDetailIdx] = useState(null);
    const [strukIdx, setStrukIdx] = useState(null);
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const sorted = sortRows(title, rows, sortBy);
    const cfg = editConfig[title] ?? { readonly: [], selects: {} };
    const head = headers[title] ?? [];
    function startEdit(rowIdx) { setEditing(rowIdx); setDraft([...rows[rowIdx]]); }
    function saveEdit() { setRows(prev => prev.map((r, i) => i === editing ? draft : r)); setEditing(null); setDraft(null); toast.success('Data berhasil diperbarui.'); }
    function confirmDelete() { setRows(prev => prev.filter((_, i) => i !== deleting)); setDeleting(null); toast.success('Data berhasil dihapus.'); }
    const nameOf = (i) => rows[i]?.[0] ?? 'Data ini';
    return <div className="flex flex-col gap-5"><PageHeader eyebrow={eyebrows[title] ?? 'MODULE'} title={title} description={description}>{addLabel && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button />}><Plus data-icon="inline-start"/>{addLabel}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{addLabel}</DialogTitle><DialogDescription>Lengkapi informasi berikut untuk menyimpan data.</DialogDescription></DialogHeader><FieldGroup><Field><FieldLabel>Nama</FieldLabel><Input placeholder="Masukkan nama..." required/></Field><Field><FieldLabel>Keterangan</FieldLabel><Input placeholder="Masukkan keterangan..."/></Field></FieldGroup><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={() => { toast.success('Data berhasil disimpan.'); setOpen(false); }}>Simpan</Button></DialogFooter></DialogContent></Dialog>}</PageHeader>
    <div className="table-surface">
      <div className="flex flex-col gap-3 border-b border-border p-3.5 sm:flex-row sm:items-center"><div className="input-with-icon min-w-0 flex-1"><Search className="size-4"/><Input className="pl-10" placeholder={`Cari ${title.toLowerCase()}...`}/></div>{title === 'Transaksi' && <><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="h-10 w-fit min-w-[180px] bg-card"><SelectValue placeholder="Urutkan..."/></SelectTrigger><SelectContent><SelectGroup>{transactionSorts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectGroup></SelectContent></Select><Button variant="outline"><Download data-icon="inline-start"/>Unduh CSV</Button></>}</div>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border">{head.map(h => <th key={h} className="px-3.5 py-2.5 text-left font-medium uppercase tracking-wide">{h}</th>)}<th className="px-3.5 py-2.5 text-right font-medium uppercase tracking-wide">Aksi</th></tr></thead><tbody>{sorted.map((r) => { const idx = rows.indexOf(r); return <tr key={idx} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">{r.map((c, j) => {
                    const last = j === r.length - 1;
                    return <td key={j} className="px-3.5 py-3.5 align-middle">{last ? statusPill(c) : <CellContent title={title} c={c} j={j}/>}</td>;
                })}<td className="px-3.5 py-3.5 text-right"><DropdownMenu><DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-open:bg-accent"><MoreHorizontal/><span className="sr-only">Aksi</span></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44 p-1.5"><DropdownMenuItem className="h-9" onClick={() => setDetailIdx(idx)}><Eye className="size-4 text-muted-foreground"/>Lihat Detail</DropdownMenuItem>{title === 'Transaksi' ? <DropdownMenuItem className="h-9" onClick={() => setStrukIdx(idx)}><Printer className="size-4 text-muted-foreground"/>Cetak Struk</DropdownMenuItem> : <><DropdownMenuItem className="h-9" onClick={() => startEdit(idx)}><Pencil className="size-4 text-muted-foreground"/>Edit</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem variant="destructive" className="h-9 text-red-500" onClick={() => setDeleting(idx)}><Trash2 className="size-4 text-red-500"/>Hapus</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu></td></tr>; })}</tbody></table></div>
      {!rows.length && <p className="py-16 text-center text-muted-foreground">Belum ada data {title.toLowerCase()}.</p>}
    </div>
    {detailIdx !== null && <DetailSheet title={title} row={rows[detailIdx]} open onClose={() => setDetailIdx(null)}/>}
    {strukIdx !== null && <StrukSheet row={rows[strukIdx]} open onClose={() => setStrukIdx(null)}/>}
    {editing !== null && draft && <Dialog open onOpenChange={o => { if (!o) { setEditing(null); setDraft(null); } }}><DialogContent><DialogHeader><DialogTitle>Edit {title}</DialogTitle><DialogDescription>Perbarui informasi lalu simpan perubahan.</DialogDescription></DialogHeader><FieldGroup>{head.map((h, j) => { const opts = cfg.selects[j]; const ro = cfg.readonly.includes(j); return <Field key={h}><FieldLabel>{h}</FieldLabel>{opts ? <Select value={draft[j]} onValueChange={v => setDraft(d => d.map((x, k) => k === j ? v : x))}><SelectTrigger className="h-11 w-full bg-card"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectGroup></SelectContent></Select> : <Input className="h-11" disabled={ro} value={draft[j]} onChange={e => setDraft(d => d.map((x, k) => k === j ? e.target.value : x))}/>}</Field>; })}</FieldGroup><DialogFooter><Button variant="outline" onClick={() => { setEditing(null); setDraft(null); }}>Batal</Button><Button onClick={saveEdit}>Simpan Perubahan</Button></DialogFooter></DialogContent></Dialog>}
    {deleting !== null && <Dialog open onOpenChange={o => { if (!o) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Hapus {title}</DialogTitle><DialogDescription>Hapus <strong className="text-foreground">{nameOf(deleting)}</strong> secara permanen? Tindakan ini tidak bisa dibatalkan.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Batal</Button><Button onClick={confirmDelete}><Trash2 data-icon="inline-start"/>Hapus</Button></DialogFooter></DialogContent></Dialog>}
  </div>;
}