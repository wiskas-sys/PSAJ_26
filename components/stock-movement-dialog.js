'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, PackageCheck, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { outReasons, parseNumber, rupiah, stockStatus, suppliers, todayISO } from '@/lib/demo-data';
import { recordMovement } from '@/lib/stock-store';
import { fieldErrors, movementSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const emptyDraft = (type) => ({ productId: '', type, quantity: '1', date: todayISO(), reference: '', party: '', notes: '' });

export function StockMovementDialog({ open, onOpenChange, products, initial, onDone }) {
    const [draft, setDraft] = useState(() => ({ ...emptyDraft(initial?.type), productId: initial?.productId ?? '', party: initial?.type === 'IN' ? '' : 'Penjualan' }));
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState(false);
    useEffect(() => {
        if (!open) return;
        setDraft({ ...emptyDraft(initial?.type), productId: initial?.productId ?? '', party: initial?.type === 'IN' ? '' : 'Penjualan' });
        setErrors({});
        setTouched(false);
    }, [open, initial?.productId, initial?.type]);
    const set = (patch) => setDraft(d => ({ ...d, ...patch }));
    const product = useMemo(() => products.find(p => p.id === draft.productId) ?? null, [products, draft.productId]);
    const qty = parseNumber(draft.quantity);
    const incoming = draft.type === 'IN';
    const after = product ? (incoming ? product.stock + qty : Math.max(0, product.stock - qty)) : 0;
    const overdraw = !incoming && product && qty > product.stock;
    const partyOptions = incoming ? suppliers : outReasons;
    const Icon = incoming ? ArrowDownToLine : ArrowUpFromLine;
    const submit = (e) => {
        e.preventDefault();
        setTouched(true);
        const parsed = movementSchema.safeParse(draft);
        if (!parsed.success) { setErrors(fieldErrors(parsed)); return toast.error('Periksa kembali isian formulir.'); }
        const result = recordMovement(parsed.data);
        if (!result.ok) return toast.error(result.error);
        toast.success(`${product.code} ${incoming ? 'bertambah' : 'berkurang'} ${qty} ${product.unit}.`);
        onOpenChange(false);
        onDone?.(result);
    };
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Catat Barang {incoming ? 'Masuk' : 'Keluar'}</DialogTitle><DialogDescription>Setiap penyimpanan langsung memperbarui stok dan mencatat riwayat mutasi.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted p-1" role="group" aria-label="Jenis mutasi">
                {['IN', 'OUT'].map(v => { const on = draft.type === v; const Glyph = v === 'IN' ? ArrowDownToLine : ArrowUpFromLine; return <button key={v} type="button" onClick={() => set({ type: v, party: v === 'OUT' ? 'Penjualan' : '' })} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-bold transition-colors ${on ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Glyph className="size-4"/>{v === 'IN' ? 'Barang Masuk' : 'Barang Keluar'}</button>; })}
            </div>
            <FieldGroup className="gap-4">
                <Field data-invalid={!!errors.productId}><FieldLabel>Produk</FieldLabel><Select value={draft.productId || null} onValueChange={v => set({ productId: v })}><SelectTrigger className="h-11 w-full bg-card" aria-invalid={!!errors.productId}><SelectValue placeholder="Pilih barang..."/></SelectTrigger><SelectContent><SelectGroup>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name} ({p.stock} {p.unit})</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{errors.productId}</FieldError></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.quantity}><FieldLabel htmlFor="mv-qty">Jumlah</FieldLabel><Input id="mv-qty" type="number" min="1" value={draft.quantity} onChange={e => set({ quantity: e.target.value })} className="h-11" aria-invalid={!!errors.quantity}/><FieldError>{errors.quantity}</FieldError></Field>
                    <Field><FieldLabel htmlFor="mv-unit">Satuan</FieldLabel><Input id="mv-unit" value={product?.unit ?? '-'} disabled className="h-11"/></Field>
                </div>
                {overdraw && <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2.5 text-xs text-red-600 dark:text-red-400"><TriangleAlert className="mt-0.5 size-4 shrink-0"/>Stok tidak mencukupi. Tersedia {product.stock} {product.unit}.</p>}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.date}><FieldLabel htmlFor="mv-date">Tanggal</FieldLabel><Input id="mv-date" type="date" value={draft.date} onChange={e => set({ date: e.target.value })} className="h-11" aria-invalid={!!errors.date}/><FieldError>{errors.date}</FieldError></Field>
                    <Field data-invalid={!!errors.reference}><FieldLabel htmlFor="mv-ref">No. Referensi</FieldLabel><Input id="mv-ref" value={draft.reference} onChange={e => set({ reference: e.target.value })} placeholder={incoming ? 'INV-8821' : 'TRX-260827-018'} className="h-11"/><FieldDescription>Nomor faktur, PO, atau dokumen.</FieldDescription></Field>
                </div>
                <Field data-invalid={!!errors.party}><FieldLabel>{incoming ? 'Supplier' : 'Jenis Penggunaan'}</FieldLabel><Select value={draft.party || null} onValueChange={v => set({ party: v })}><SelectTrigger className="h-11 w-full bg-card" aria-invalid={!!errors.party}><SelectValue placeholder={incoming ? 'Pilih supplier...' : 'Pilih jenis penggunaan...'}/></SelectTrigger><SelectContent><SelectGroup>{partyOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldDescription>{incoming ? 'Kosongkan bila tidak ada supplier.' : 'Alasan barang keluar dari stok.'}</FieldDescription><FieldError>{errors.party}</FieldError></Field>
                <Field data-invalid={!!errors.notes}><FieldLabel htmlFor="mv-notes">Catatan</FieldLabel><Textarea id="mv-notes" value={draft.notes} onChange={e => set({ notes: e.target.value })} placeholder="Keterangan tambahan bila diperlukan..." rows={2}/><FieldError>{errors.notes}</FieldError></Field>
            </FieldGroup>
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
                {!product ? <p className="text-xs text-muted-foreground">Pilih barang untuk melihat dampak stok.</p> : <div className="grid gap-3">
                    <div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><PackageCheck className="size-4"/></span><div className="min-w-0"><p className="truncate font-mono text-[10px] text-muted-foreground">{product.code}</p><p className="truncate text-[13px] font-semibold">{product.name}</p></div><span className={`stock-chip ml-auto ${stockStatus(after, product.minimumStock) === 'Stok Aman' ? '' : stockStatus(after, product.minimumStock) === 'Stok Habis' ? 'out' : 'low'}`}>{stockStatus(after, product.minimumStock)}</span></div>
                    <div className="grid grid-cols-3 gap-2 border-t border-dashed border-border pt-3 text-center">
                        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sebelum</p><p className="mt-0.5 text-lg font-bold tracking-[-.02em]">{product.stock}<small className="ml-1 text-[11px] font-normal text-muted-foreground">{product.unit}</small></p></div>
                        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Perubahan</p><p className={`mt-0.5 text-lg font-bold tracking-[-.02em] ${incoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{incoming ? '+' : '-'}{qty}</p></div>
                        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sesudah</p><p className="mt-0.5 text-lg font-bold tracking-[-.02em]">{after}<small className="ml-1 text-[11px] font-normal text-muted-foreground">{product.unit}</small></p></div>
                    </div>
                    <p className="border-t border-dashed border-border pt-3 text-center text-xs text-muted-foreground">Perubahan nilai persediaan {incoming ? '+' : '-'}{rupiah(qty * product.purchasePrice)}</p>
                </div>}
            </div>
            {touched && Object.keys(errors).length > 0 && <FieldError>Beberapa isian belum sesuai. Periksa tanda merah di atas.</FieldError>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit" disabled={!product || overdraw}><Icon data-icon="inline-start"/>Simpan Barang {incoming ? 'Masuk' : 'Keluar'}</Button></DialogFooter>
        </form>
    </DialogContent></Dialog>;
}
