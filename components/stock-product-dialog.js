'use client';
import { useEffect, useState } from 'react';
import { Calculator, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { categories, parseNumber, rupiah, units } from '@/lib/demo-data';
import { saveProduct, suggestCode } from '@/lib/stock-store';
import { fieldErrors, productSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const blank = () => ({ id: '', code: '', name: '', category: categories[0], unit: units[0], purchasePrice: '', sellingPrice: '', stock: '0', minimumStock: '0' });

export function StockProductDialog({ open, onOpenChange, product, onDone }) {
    const [draft, setDraft] = useState(blank);
    const [errors, setErrors] = useState({});
    const editing = Boolean(product);
    useEffect(() => {
        if (!open) return;
        setErrors({});
        setDraft(product ? { ...blank(), ...product, purchasePrice: `${product.purchasePrice}`, sellingPrice: `${product.sellingPrice}`, stock: `${product.stock}`, minimumStock: `${product.minimumStock}` } : blank());
    }, [open, product]);
    const set = (patch) => setDraft(d => ({ ...d, ...patch }));
    const buy = parseNumber(draft.purchasePrice);
    const sell = parseNumber(draft.sellingPrice);
    const margin = sell - buy;
    const markup = buy > 0 ? (margin / buy) * 100 : 0;
    const submit = (e) => {
        e.preventDefault();
        const parsed = productSchema.safeParse(draft);
        if (!parsed.success) { setErrors(fieldErrors(parsed)); return toast.error('Periksa kembali isian formulir.'); }
        const result = saveProduct({ ...parsed.data, id: draft.id || undefined });
        if (!result.ok) { setErrors({ code: result.error }); return toast.error(result.error); }
        toast.success(editing ? `${result.product.code} berhasil diperbarui.` : `${result.product.code} berhasil didaftarkan.`);
        onOpenChange(false);
        onDone?.(result);
    };
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? 'Ubah Data Barang' : 'Daftarkan Barang Baru'}</DialogTitle><DialogDescription>{editing ? 'Perubahan stok akan tercatat sebagai mutasi otomatis.' : 'Barang baru langsung masuk ke daftar stok dan katalog.'}</DialogDescription></DialogHeader>
        <form onSubmit={submit}>
            <FieldGroup className="gap-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
                    <Field data-invalid={!!errors.name}><FieldLabel htmlFor="pd-name">Nama Barang</FieldLabel><Input id="pd-name" value={draft.name} onChange={e => set({ name: e.target.value })} placeholder="Contoh: Oli Mesin MPX 1 0.8L" className="h-11" aria-invalid={!!errors.name}/><FieldError>{errors.name}</FieldError></Field>
                    <Field data-invalid={!!errors.code}><FieldLabel htmlFor="pd-code">Kode Barang</FieldLabel><div className="flex gap-1.5"><Input id="pd-code" value={draft.code} onChange={e => set({ code: e.target.value.toUpperCase() })} placeholder="OLI-001" className="h-11 font-mono" aria-invalid={!!errors.code}/><Button type="button" variant="outline" size="icon-lg" onClick={() => set({ code: suggestCode(draft.category) })} title="Buat kode otomatis"><Sparkles/></Button></div><FieldError>{errors.code}</FieldError></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.category}><FieldLabel>Kategori</FieldLabel><Select value={draft.category} onValueChange={v => set({ category: v })}><SelectTrigger className="h-11 w-full bg-card"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                    <Field data-invalid={!!errors.unit}><FieldLabel>Satuan</FieldLabel><Select value={draft.unit} onValueChange={v => set({ unit: v })}><SelectTrigger className="h-11 w-full bg-card"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.purchasePrice}><FieldLabel htmlFor="pd-buy">Harga Beli</FieldLabel><Input id="pd-buy" type="number" min="0" value={draft.purchasePrice} onChange={e => set({ purchasePrice: e.target.value })} placeholder="47000" className="h-11" aria-invalid={!!errors.purchasePrice}/><FieldError>{errors.purchasePrice}</FieldError></Field>
                    <Field data-invalid={!!errors.sellingPrice}><FieldLabel htmlFor="pd-sell">Harga Jual</FieldLabel><Input id="pd-sell" type="number" min="0" value={draft.sellingPrice} onChange={e => set({ sellingPrice: e.target.value })} placeholder="58000" className="h-11" aria-invalid={!!errors.sellingPrice}/><FieldError>{errors.sellingPrice}</FieldError></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.stock}><FieldLabel htmlFor="pd-stock">{editing ? 'Stok Baru' : 'Stok Awal'}</FieldLabel><Input id="pd-stock" type="number" min="0" value={draft.stock} onChange={e => set({ stock: e.target.value })} className="h-11" aria-invalid={!!errors.stock}/>{editing && <FieldDescription>Berbeda dari stok saat ini akan dicatat sebagai mutasi.</FieldDescription>}<FieldError>{errors.stock}</FieldError></Field>
                    <Field data-invalid={!!errors.minimumStock}><FieldLabel htmlFor="pd-min">Stok Minimum</FieldLabel><Input id="pd-min" type="number" min="0" value={draft.minimumStock} onChange={e => set({ minimumStock: e.target.value })} className="h-11" aria-invalid={!!errors.minimumStock}/><FieldDescription>Batas peringatan stok menipis.</FieldDescription><FieldError>{errors.minimumStock}</FieldError></Field>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/60 px-4 py-3"><Calculator className="size-4 shrink-0 text-muted-foreground"/><p className="text-xs text-muted-foreground">Margin per {draft.unit}</p><strong className={`text-sm ${margin < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{rupiah(margin)}{buy > 0 && <small className="ml-1.5 font-normal text-muted-foreground">({markup.toFixed(1)}%)</small>}</strong><p className="ml-auto text-xs text-muted-foreground">Nilai persediaan {rupiah(parseNumber(draft.stock) * buy)}</p></div>
            </FieldGroup>
            <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit"><Save data-icon="inline-start"/>{editing ? 'Simpan Perubahan' : 'Daftarkan Barang'}</Button></DialogFooter>
        </form>
    </DialogContent></Dialog>;
}
