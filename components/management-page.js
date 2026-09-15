'use client';
import { useState } from 'react';
import { Download, MoreHorizontal, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';

const datasets = {
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

export function ManagementPage({ title, description, addLabel }) {
    const [open, setOpen] = useState(false);
    const rows = datasets[title] ?? [];
    return <div className="flex flex-col gap-5"><PageHeader eyebrow={eyebrows[title] ?? 'MODULE'} title={title} description={description}>{addLabel && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button />}><Plus data-icon="inline-start"/>{addLabel}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{addLabel}</DialogTitle><DialogDescription>Lengkapi informasi berikut untuk menyimpan data.</DialogDescription></DialogHeader><FieldGroup><Field><FieldLabel>Nama</FieldLabel><Input placeholder="Masukkan nama..." required/></Field><Field><FieldLabel>Keterangan</FieldLabel><Input placeholder="Masukkan keterangan..."/></Field></FieldGroup><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={() => { toast.success('Data berhasil disimpan.'); setOpen(false); }}>Simpan</Button></DialogFooter></DialogContent></Dialog>}</PageHeader>
    <div className="table-surface">
      <div className="flex flex-col gap-3 border-b border-border p-3.5 sm:flex-row sm:items-center"><div className="input-with-icon min-w-0 flex-1"><Search className="size-4"/><Input className="pl-10" placeholder={`Cari ${title.toLowerCase()}...`}/></div>{title === 'Transaksi' && <Button variant="outline"><Download data-icon="inline-start"/>Unduh CSV</Button>}</div>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-border">{(headers[title] ?? []).map(h => <th key={h} className="px-3.5 py-2.5 text-left font-medium uppercase tracking-wide">{h}</th>)}<th className="px-3.5 py-2.5 text-right font-medium uppercase tracking-wide">Aksi</th></tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">{r.map((c, j) => {
            const last = j === r.length - 1;
            return <td key={j} className="px-3.5 py-3.5 align-middle">{last ? statusPill(c) : <CellContent title={title} c={c} j={j}/>}</td>;
        })}<td className="px-3.5 py-3.5 text-right"><Button variant="ghost" size="icon-sm"><MoreHorizontal /><span className="sr-only">Aksi</span></Button></td></tr>)}</tbody></table></div>
      {!rows.length && <p className="py-16 text-center text-muted-foreground">Belum ada data {title.toLowerCase()}.</p>}
    </div>
  </div>;
}