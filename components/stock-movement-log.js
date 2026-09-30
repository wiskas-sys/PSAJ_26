'use client';
import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { dateLabel, kindLabel, movementKinds, todayISO } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const periods = [['Semua', 'Semua waktu'], ['today', 'Hari ini'], ['7', '7 hari terakhir'], ['30', '30 hari terakhir']];
const sinceDays = (n) => { const d = new Date(`${todayISO()}T00:00:00`); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

function downloadCsv(rows) {
    const esc = (v) => `"${`${v}`.replace(/"/g, '""')}"`;
    const head = ['No. Mutasi', 'Tanggal', 'Kode Barang', 'Nama Barang', 'Tipe', 'Jenis', 'Jumlah', 'Stok Sebelum', 'Stok Sesudah', 'Referensi', 'Sumber', 'Catatan'];
    const body = rows.map(m => [m.code, m.date, m.productCode, m.productName, m.type === 'IN' ? 'Masuk' : 'Keluar', kindLabel(m.kind), m.quantity, m.before, m.after, m.reference, m.party, m.notes]);
    const blob = new Blob([`\uFEFF${[head, ...body].map(r => r.map(esc).join(';')).join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'riwayat-mutasi-stok.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} mutasi diunduh sebagai CSV.`);
}

export function StockMovementLog({ movements }) {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('ALL');
    const [kind, setKind] = useState('ALL');
    const [period, setPeriod] = useState('Semua');
    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        const floor = period === 'today' ? todayISO() : period !== 'Semua' ? sinceDays(Number(period)) : null;
        return movements.filter(m => {
            if (type !== 'ALL' && m.type !== type) return false;
            if (kind !== 'ALL' && m.kind !== kind) return false;
            if (floor && m.date < floor) return false;
            if (!q) return true;
            return `${m.productName} ${m.productCode} ${m.code} ${m.reference} ${m.party} ${m.notes} ${kindLabel(m.kind)}`.toLowerCase().includes(q);
        });
    }, [movements, query, type, kind, period]);
    const totals = useMemo(() => ({ in: shown.filter(m => m.type === 'IN').length, out: shown.filter(m => m.type === 'OUT').length }), [shown]);
    return <div className="table-surface">
        <div className="flex flex-col gap-3 border-b border-border p-3.5 xl:flex-row xl:items-center">
            <div className="input-with-icon min-w-0 flex-1"><Search className="size-4"/><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari barang, nomor mutasi, atau referensi..." className="h-10"/></div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1.5">
                    {[['ALL', 'Semua'], ['IN', 'Masuk'], ['OUT', 'Keluar']].map(([v, l]) => <button key={v} type="button" onClick={() => setType(v)} className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${type === v ? 'bg-primary text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{l}<span className="rounded-full bg-black/10 px-1.5 font-mono text-[10px] dark:bg-white/10">{v === 'ALL' ? shown.length : v === 'IN' ? totals.in : totals.out}</span></button>)}
                </div>
                <Select value={kind} onValueChange={setKind}><SelectTrigger className="h-9 w-fit min-w-[140px] bg-card"><SelectValue placeholder="Semua Jenis"/></SelectTrigger><SelectContent><SelectGroup><SelectItem value="ALL">Semua Jenis</SelectItem>{movementKinds.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectGroup></SelectContent></Select>
                <Select value={period} onValueChange={setPeriod}><SelectTrigger className="h-9 w-fit min-w-[150px] bg-card"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{periods.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectGroup></SelectContent></Select>
                <Button variant="outline" onClick={() => downloadCsv(shown)} disabled={!shown.length}><Download data-icon="inline-start"/>Unduh CSV</Button>
            </div>
        </div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full"><thead><tr className="border-b border-border">{[['No. Mutasi', 'left'], ['Tanggal', 'left'], ['Barang', 'left'], ['Tipe', 'left'], ['Jenis', 'left'], ['Jumlah', 'right'], ['Stok', 'right'], ['Referensi', 'left'], ['Sumber', 'left'], ['Catatan', 'left']].map(([h, a]) => <th key={h} className={`px-3.5 py-2.5 font-medium uppercase tracking-wide ${a === 'right' ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
            <tbody>{shown.map(m => {
                const incoming = m.type === 'IN';
                const Glyph = incoming ? ArrowDownLeft : ArrowUpRight;
                return <tr key={m.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                    <td className="px-3.5 py-3 font-mono text-xs">{m.code}</td>
                    <td className="px-3.5 py-3 text-[13px] whitespace-nowrap">{dateLabel(m.date)}</td>
                    <td className="px-3.5 py-3"><p className="text-[13px] font-semibold">{m.productName}</p><p className="font-mono text-[10px] text-muted-foreground">{m.productCode}</p></td>
                    <td className="px-3.5 py-3"><span className={`stock-chip ${incoming ? '' : 'out'}`}><Glyph className="size-3"/>{incoming ? 'Masuk' : 'Keluar'}</span></td>
                    <td className="px-3.5 py-3"><span className="stock-chip">{kindLabel(m.kind)}</span></td>
                    <td className="px-3.5 py-3 text-right text-[13px] font-bold"><span className={incoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{incoming ? '+' : '-'}{m.quantity}</span> <small className="font-normal text-muted-foreground">{m.unit}</small></td>
                    <td className="px-3.5 py-3 text-right text-[13px] whitespace-nowrap"><span className="text-muted-foreground">{m.before}</span><span className="mx-1 text-muted-foreground">→</span><strong>{m.after}</strong></td>
                    <td className="px-3.5 py-3 font-mono text-xs">{m.reference || '—'}</td>
                    <td className="px-3.5 py-3 text-[13px] text-muted-foreground">{m.party || '—'}</td>
                    <td className="px-3.5 py-3 text-[13px] text-muted-foreground">{m.notes || '—'}</td>
                </tr>;
            })}</tbody></table></div>
        <div className="grid gap-3 p-3 md:hidden">{shown.map(m => { const incoming = m.type === 'IN'; return <article key={m.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-mono text-[10px] text-muted-foreground">{m.code} · {dateLabel(m.date)}</p><h2 className="mt-1 text-sm font-semibold">{m.productName}</h2></div><span className={`stock-chip ${incoming ? '' : 'out'}`}>{incoming ? 'Masuk' : 'Keluar'}</span></div><div className="mt-2"><span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Jenis · {kindLabel(m.kind)}</span></div><div className="mt-2 flex items-baseline justify-between"><strong className={`text-lg ${incoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{incoming ? '+' : '-'}{m.quantity} <small className="text-xs font-normal text-muted-foreground">{m.unit}</small></strong><span className="text-xs text-muted-foreground">{m.before} → <strong className="text-foreground">{m.after}</strong></span></div><p className="mt-2 border-t border-dashed border-border pt-2 text-xs text-muted-foreground">{[m.reference, m.party, m.notes].filter(Boolean).join(' · ')}</p></article>; })}</div>
        {!shown.length && <p className="py-16 text-center text-muted-foreground">{movements.length ? 'Tidak ada mutasi yang cocok dengan filter.' : 'Belum ada riwayat mutasi stok.'}</p>}
    </div>;
}
