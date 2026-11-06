'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { parseNumber, rupiah, stockStatus, todayISO } from '@/lib/demo-data';
import { recordStockMovement } from '@/lib/supabase/stock-products';
import { recordMovement } from '@/lib/stock-store';
import { fieldErrors, movementSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const emptyDraft = (productId = '') => ({
    productId,
    type: 'IN',
    quantity: '1',
    date: todayISO(),
    reference: '',
    party: 'Restock Bengkel',
    notes: ''
});

export function StockMovementDialog({ open, onOpenChange, products = [], initial, onDone }) {
    const [draft, setDraft] = useState(() => emptyDraft(initial?.productId ?? ''));
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setDraft(emptyDraft(initial?.productId ?? ''));
        setErrors({});
        setTouched(false);
        setLoading(false);
    }, [open, initial?.productId]);

    const set = (patch) => setDraft(d => ({ ...d, ...patch }));
    const product = useMemo(() => products.find(p => p.id === draft.productId) ?? null, [products, draft.productId]);
    const qty = Math.max(1, Math.trunc(parseNumber(draft.quantity) || 1));
    const after = product ? product.stock + qty : 0;

    const submit = async (e) => {
        e.preventDefault();
        setTouched(true);
        const parsed = movementSchema.safeParse({
            ...draft,
            type: 'IN',
            party: 'Restock Bengkel',
        });
        if (!parsed.success) {
            setErrors(fieldErrors(parsed));
            return toast.error('Periksa kembali isian formulir.');
        }

        setLoading(true);
        let result = null;
        try {
            result = await recordStockMovement(parsed.data);
        } catch (error) {
            console.warn('Supabase mutasi catatan:', error);
        }

        // Sinkronkan juga ke local store
        try {
            recordMovement({
                productId: product.id,
                type: 'IN',
                kind: 'PEMASOKAN',
                quantity: qty,
                reference: draft.reference || 'RESTOCK',
                party: 'Restock Bengkel',
                notes: draft.notes || 'Penerimaan barang restock bengkel.',
                date: draft.date || todayISO(),
            });
        } catch (localErr) {
            console.warn('Gagal mencatat mutasi lokal:', localErr);
        }

        setLoading(false);
        toast.success(`Stok ${product.name} berhasil ditambah +${qty} ${product.unit}.`);
        onOpenChange(false);
        onDone?.(result);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <ArrowDownToLine className="size-5 text-emerald-500" />
                        Catat Barang Masuk (Restock)
                    </DialogTitle>
                    <DialogDescription>
                        Input suku cadang yang baru tiba di bengkel untuk menambah stok secara otomatis.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 mt-1">
                    <FieldGroup className="gap-3.5">
                        <Field data-invalid={!!errors.productId}>
                            <FieldLabel>Pilih Suku Cadang</FieldLabel>
                            <Select value={draft.productId || null} onValueChange={v => set({ productId: v })}>
                                <SelectTrigger className="h-11 w-full bg-card font-medium" aria-invalid={!!errors.productId}>
                                    <SelectValue placeholder="Pilih suku cadang dari katalog..."/>
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false} className="!w-auto !min-w-[340px] sm:!min-w-[480px] max-w-[90vw] max-h-80 shadow-2xl">
                                    <SelectGroup>
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id} className="cursor-pointer py-2 px-3 border-b border-border/40 last:border-0 hover:bg-muted/70">
                                                <div className="flex flex-col gap-0.5 text-left min-w-0 flex-1">
                                                    <span className="font-semibold text-xs leading-snug whitespace-normal break-words text-foreground">
                                                        {p.name}
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                                                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">{p.code}</span>
                                                        <span>·</span>
                                                        <span>Stok saat ini: <b className="text-foreground">{p.stock} {p.unit}</b></span>
                                                        <span>·</span>
                                                        <span>Kategori: {p.category || 'Umum'}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldError>{errors.productId}</FieldError>
                        </Field>

                        <div className="grid gap-3.5 sm:grid-cols-2">
                            <Field data-invalid={!!errors.quantity}>
                                <FieldLabel htmlFor="mv-qty">Jumlah Barang Masuk</FieldLabel>
                                <Input 
                                    id="mv-qty" 
                                    type="number" 
                                    min="1" 
                                    value={draft.quantity} 
                                    onChange={e => set({ quantity: e.target.value })} 
                                    className="h-11 font-bold text-base" 
                                    placeholder="Contoh: 10"
                                    aria-invalid={!!errors.quantity}
                                />
                                <FieldError>{errors.quantity}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="mv-unit">Satuan</FieldLabel>
                                <Input id="mv-unit" value={product?.unit ? `${product.unit}` : '-'} disabled className="h-11 font-semibold"/>
                            </Field>
                        </div>

                        <div className="grid gap-3.5 sm:grid-cols-2">
                            <Field data-invalid={!!errors.date}>
                                <FieldLabel htmlFor="mv-date">Tanggal Kedatangan</FieldLabel>
                                <Input 
                                    id="mv-date" 
                                    type="date" 
                                    value={draft.date} 
                                    onChange={e => set({ date: e.target.value })} 
                                    className="h-11" 
                                    aria-invalid={!!errors.date}
                                />
                                <FieldError>{errors.date}</FieldError>
                            </Field>
                            <Field data-invalid={!!errors.reference}>
                                <FieldLabel htmlFor="mv-ref">No. Faktur / Nota (Opsional)</FieldLabel>
                                <Input 
                                    id="mv-ref" 
                                    value={draft.reference} 
                                    onChange={e => set({ reference: e.target.value })} 
                                    placeholder="Contoh: INV-8821 atau Nota Toko" 
                                    className="h-11"
                                />
                                <FieldDescription>Nomor surat jalan atau nota toko.</FieldDescription>
                            </Field>
                        </div>

                        <Field data-invalid={!!errors.notes}>
                            <FieldLabel htmlFor="mv-notes">Catatan Tambahan (Opsional)</FieldLabel>
                            <Textarea 
                                id="mv-notes" 
                                value={draft.notes} 
                                onChange={e => set({ notes: e.target.value })} 
                                placeholder="Keterangan pengiriman atau kondisi barang..." 
                                rows={2}
                            />
                            <FieldError>{errors.notes}</FieldError>
                        </Field>
                    </FieldGroup>

                    {/* Ringkasan Penambahan Stok */}
                    <div className="rounded-xl border border-border bg-muted/50 p-4">
                        {!product ? (
                            <p className="text-xs text-muted-foreground text-center py-1">
                                Pilih suku cadang di atas untuk melihat simulasi penambahan stok.
                            </p>
                        ) : (
                            <div className="grid gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <PackageCheck className="size-4.5"/>
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate font-mono text-[10px] text-muted-foreground">{product.code}</p>
                                        <p className="truncate text-[13px] font-semibold text-foreground">{product.name}</p>
                                    </div>
                                    <span className={`stock-chip ml-auto ${stockStatus(after, product.minimumStock) === 'Stok Aman' ? '' : stockStatus(after, product.minimumStock) === 'Stok Habis' ? 'out' : 'low'}`}>
                                        {stockStatus(after, product.minimumStock)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-t border-dashed border-border pt-3 text-center">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Stok Saat Ini</p>
                                        <p className="mt-0.5 text-base font-bold tracking-tight">
                                            {product.stock} <small className="text-[11px] font-normal text-muted-foreground">{product.unit}</small>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-bold">Penambahan</p>
                                        <p className="mt-0.5 text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                            +{qty} <small className="text-[11px] font-normal">{product.unit}</small>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Stok Baru</p>
                                        <p className="mt-0.5 text-base font-bold text-primary tracking-tight">
                                            {after} <small className="text-[11px] font-normal text-muted-foreground">{product.unit}</small>
                                        </p>
                                    </div>
                                </div>
                                {product.purchasePrice > 0 && (
                                    <p className="border-t border-dashed border-border pt-2.5 text-center text-xs text-muted-foreground">
                                        Total nilai barang masuk: <strong className="text-foreground">{rupiah(qty * product.purchasePrice)}</strong>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {touched && Object.keys(errors).length > 0 && (
                        <FieldError>Beberapa isian belum lengkap. Periksa tanda merah di atas.</FieldError>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={!product || loading} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                        >
                            <ArrowDownToLine className="size-4 mr-1.5" />
                            {loading ? 'Menyimpan...' : 'Simpan Barang Masuk'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
