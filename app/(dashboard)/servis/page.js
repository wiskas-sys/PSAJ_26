'use client';
import { useEffect, useState } from 'react';
import { BadgeCheck, Clock3, Plus, Trash2, Wrench, Zap } from 'lucide-react';
import { getProducts, nextServiceCode, todayISO } from '@/lib/demo-data';
import { applyPartDelta, totalParts } from '@/lib/service-parts';
import { subscribeStock } from '@/lib/stock-store';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STATUS = ['Menunggu', 'Dikerjakan', 'Selesai'];
const SERVICES_KEY = 'dian-motor-services';
const emptyOrder = () => ({ id: '', customer: '', phone: '', plate: '', brand: '', job: '', status: 'Menunggu', progress: 0, eta: '—', parts: [] });

function readServices() {
    try {
        const raw = window.localStorage.getItem(SERVICES_KEY);
        const list = !raw ? SEED_SERVICES : JSON.parse(raw);
        return Array.isArray(list) ? list : SEED_SERVICES;
    }
    catch { return SEED_SERVICES; }
}
function writeServices(list) {
    try { window.localStorage.setItem(SERVICES_KEY, JSON.stringify(list)); } catch {}
}

const SEED_SERVICES = [
    { id: 'SRV-260827-012', customer: 'Budi Santoso', phone: '0812-3456-7890', plate: 'B 4123 KLM', brand: 'Honda Vario 125', job: 'Ganti oli & tune up', status: 'Dikerjakan', progress: 65, eta: '16.30', parts: [] },
    { id: 'SRV-260827-011', customer: 'Andi Pratama', phone: '0813-8877-2211', plate: 'B 9081 PQR', brand: 'Yamaha NMAX', job: 'Perbaikan rem depan', status: 'Menunggu', progress: 20, eta: '17.00', parts: [] },
    { id: 'SRV-260826-010', customer: 'Siti Aminah', phone: '0821-8855-4422', plate: 'F 2281 AA', brand: 'Suzuki Address', job: 'Servis berkala 10.000 km', status: 'Selesai', progress: 100, eta: '—', parts: [] },
    { id: 'SRV-260826-009', customer: 'Dedi Kurnia', phone: '0856-1122-3344', plate: 'B 6054 XYZ', brand: 'Honda Beat', job: 'Penggantian aki & busi', status: 'Dikerjakan', progress: 45, eta: '17.20', parts: [] },
];

function PartsEditor({ parts, catalog, onChange }) {
    return <div className="rounded-xl border border-border bg-muted/50 p-3">
        <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold">Sparepart Dipakai</p>
            <Select value={null} onValueChange={v => {
                const p = catalog.find(x => x.id === v);
                if (!p) return;
                const existing = parts.findIndex(x => x.productId === p.id);
                onChange(existing === -1 ? [...parts, { productId: p.id, productCode: p.code, productName: p.name, unit: p.unit, quantity: 1 }] : parts.map((x, k) => k === existing ? { ...x, quantity: x.quantity + 1 } : x));
            }}>
                <SelectTrigger className="h-9 w-48 bg-card"><SelectValue placeholder="Tambah sparepart..."/></SelectTrigger>
                <SelectContent><SelectGroup>{catalog.filter(p => p.stock > 0).map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name} ({p.stock} {p.unit})</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
        </div>
        {parts.length > 0
            ? <ul className="mt-3 grid gap-2">{parts.map((part, i) => <li key={`${part.productId}-${i}`} className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-2">
                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{part.productName}</p><p className="font-mono text-[10px] text-muted-foreground">{part.productCode}</p></div>
                <Input type="number" min="1" value={part.quantity} onChange={e => onChange(parts.map((x, k) => k === i ? { ...x, quantity: Math.max(1, Math.trunc(Number(e.target.value) || 1)) } : x))} className="h-8 w-16 text-right" aria-label={`Jumlah ${part.productName}`}/>
                <small className="text-[11px] text-muted-foreground">{part.unit}</small>
                <button type="button" onClick={() => onChange(parts.filter((_, k) => k !== i))} className="text-red-500 hover:text-red-400" aria-label={`Hapus ${part.productName}`}><Trash2 className="size-3.5"/></button>
            </li>)}</ul>
            : <p className="mt-2 text-[11px] text-muted-foreground">Belum ada sparepart. Stok dipotong saat servis disimpan.</p>}
    </div>;
}

export default function Page() {
    const [orders, setOrders] = useState(() => SEED_SERVICES.map(o => ({ ...o })));
    const [catalog, setCatalog] = useState(() => getProducts());
    const [createOpen, setCreateOpen] = useState(false);
    const [draft, setDraft] = useState(() => emptyOrder());
    const [editIdx, setEditIdx] = useState(null);
    const [editDraft, setEditDraft] = useState(() => emptyOrder());
    const [detailIdx, setDetailIdx] = useState(null);
    const [deleteIdx, setDeleteIdx] = useState(null);
    useEffect(() => {
        setOrders(readServices());
        const off = subscribeStock(() => setCatalog(getProducts()));
        return off;
    }, []);
    const stats = [['Total Servis', String(orders.length), 'minggu ini', Wrench], ['Sedang Dikerjakan', String(orders.filter(o => o.status === 'Dikerjakan').length), 'di service bay', Zap], ['Menunggu', String(orders.filter(o => o.status === 'Menunggu').length), 'antrian masuk', Clock3], ['Selesai', String(orders.filter(o => o.status === 'Selesai').length), 'bulan ini', BadgeCheck]];
    function commitParts(service, before, after) {
        const result = applyPartDelta(service, before, after);
        if (!result.ok) {
            toast.error(result.error);
            const s = result.short?.[0];
            if (s) toast.error(`${s.name}: butuh ${s.want}, tersedia ${s.have}.`);
            return false;
        }
        return true;
    }
    function persist(next) {
        writeServices(next);
        setOrders(next);
        setCatalog(getProducts());
    }
    function saveCreate() {
        if (!draft.customer.trim() || !draft.job.trim())
            return toast.error('Pelanggan dan jenis servis wajib diisi.');
        const service = { ...draft, id: nextServiceCode(todayISO(), readServices()) };
        if (!commitParts(service, [], service.parts)) return;
        persist([service, ...readServices()]);
        toast.success('Servis baru berhasil dicatat.');
        setCreateOpen(false);
        setDraft(emptyOrder());
    }
    function saveEdit() {
        const current = readServices();
        const target = current[editIdx];
        if (!target) { setEditIdx(null); return; }
        const updated = { ...editDraft, id: target.id };
        if (!commitParts(updated, target.parts, updated.parts)) return;
        persist(current.map((o, i) => i === editIdx ? updated : o));
        toast.success(totalParts(updated.parts) > totalParts(target.parts) ? 'Servis diperbarui, stok sparepart dipotong.' : 'Servis diperbarui.');
        setEditIdx(null);
    }
    function confirmDelete() {
        const current = readServices();
        const removed = current[deleteIdx];
        persist(current.filter((_, i) => i !== deleteIdx));
        if (totalParts(removed?.parts)) toast.success('Servis dibatalkan. Sparepart yang sudah terpakai tidak otomatis kembali, catat lewat Barang Masuk bila perlu.');
        else toast.success('Servis dibatalkan.');
        setDeleteIdx(null);
    }
    const tag = (s) => s === 'Selesai' ? 'stock-chip' : s === 'Dikerjakan' ? 'stock-chip low' : 'stock-chip';
    return <div className="flex flex-col gap-5"><PageHeader title="Servis" description="Pantau pekerjaan bengkel dari masuk hingga diambil."> <Button onClick={() => setCreateOpen(true)}><Plus data-icon="inline-start"/>Catat Servis</Button></PageHeader>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note, Icon]) => <div key={label} className="metric-card"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5"/></span></div><strong className="mt-1 block text-2xl font-bold">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}</section>
    <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{orders.map((o, i) => <div key={o.id} className="surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] text-muted-foreground">{o.id}</p><h2 className="mt-1 text-[15px] font-bold">{o.job}</h2></div><span className={tag(o.status)}>{o.status.toUpperCase()}</span></div><div className="mt-3 rounded-xl bg-muted p-3"><div className="flex justify-between"><span className="font-mono text-[11px]">{o.plate}</span><small className="text-muted-foreground">{o.brand}</small></div><p className="mt-1 text-sm font-semibold">{o.customer}</p><small className="font-mono text-[10px] text-muted-foreground">{o.phone}</small></div><div className="mt-3 flex justify-between text-xs"><span className="text-muted-foreground">Estimasi selesai</span><strong className="font-mono">{o.eta} WIB</strong></div><div className="progress-track mt-2"><span style={{ width: `${o.progress}%` }}/></div>{(o.parts?.length ?? 0) > 0 && <p className="mt-2 flex flex-wrap gap-1">{o.parts.map(p => <span key={`${p.productId}-${p.productName}`} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{p.quantity}× {p.productCode}</span>)}</p>}<div className="mt-4 flex justify-end gap-2"><Button variant={o.status === 'Selesai' ? 'outline' : 'default'} size="sm" onClick={() => { setEditIdx(i); setEditDraft({ ...o }); }}>{o.status === 'Selesai' ? 'Detail' : 'Perbarui Servis'}</Button><Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => setDeleteIdx(i)}><Trash2 data-icon="inline-start"/>Batal</Button></div></div>)}</section>
    <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) setDraft(emptyOrder()); }}><DialogContent><DialogHeader><DialogTitle>Catat Servis Baru</DialogTitle><DialogDescription>Masukkan detail kendaraan dan pekerjaan.</DialogDescription></DialogHeader><FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Nama Pelanggan</FieldLabel><Input value={draft.customer} onChange={e => setDraft(d => ({ ...d, customer: e.target.value }))} placeholder="Nama pelanggan"/></Field><Field><FieldLabel>Nomor Telepon</FieldLabel><Input value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="08xx-xxxx-xxxx"/></Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Plat Nomor</FieldLabel><Input value={draft.plate} onChange={e => setDraft(d => ({ ...d, plate: e.target.value }))} placeholder="B 1234 XYZ"/></Field><Field><FieldLabel>Merk &amp; Tipe</FieldLabel><Input value={draft.brand} onChange={e => setDraft(d => ({ ...d, brand: e.target.value }))} placeholder="Honda Vario 125"/></Field></div>
        <Field><FieldLabel>Jenis Servis</FieldLabel><Input value={draft.job} onChange={e => setDraft(d => ({ ...d, job: e.target.value }))} placeholder="Ganti oli, tune up, dsb."/></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Status</FieldLabel><Select value={draft.status} onValueChange={v => setDraft(d => ({ ...d, status: v }))}><SelectTrigger className="h-11 w-full bg-card"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel>Estimasi Selesai (jam)</FieldLabel><Input value={draft.eta} onChange={e => setDraft(d => ({ ...d, eta: e.target.value }))} placeholder="17.00"/></Field></div>
        <PartsEditor parts={draft.parts} catalog={catalog} onChange={parts => setDraft(d => ({ ...d, parts }))}/>
    </FieldGroup><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button><Button onClick={saveCreate}>Simpan Servis</Button></DialogFooter></DialogContent></Dialog>
    {editIdx !== null && <Dialog open onOpenChange={o => { if (!o) setEditIdx(null); }}><DialogContent><DialogHeader><DialogTitle>Perbarui Servis</DialogTitle><DialogDescription>{editDraft.id} · {editDraft.job}</DialogDescription></DialogHeader><FieldGroup>
        <Field><FieldLabel>Status</FieldLabel><Select value={editDraft.status} onValueChange={v => setEditDraft(d => ({ ...d, status: v }))}><SelectTrigger className="h-11 w-full bg-card"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
        <Field><FieldLabel>Progress ({editDraft.progress}%)</FieldLabel><div className="flex items-center gap-2"><input type="range" min="0" max="100" step="5" value={editDraft.progress} onChange={e => setEditDraft(d => ({ ...d, progress: Number(e.target.value) }))} className="h-2 flex-1 accent-[#dc2626]"/><Input type="number" min="0" max="100" value={editDraft.progress} onChange={e => setEditDraft(d => ({ ...d, progress: Number(e.target.value) }))} className="h-9 w-20 text-center"/></div></Field>
        <Field><FieldLabel>Estimasi Selesai</FieldLabel><Input value={editDraft.eta} onChange={e => setEditDraft(d => ({ ...d, eta: e.target.value }))}/></Field>
        <PartsEditor parts={editDraft.parts ?? []} catalog={catalog} onChange={parts => setEditDraft(d => ({ ...d, parts }))}/>
        {(editDraft.parts?.length ?? 0) > 0 && <p className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">Menambah quantity akan memotong stok lagi; mengurangi atau menghapus mengembalikan stok sebagai koreksi. Mengubah status dan progress tidak menyentuh stok.</p>}
    </FieldGroup><DialogFooter><Button variant="outline" onClick={() => setEditIdx(null)}>Batal</Button><Button onClick={saveEdit}>Simpan Perubahan</Button></DialogFooter></DialogContent></Dialog>}
    {detailIdx !== null && <Sheet open onOpenChange={o => { if (!o) setDetailIdx(null); }}><SheetContent side="right"><SheetHeader><SheetTitle>Detail Servis</SheetTitle><SheetDescription>{orders[detailIdx]?.id} · {orders[detailIdx]?.status}</SheetDescription></SheetHeader><div className="grid gap-2 px-4">{[['Pelanggan', orders[detailIdx]?.customer], ['Telepon', orders[detailIdx]?.phone], ['Kendaraan', `${orders[detailIdx]?.plate} · ${orders[detailIdx]?.brand}`], ['Jenis Servis', orders[detailIdx]?.job], ['Progress', `${orders[detailIdx]?.progress}%`], ['Estimasi Selesai', `${orders[detailIdx]?.eta} WIB`], ['Sparepart Dipakai', (orders[detailIdx]?.parts?.length ?? 0) ? orders[detailIdx].parts.map(p => `${p.quantity}× ${p.productName}`).join(', ') : 'Tidak ada']].map(([k, v]) => <div key={k} className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-2 text-sm last:border-0"><span className="text-muted-foreground">{k}</span><strong className="text-right text-[13px]">{v}</strong></div>)}</div></SheetContent></Sheet>}
    {deleteIdx !== null && <Dialog open onOpenChange={o => { if (!o) setDeleteIdx(null); }}><DialogContent><DialogHeader><DialogTitle>Batalkan Servis</DialogTitle><DialogDescription>Hapus servis <strong className="text-foreground">{orders[deleteIdx]?.job}</strong> milik {orders[deleteIdx]?.customer} dari daftar?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteIdx(null)}>Tidak</Button><Button onClick={confirmDelete}><Trash2 data-icon="inline-start"/>Ya, Batalkan</Button></DialogFooter></DialogContent></Dialog>}
  </div>;
}