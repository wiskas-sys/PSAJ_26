'use client';
import { useState } from 'react';
import { BadgeCheck, Clock3, Plus, Trash2, Wrench, Zap } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STATUS = ['Menunggu', 'Dikerjakan', 'Selesai'];
const emptyOrder = () => ({ id: '', customer: '', phone: '', plate: '', brand: '', job: '', status: 'Menunggu', progress: 0, eta: '—' });

export default function Page() {
    const [orders, setOrders] = useState([
        { id: 'SRV-260827-012', customer: 'Budi Santoso', phone: '0812-3456-7890', plate: 'B 4123 KLM', brand: 'Honda Vario 125', job: 'Ganti oli & tune up', status: 'Dikerjakan', progress: 65, eta: '16.30' },
        { id: 'SRV-260827-011', customer: 'Andi Pratama', phone: '0813-8877-2211', plate: 'B 9081 PQR', brand: 'Yamaha NMAX', job: 'Perbaikan rem depan', status: 'Menunggu', progress: 20, eta: '17.00' },
        { id: 'SRV-260826-010', customer: 'Siti Aminah', phone: '0821-8855-4422', plate: 'F 2281 AA', brand: 'Suzuki Address', job: 'Servis berkala 10.000 km', status: 'Selesai', progress: 100, eta: '—' },
        { id: 'SRV-260826-009', customer: 'Dedi Kurnia', phone: '0856-1122-3344', plate: 'B 6054 XYZ', brand: 'Honda Beat', job: 'Penggantian aki & busi', status: 'Dikerjakan', progress: 45, eta: '17.20' },
    ]);
    const [createOpen, setCreateOpen] = useState(false);
    const [draft, setDraft] = useState(() => emptyOrder());
    const [editIdx, setEditIdx] = useState(null);
    const [editDraft, setEditDraft] = useState(() => emptyOrder());
    const [detailIdx, setDetailIdx] = useState(null);
    const [deleteIdx, setDeleteIdx] = useState(null);
    const stats = [['Total Servis', String(orders.length), 'minggu ini', Wrench], ['Sedang Dikerjakan', String(orders.filter(o => o.status === 'Dikerjakan').length), 'di service bay', Zap], ['Menunggu', String(orders.filter(o => o.status === 'Menunggu').length), 'antrian masuk', Clock3], ['Selesai', String(orders.filter(o => o.status === 'Selesai').length), 'bulan ini', BadgeCheck]];
    function saveCreate() {
        if (!draft.customer.trim() || !draft.job.trim())
            return toast.error('Pelanggan dan jenis servis wajib diisi.');
        const d = { ...draft, id: `SRV-${Date.now().toString().slice(-9)}` };
        setOrders(prev => [d, ...prev]);
        toast.success('Servis baru berhasil dicatat.');
        setCreateOpen(false);
        setDraft(emptyOrder());
    }
    function saveEdit() {
        setOrders(prev => prev.map((o, i) => i === editIdx ? { ...editDraft } : o));
        toast.success('Servis diperbarui.');
        setEditIdx(null);
    }
    function confirmDelete() {
        setOrders(prev => prev.filter((_, i) => i !== deleteIdx));
        toast.success('Servis dibatalkan.');
        setDeleteIdx(null);
    }
    const tag = (s) => s === 'Selesai' ? 'stock-chip' : s === 'Dikerjakan' ? 'stock-chip low' : 'stock-chip';
    return <div className="flex flex-col gap-5"><PageHeader title="Servis" description="Pantau pekerjaan bengkel dari masuk hingga diambil."> <Button onClick={() => setCreateOpen(true)}><Plus data-icon="inline-start"/>Catat Servis</Button></PageHeader>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note, Icon]) => <div key={label} className="metric-card"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5"/></span></div><strong className="mt-1 block text-2xl font-bold">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</section>
    <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{orders.map((o, i) => <div key={o.id} className="surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] text-muted-foreground">{o.id}</p><h2 className="mt-1 text-[15px] font-bold">{o.job}</h2></div><span className={tag(o.status)}>{o.status.toUpperCase()}</span></div><div className="mt-3 rounded-xl bg-muted p-3"><div className="flex justify-between"><span className="font-mono text-[11px]">{o.plate}</span><small className="text-muted-foreground">{o.brand}</small></div><p className="mt-1 text-sm font-semibold">{o.customer}</p><small className="font-mono text-[10px] text-muted-foreground">{o.phone}</small></div><div className="mt-3 flex justify-between text-xs"><span className="text-muted-foreground">Estimasi selesai</span><strong className="font-mono">{o.eta} WIB</strong></div><div className="progress-track mt-2"><span style={{ width: `${o.progress}%` }}/></div><div className="mt-4 flex justify-end gap-2"><Button variant={o.status === 'Selesai' ? 'outline' : 'default'} size="sm" onClick={() => { setEditIdx(i); setEditDraft({ ...o }); }}>{o.status === 'Selesai' ? 'Detail' : 'Perbarui Servis'}</Button><Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => setDeleteIdx(i)}><Trash2 data-icon="inline-start"/>Batal</Button></div></div>)}</section>
    <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) setDraft(emptyOrder()); }}><DialogContent><DialogHeader><DialogTitle>Catat Servis Baru</DialogTitle><DialogDescription>Masukkan detail kendaraan dan pekerjaan.</DialogDescription></DialogHeader><FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Nama Pelanggan</FieldLabel><Input value={draft.customer} onChange={e => setDraft(d => ({ ...d, customer: e.target.value }))} placeholder="Nama pelanggan"/></Field><Field><FieldLabel>Nomor Telepon</FieldLabel><Input value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="08xx-xxxx-xxxx"/></Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Plat Nomor</FieldLabel><Input value={draft.plate} onChange={e => setDraft(d => ({ ...d, plate: e.target.value }))} placeholder="B 1234 XYZ"/></Field><Field><FieldLabel>Merk &amp; Tipe</FieldLabel><Input value={draft.brand} onChange={e => setDraft(d => ({ ...d, brand: e.target.value }))} placeholder="Honda Vario 125"/></Field></div>
        <Field><FieldLabel>Jenis Servis</FieldLabel><Input value={draft.job} onChange={e => setDraft(d => ({ ...d, job: e.target.value }))} placeholder="Ganti oli, tune up, dsb."/></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Status</FieldLabel><Select value={draft.status} onValueChange={v => setDraft(d => ({ ...d, status: v }))}><SelectTrigger className="h-11 w-full bg-card"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel>Estimasi Selesai (jam)</FieldLabel><Input value={draft.eta} onChange={e => setDraft(d => ({ ...d, eta: e.target.value }))} placeholder="17.00"/></Field></div>
    </FieldGroup><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button><Button onClick={saveCreate}>Simpan Servis</Button></DialogFooter></DialogContent></Dialog>
    {editIdx !== null && <Dialog open onOpenChange={o => { if (!o) setEditIdx(null); }}><DialogContent><DialogHeader><DialogTitle>Perbarui Servis</DialogTitle><DialogDescription>{editDraft.id} · {editDraft.job}</DialogDescription></DialogHeader><FieldGroup>
        <Field><FieldLabel>Status</FieldLabel><Select value={editDraft.status} onValueChange={v => setEditDraft(d => ({ ...d, status: v }))}><SelectTrigger className="h-11 w-full bg-card"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
        <Field><FieldLabel>Progress ({editDraft.progress}%)</FieldLabel><div className="flex items-center gap-2"><input type="range" min="0" max="100" step="5" value={editDraft.progress} onChange={e => setEditDraft(d => ({ ...d, progress: Number(e.target.value) }))} className="h-2 flex-1 accent-[#dc2626]"/><Input type="number" min="0" max="100" value={editDraft.progress} onChange={e => setEditDraft(d => ({ ...d, progress: Number(e.target.value) }))} className="h-9 w-20 text-center"/></div></Field>
        <Field><FieldLabel>Estimasi Selesai</FieldLabel><Input value={editDraft.eta} onChange={e => setEditDraft(d => ({ ...d, eta: e.target.value }))}/></Field>
    </FieldGroup><DialogFooter><Button variant="outline" onClick={() => setEditIdx(null)}>Batal</Button><Button onClick={saveEdit}>Simpan Perubahan</Button></DialogFooter></DialogContent></Dialog>}
    {detailIdx !== null && <Sheet open onOpenChange={o => { if (!o) setDetailIdx(null); }}><SheetContent side="right"><SheetHeader><SheetTitle>Detail Servis</SheetTitle><SheetDescription>{orders[detailIdx]?.id} · {orders[detailIdx]?.status}</SheetDescription></SheetHeader><div className="grid gap-2 px-4">{[['Pelanggan', orders[detailIdx]?.customer], ['Telepon', orders[detailIdx]?.phone], ['Kendaraan', `${orders[detailIdx]?.plate} · ${orders[detailIdx]?.brand}`], ['Jenis Servis', orders[detailIdx]?.job], ['Progress', `${orders[detailIdx]?.progress}%`], ['Estimasi Selesai', `${orders[detailIdx]?.eta} WIB`]].map(([k, v]) => <div key={k} className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-2 text-sm last:border-0"><span className="text-muted-foreground">{k}</span><strong className="text-right text-[13px]">{v}</strong></div>)}</div></SheetContent></Sheet>}
    {deleteIdx !== null && <Dialog open onOpenChange={o => { if (!o) setDeleteIdx(null); }}><DialogContent><DialogHeader><DialogTitle>Batalkan Servis</DialogTitle><DialogDescription>Hapus servis <strong className="text-foreground">{orders[deleteIdx]?.job}</strong> milik {orders[deleteIdx]?.customer} dari daftar?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteIdx(null)}>Tidak</Button><Button onClick={confirmDelete}><Trash2 data-icon="inline-start"/>Ya, Batalkan</Button></DialogFooter></DialogContent></Dialog>}
  </div>;
}