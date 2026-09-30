'use client';
import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Search, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { parseNumber, rupiah, stockStatus, todayISO } from '@/lib/demo-data';
import { applyOpname } from '@/lib/stock-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function StockOpnameDialog({ open, onOpenChange, products, onDone }) {
    const [counts, setCounts] = useState({});
    const [query, setQuery] = useState('');
    const [date, setDate] = useState(todayISO);
    const [notes, setNotes] = useState('');
    useEffect(() => { if (open) { setCounts({}); setQuery(''); setNotes(''); setDate(todayISO()); } }, [open]);
    const shown = useMemo(() => products.filter(p => !query.trim() || `${p.name} ${p.code}`.toLowerCase().includes(query.trim().toLowerCase())), [products, query]);
    const diffs = useMemo(() => products.map(p => ({ p, count: counts[p.id], delta: counts[p.id] === undefined ? 0 : parseNumber(counts[p.id]) - p.stock })).filter(x => x.count !== undefined && x.delta !== 0), [products, counts]);
    const lossValue = diffs.filter(x => x.delta < 0).reduce((sum, x) => sum + Math.abs(x.delta) * x.p.purchasePrice, 0);
    const gainValue = diffs.filter(x => x.delta > 0).reduce((sum, x) => sum + x.delta * x.p.purchasePrice, 0);
    const submit = (e) => {
        e.preventDefault();
        const lines = diffs.map(x => ({ productId: x.p.id, count: parseNumber(x.count) }));
        if (!lines.length) return toast.error('Belum ada hasil hitung yang berbeda dari stok sistem.');
        const result = applyOpname({ date, notes, lines });
        if (!result.ok) return toast.error(result.error);
        toast.success(`Opname tersimpan. ${result.adjusted} barang disesuaikan.`);
        onOpenChange(false);
        onDone?.(result);
    };
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-3xl">
        <DialogHeader><DialogTitle>Stok Opname</DialogTitle><DialogDescription>Input hasil hitung fisik. Selisih otomatis dicatat sebagai mutasi penyesuaian.</DialogDescription></DialogHeader>
        <form onSubmit={submit}>
            <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <Field><FieldLabel htmlFor="op-date">Tanggal Opname</FieldLabel><Input id="op-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11"/></Field>
                    <Field><FieldLabel htmlFor="op-notes">Catatan</FieldLabel><Input id="op-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contoh: Hitung bulanan gudang racks A-B" className="h-11"/></Field>
                </div>
                <div className="input-with-icon"><Search className="size-4"/><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari barang untuk dihitung..." className="h-10"/></div>
                <div className="max-h-[46vh] overflow-y-auto rounded-xl border border-border">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10"><tr className="border-b border-border bg-muted">{['Barang', 'Stok Sistem', 'Hasil Hitung', 'Selisih', 'Status'].map((h, i) => <th key={h} className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>)}</tr></thead>
                        <tbody>{shown.map(p => {
                            const value = counts[p.id] ?? '';
                            const delta = value === '' ? null : parseNumber(value) - p.stock;
                            const next = value === '' ? p.stock : parseNumber(value);
                            return <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                                <td className="px-3 py-2"><p className="text-[13px] font-semibold">{p.name}</p><p className="font-mono text-[10px] text-muted-foreground">{p.code}</p></td>
                                <td className="px-3 py-2 text-right text-[13px]">{p.stock} <small className="text-muted-foreground">{p.unit}</small></td>
                                <td className="px-3 py-2 text-right"><Input type="number" min="0" value={value} onChange={e => setCounts(c => ({ ...c, [p.id]: e.target.value }))} placeholder="—" className="h-9 w-24 text-right" aria-label={`Hasil hitung ${p.name}`}/></td>
                                <td className="px-3 py-2 text-right text-[13px] font-bold">{delta === null ? <span className="font-normal text-muted-foreground">—</span> : delta === 0 ? <span className="text-muted-foreground">0</span> : <span className={delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{delta > 0 ? '+' : ''}{delta}</span>}</td>
                                <td className="px-3 py-2 text-right"><span className={`stock-chip ${stockStatus(next, p.minimumStock) === 'Stok Aman' ? '' : stockStatus(next, p.minimumStock) === 'Stok Habis' ? 'out' : 'low'}`}>{stockStatus(next, p.minimumStock)}</span></td>
                            </tr>;
                        })}</tbody>
                    </table>
                    {!shown.length && <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada barang yang cocok dengan pencarian.</p>}
                </div>
                <div className="grid gap-3 rounded-2xl border border-border bg-muted/60 p-4 sm:grid-cols-3">
                    <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Barang Dihitung</p><p className="mt-0.5 text-xl font-bold tracking-[-.03em]">{Object.keys(counts).length}<small className="ml-1 text-xs font-normal text-muted-foreground">dari {products.length}</small></p></div>
                    <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Selisih Found / Loss</p><p className="mt-0.5 text-xl font-bold tracking-[-.03em]"><span className="text-emerald-600 dark:text-emerald-400">{diffs.filter(x => x.delta > 0).length}</span> <span className="text-muted-foreground">/</span> <span className="text-red-500">{diffs.filter(x => x.delta < 0).length}</span></p></div>
                    <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Dampak Nilai</p><p className="mt-0.5 text-xl font-bold tracking-[-.03em]"><span className="text-emerald-600 dark:text-emerald-400">+{rupiah(gainValue)}</span><small className="mx-1 text-muted-foreground">/</small><span className="text-red-500">-{rupiah(lossValue)}</span></p></div>
                </div>
                {diffs.length === 0 && <p className="flex items-center gap-2 text-xs text-muted-foreground"><TriangleAlert className="size-4"/>Isi kolom hasil hitung untuk barang yang jumlah fisiknya berbeda dari sistem.</p>}
            </div>
            <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit" disabled={!diffs.length}><ClipboardCheck data-icon="inline-start"/>Simpan Hasil Opname</Button></DialogFooter>
        </form>
    </DialogContent></Dialog>;
}
