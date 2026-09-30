'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, History, PackageCheck, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { dateLabel, outReasons, parseNumber, rupiah, stockStatus, suppliers, todayISO } from '@/lib/demo-data';
import { getMovements, getProducts, recordMovement, subscribeStock } from '@/lib/stock-store';
import { fieldErrors, movementSchema } from '@/lib/validators';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const emptyDraft = (type) => ({ productId: '', type, quantity: '1', date: todayISO(), reference: '', party: '', notes: '' });

export function MovementForm({ type }) {
    const outgoing = type === 'OUT';
    const [catalog, setCatalog] = useState(() => getProducts());
    const [logs, setLogs] = useState(() => getMovements());
    const [draft, setDraft] = useState(() => ({ ...emptyDraft(type), party: outgoing ? 'Penjualan' : '' }));
    const [errors, setErrors] = useState({});
    useEffect(() => subscribeStock(() => { setCatalog(getProducts()); setLogs(getMovements()); }), []);
    const Icon = outgoing ? ArrowUpFromLine : ArrowDownToLine;
    const router = useRouter();
    const set = (patch) => setDraft(d => ({ ...d, ...patch }));
    const product = catalog.find(p => p.id === draft.productId) ?? null;
    const qty = parseNumber(draft.quantity);
    const after = product ? (outgoing ? Math.max(0, product.stock - qty) : product.stock + qty) : 0;
    const overdraw = outgoing && product && qty > product.stock;
    const noReceiptYet = !outgoing && product && !logs.some(m => m.productId === product.id && m.kind === 'PEMASOKAN');
    const recent = logs.filter(m => m.type === type).slice(0, 6);
    function submit(e) {
        e.preventDefault();
        const parsed = movementSchema.safeParse(draft);
        if (!parsed.success) { setErrors(fieldErrors(parsed)); return toast.error('Periksa kembali isian formulir.'); }
        const result = recordMovement(parsed.data);
        if (!result.ok) { setErrors({ quantity: result.error }); return toast.error(result.error); }
        toast.success(outgoing ? 'Barang berhasil dikeluarkan dari stok.' : 'Barang berhasil ditambahkan ke stok.');
        setDraft({ ...emptyDraft(type), productId: draft.productId, party: outgoing ? 'Penjualan' : '' });
        setErrors({});
    }
    return <div className="flex flex-col gap-5"><PageHeader title={`Barang ${outgoing ? 'Keluar' : 'Masuk'}`} description={outgoing ? 'Catat penggunaan barang dan kurangi stok dengan aman.' : 'Tambahkan stok barang dari pemasok.'}><Button variant="outline" onClick={() => router.push('/stok')}>Buka Cek Stok</Button></PageHeader>
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Form Barang {outgoing ? 'Keluar' : 'Masuk'}</CardTitle><CardDescription>Kolom bertanda wajib harus diisi.</CardDescription></CardHeader><CardContent className="p-5">
        <form onSubmit={submit}><FieldGroup>
          <Field data-invalid={!!errors.productId}><FieldLabel>Produk</FieldLabel><Select value={draft.productId || null} onValueChange={v => set({ productId: v })}><SelectTrigger className="h-11 w-full" aria-invalid={!!errors.productId}><SelectValue placeholder="Pilih barang..."/></SelectTrigger><SelectContent><SelectGroup>{catalog.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name} ({p.stock} {p.unit})</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{errors.productId}</FieldError></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.quantity}><FieldLabel htmlFor="mf-qty">Jumlah</FieldLabel><Input id="mf-qty" type="number" min="1" value={draft.quantity} onChange={e => set({ quantity: e.target.value })} className="h-11" aria-invalid={!!errors.quantity}/><FieldError>{errors.quantity}</FieldError></Field>
            <Field><FieldLabel htmlFor="mf-unit">Satuan</FieldLabel><Input id="mf-unit" value={product?.unit ?? '-'} disabled className="h-11"/></Field>
          </div>
          {overdraw && <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2.5 text-xs text-red-600 dark:text-red-400"><TriangleAlert className="mt-0.5 size-4 shrink-0"/>Stok tidak mencukupi. Tersedia {product.stock} {product.unit}.</p>}
          {noReceiptYet && <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400"><TriangleAlert className="mt-0.5 size-4 shrink-0"/>{product.name} belum punya catatan penerimaan dari supplier. Kalau stok fisiknya berbeda, hitung ulang lewat Stok Opname — jangan catat barang masuk dua kali.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.date}><FieldLabel htmlFor="mf-date">Tanggal {outgoing ? 'Keluar' : 'Masuk'}</FieldLabel><Input id="mf-date" type="date" value={draft.date} onChange={e => set({ date: e.target.value })} className="h-11" aria-invalid={!!errors.date}/><FieldError>{errors.date}</FieldError></Field>
            <Field data-invalid={!!errors.reference}><FieldLabel htmlFor="mf-ref">No. Referensi</FieldLabel><Input id="mf-ref" value={draft.reference} onChange={e => set({ reference: e.target.value })} placeholder={outgoing ? 'TRX-260827-018' : 'INV-8821'} className="h-11"/><FieldError>{errors.reference}</FieldError></Field>
          </div>
          <Field data-invalid={!!errors.party}><FieldLabel>{outgoing ? 'Jenis Penggunaan' : 'Supplier'}</FieldLabel><Select value={draft.party || null} onValueChange={v => set({ party: v })}><SelectTrigger className="h-11 w-full" aria-invalid={!!errors.party}><SelectValue placeholder={outgoing ? 'Pilih jenis penggunaan...' : 'Pilih supplier...'}/></SelectTrigger><SelectContent><SelectGroup>{(outgoing ? outReasons : suppliers).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{errors.party}</FieldError></Field>
          <Field data-invalid={!!errors.notes}><FieldLabel htmlFor="mf-notes">Catatan</FieldLabel><Textarea id="mf-notes" value={draft.notes} onChange={e => set({ notes: e.target.value })} placeholder="Tambahkan keterangan bila diperlukan..." rows={2}/><FieldError>{errors.notes}</FieldError></Field>
          <Button type="submit" size="lg" className="h-11" disabled={!product || overdraw}><Icon data-icon="inline-start"/>Simpan Barang {outgoing ? 'Keluar' : 'Masuk'}</Button>
        </FieldGroup></form>
      </CardContent></Card>
      <div className="grid gap-4">
        <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Informasi Stok</CardTitle><CardDescription>Preview dampak terhadap stok</CardDescription></CardHeader><CardContent className="p-5">
          {!product ? <p className="text-sm text-muted-foreground">Pilih produk untuk melihat pratinjau.</p> : <>
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><PackageCheck className="size-5"/></span><div className="min-w-0"><p className="font-mono text-[10px] text-muted-foreground">{product.code}</p><p className="truncate text-sm font-semibold">{product.name}</p></div></div>
            <div className="mt-5 rounded-2xl bg-muted p-5"><p className="text-xs text-muted-foreground">Stok saat ini</p><p className="mt-1 text-4xl font-bold tracking-[-.03em]">{product.stock} <span className="text-base font-normal text-muted-foreground">{product.unit}</span></p></div>
            <div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">Setelah disimpan</span><strong className={overdraw ? 'text-red-500' : 'text-primary'}>{after} {product.unit}</strong></div>
            <div className="mt-4 border-t border-dashed border-border pt-4"><span className={`stock-chip ${stockStatus(after, product.minimumStock) === 'Stok Aman' ? '' : stockStatus(after, product.minimumStock) === 'Stok Habis' ? 'out' : 'low'}`}>{stockStatus(after, product.minimumStock)}</span></div>
          </>}
        </CardContent></Card>
        <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2"><History className="size-4"/>Mutasi Terbaru</CardTitle><CardDescription>{logs.filter(m => m.type === type).length} pencatatan barang {outgoing ? 'keluar' : 'masuk'}.</CardDescription></CardHeader><CardContent className="grid gap-1 p-3">
          {recent.map(m => <div key={m.id} className="flex items-center justify-between gap-3 border-b border-dashed border-border py-2 last:border-0"><div className="min-w-0"><p className="truncate text-[13px] font-semibold">{m.productName}</p><p className="font-mono text-[10px] text-muted-foreground">{m.code} · {dateLabel(m.date)}</p></div><span className={`shrink-0 text-[13px] font-bold ${m.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{m.type === 'IN' ? '+' : '-'}{m.quantity} <small className="font-normal text-muted-foreground">{m.unit}</small></span></div>)}
          {!recent.length && <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pencatatan.</p>}
        </CardContent></Card>
        <p className="px-1 text-xs text-muted-foreground">Nilai mutasi untuk <strong className="text-foreground">{product?.name ?? 'barang belum dipilih'}</strong>: <strong className="text-foreground">{rupiah(qty * (product?.purchasePrice ?? 0))}</strong></p>
      </div>
    </div>
  </div>;
}
