'use client';
import { useEffect, useMemo, useState } from 'react';
import { CircleCheck, CircleX, FileSpreadsheet, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { categories, rupiah, units } from '@/lib/demo-data';
import { bulkSaveProducts } from '@/lib/stock-store';
import { bulkRowSchema, fieldErrors } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

const HEADERS = ['Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Stok', 'Stok Minimum', 'Harga Beli', 'Harga Jual'];
const SAMPLE = [
    ['OLI-002', 'Oli Mesin MPX 0.8L', 'Oli', 'Botol', '40', '12', '48000', '60000'],
    ['KAT-007', 'Kawat Kopling', 'Sparepart', 'Pcs', '15', '5', '8500', '12000'],
    ['LA-021', 'Lampu Depan 12V 35W', 'Kelistrikan', 'Pcs', '8', '4', '32000', '45000'],
].map(r => r.join('\t')).join('\n');
const isHeader = (line) => /\bkode\b/i.test(line) && /\bnama\b/i.test(line);

function splitRow(line) {
    if (line.includes('\t')) return line.split('\t');
    if (line.includes(';')) return line.split(';');
    return line.split(',');
}

export function StockBulkImportDialog({ open, onOpenChange, products, onDone }) {
    const [text, setText] = useState('');
    useEffect(() => { if (open) setText(''); }, [open]);
    const analyze = useMemo(() => {
        const raw = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const lines = raw.map((line, i) => ({ line, no: i + 1 })).filter(({ line }) => !isHeader(line));
        if (!lines.length) return { rows: [], importable: [], invalid: 0 };
        const seen = new Set();
        const rows = lines.map(({ line, no }) => {
            const cells = splitRow(line).map(c => c.trim());
            const money = (v) => (`${v ?? ''}`.replace(/[^\d]/g, '') || '0');
            const candidate = { code: cells[0] ?? '', name: cells[1] ?? '', category: cells[2] || categories[0], unit: cells[3] || units[0], stock: cells[4] ?? '0', minimumStock: cells[5] ?? '0', purchasePrice: money(cells[6]), sellingPrice: money(cells[7]) };
            const result = bulkRowSchema.safeParse(candidate);
            const duplicate = result.success && seen.has(candidate.code.toLowerCase());
            if (result.success) seen.add(candidate.code.toLowerCase());
            const existing = products.find(p => p.code.toLowerCase() === candidate.code.trim().toLowerCase());
            return { line: no, raw: line, data: result.success ? result.data : null, errors: result.success ? {} : fieldErrors(result), duplicate, mode: existing ? 'Perbarui' : 'Baru', previous: existing ?? null };
        });
        return { rows, importable: rows.filter(r => r.data && !r.duplicate), invalid: rows.filter(r => !r.data || r.duplicate).length };
    }, [text, products]);
    const { rows, importable, invalid } = analyze;
    const submit = (e) => {
        e.preventDefault();
        if (!rows.length) return toast.error('Tempel data barang terlebih dahulu.');
        if (invalid) return toast.error(`${invalid} baris tidak valid. Perbaiki dulu sebelum menyimpan.`);
        const result = bulkSaveProducts(importable);
        if (!result.ok) return toast.error(result.error);
        toast.success(`${result.created} barang baru, ${result.updated} diperbarui.`);
        onOpenChange(false);
        onDone?.(result);
    };
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-3xl">
        <DialogHeader><DialogTitle>Impor Massal Stok</DialogTitle><DialogDescription>Salin baris dari Excel atau CSV lalu tempel di bawah. Kode barang yang sudah ada akan diperbarui.</DialogDescription></DialogHeader>
        <form onSubmit={submit}>
            <div className="grid gap-4">
                <div className="rounded-xl border border-border bg-muted/60 p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold"><FileSpreadsheet className="size-4 text-muted-foreground"/>Urutan kolom: {HEADERS.map((h, i) => <span key={h} className="rounded-md bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{i + 1}. {h}</span>)}</p>
                </div>
                <Field><FieldLabel htmlFor="bi-text">Data dari Excel</FieldLabel><Textarea id="bi-text" value={text} onChange={e => setText(e.target.value)} placeholder={SAMPLE} rows={7} className="font-mono text-xs leading-relaxed"/><FieldDescription>Pemisah otomatis: Tab (Excel), titik koma, atau koma. Baris judul otomatis dilewati.</FieldDescription></Field>
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setText(SAMPLE)}><Wand2 data-icon="inline-start"/>Isi Contoh Data</Button>
                {rows.length > 0 && <>
                    <div className="max-h-[38vh] overflow-y-auto rounded-xl border border-border">
                        <table className="w-full">
                            <thead className="sticky top-0 z-10"><tr className="border-b border-border bg-muted">{[['Baris', 'right'], ['Kode', 'left'], ['Nama Barang', 'left'], ['Kategori', 'left'], ['Stok', 'right'], ['Harga Jual', 'right'], ['Status', 'right']].map(([h, a]) => <th key={h} className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${a === 'right' ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
                            <tbody>{rows.map(r => <tr key={r.line} className="border-b border-border last:border-0">
                                <td className="px-3 py-2 text-right font-mono text-[10px] text-muted-foreground">{r.line}</td>
                                <td className="px-3 py-2 font-mono text-xs">{r.data?.code ?? (splitRow(r.raw)[0] || '—')}</td>
                                <td className="px-3 py-2 text-[13px] font-semibold">{r.data?.name ?? <span className="font-normal text-red-500">{r.errors.name || r.errors.code || 'Tidak valid'}</span>}</td>
                                <td className="px-3 py-2 text-[13px] text-muted-foreground">{r.data?.category ?? '—'}</td>
                                <td className="px-3 py-2 text-right text-[13px]">{r.data ? <>{r.data.stock} <small className="text-muted-foreground">{r.data.unit}</small></> : '—'}</td>
                                <td className="px-3 py-2 text-right text-[13px]">{r.data ? rupiah(r.data.sellingPrice) : '—'}</td>
                                <td className="px-3 py-2 text-right">{!r.data ? <span className="stock-chip out">Gagal</span> : r.duplicate ? <span className="stock-chip low">Kode Ganda</span> : r.mode === 'Baru' ? <span className="stock-chip">Baru</span> : <span className="stock-chip low">Perbarui {r.previous ? <small className="opacity-70">dari {r.previous.stock} {r.previous.unit}</small> : null}</span>}</td>
                            </tr>)}</tbody>
                        </table>
                    </div>
                    <div className="grid gap-3 rounded-2xl border border-border bg-muted/60 p-4 sm:grid-cols-4">
                        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Baris Dibaca</p><p className="mt-0.5 text-xl font-bold tracking-[-.03em]">{rows.length}</p></div>
                        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Baru</p><p className="mt-0.5 flex items-center gap-1.5 text-xl font-bold tracking-[-.03em] text-emerald-600 dark:text-emerald-400"><CircleCheck className="size-4"/>{importable.filter(r => r.mode === 'Baru').length}</p></div>
                        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Diperbarui</p><p className="mt-0.5 text-xl font-bold tracking-[-.03em]">{importable.filter(r => r.mode === 'Perbarui').length}</p></div>
                        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tidak Valid</p><p className={`mt-0.5 flex items-center gap-1.5 text-xl font-bold tracking-[-.03em] ${invalid ? 'text-red-500' : 'text-muted-foreground'}`}><CircleX className="size-4"/>{invalid}</p></div>
                    </div>
                </>}
            </div>
            <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit" disabled={!importable.length || !!invalid}><FileSpreadsheet data-icon="inline-start"/>Impor {importable.length} Baris</Button></DialogFooter>
        </form>
    </DialogContent></Dialog>;
}
