'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowUpRight, Clock3, Copy, Eye, Loader2, RefreshCw, Search, TrendingUp, Wallet, XCircle } from 'lucide-react';
import { rupiah } from '@/lib/demo-data';
import { getSales, subscribeSales } from '@/lib/sales-store';
import { PaymentGatewayCard } from '@/components/payment-gateway-card';
import { PaymentBreakdown } from '@/components/payment-breakdown';
import { GatewayConfigCard } from '@/components/gateway-config-card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_META = {
    paid: ['Berhasil', 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'],
    pending: ['Menunggu', 'border-amber-500/25 bg-amber-500/10 text-amber-500'],
    expired: ['Kadaluarsa', 'border-zinc-500/25 bg-zinc-500/10 text-zinc-400'],
    failed: ['Gagal', 'border-red-500/25 bg-red-500/10 text-red-400'],
};
const METHOD_COLORS = { QRIS: '#dc2626', 'Virtual Account': '#f59e0b', Transfer: '#f59e0b', 'E-Wallet': '#10b981', 'Kartu Kredit': '#3b82f6', 'Retail Outlet': '#a855f7' };
const TABS = [['ALL', 'Semua'], ['paid', 'Berhasil'], ['pending', 'Menunggu'], ['failed', 'Gagal']];

function StatusBadge({ status }) {
    const [label, cls] = STATUS_META[status] || ['Pending', 'border-zinc-500/25 bg-zinc-500/10 text-zinc-400'];
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${cls}`}>{label}</span>;
}

function dateText(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function serverRow(p) {
    const created = p.created_at ? new Date(p.created_at) : null;
    return {
        id: p.id || p.order_id,
        order_id: p.order_id,
        amount: Number(p.amount) || 0,
        customer_name: p.customer_name,
        method: p.method || 'Lainnya',
        payment_type: p.payment_type,
        status: p.status || 'pending',
        created_at: p.created_at,
        paid_at: p.paid_at,
        payload: p.payload,
        items: [],
        source: 'midtrans',
        sortAt: created && !Number.isNaN(created.getTime()) ? created.getTime() : 0,
        displayDate: null,
    };
}

function localStatus(sale) {
    if (sale.status === 'Gagal') return 'failed';
    if (sale.pendingVerification || sale.status === 'Menunggu Verifikasi' || sale.status === 'Perlu Tinjauan') return 'pending';
    return 'paid';
}

function localRow(sale) {
    const created = sale.createdAt ? new Date(`${sale.createdAt}`.replace(' ', 'T')) : null;
    const status = localStatus(sale);
    return {
        id: sale.id || sale.code,
        order_id: sale.code || sale.id,
        amount: Number(sale.total) || 0,
        customer_name: sale.customer,
        method: sale.method || 'Lainnya',
        payment_type: sale.reference || null,
        status,
        created_at: created && !Number.isNaN(created.getTime()) ? created.toISOString() : null,
        paid_at: status === 'paid' ? (created && !Number.isNaN(created.getTime()) ? created.toISOString() : sale.date || null) : null,
        payload: null,
        items: sale.items ?? [],
        source: 'kasir',
        sortAt: created && !Number.isNaN(created.getTime()) ? created.getTime() : 0,
        displayDate: sale.date || null,
    };
}

function rowDate(row) {
    return row.created_at ? dateText(row.created_at) : row.displayDate || '—';
}

export function PaymentsDashboard({ initialPayments = [], environment, configured, hasServerKey, hasClientKey, supabaseConnected }) {
    const router = useRouter();
    const [sales, setSales] = useState(() => getSales());
    const [overrides, setOverrides] = useState({});
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState('ALL');
    const [method, setMethod] = useState('ALL');
    const [selected, setSelected] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [checking, setChecking] = useState('');
    useEffect(() => {
        const unsub = subscribeSales(() => setSales(getSales()));
        let channel;
        try {
            const supabase = createClient();
            channel = supabase.channel('payments-live-refresh')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
                    router.refresh();
                })
                .subscribe();
        } catch (e) {}
        return () => {
            if (unsub) unsub();
            if (channel) {
                const supabase = createClient();
                supabase.removeChannel(channel);
            }
        };
    }, [router]);

    const rows = useMemo(() => {
        const serverCodes = new Set(initialPayments.map(p => p.order_id));
        const local = sales.filter(s => s.method && s.method !== 'Tunai').map(localRow).filter(r => !serverCodes.has(r.order_id));
        return [...initialPayments.map(serverRow), ...local]
            .map(r => (overrides[r.order_id] ? { ...r, status: overrides[r.order_id].status, method: overrides[r.order_id].method || r.method } : r))
            .sort((a, b) => b.sortAt - a.sortAt);
    }, [initialPayments, sales, overrides]);

    const paid = rows.filter(r => r.status === 'paid');
    const pending = rows.filter(r => r.status === 'pending');
    const failed = rows.filter(r => r.status === 'failed' || r.status === 'expired');
    const volume = paid.reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = pending.reduce((sum, r) => sum + r.amount, 0);
    const successRate = rows.length ? (paid.length / rows.length) * 100 : 0;
    const series = useMemo(() => {
        const map = new Map();
        for (const row of paid) {
            const key = row.method || 'Lainnya';
            const current = map.get(key) || { label: key, color: METHOD_COLORS[key] || '#71717a', count: 0, amount: 0 };
            current.count += 1;
            current.amount += row.amount;
            map.set(key, current);
        }
        return [...map.values()].sort((a, b) => b.amount - a.amount);
    }, [paid]);
    const methods = useMemo(() => [...new Set(rows.map(r => r.method).filter(Boolean))], [rows]);
    const counts = useMemo(() => ({
        ALL: rows.length,
        paid: paid.length,
        pending: pending.length,
        failed: failed.length,
    }), [rows, paid, pending, failed]);
    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter(r => {
            const statusMatch = tab === 'ALL' || (tab === 'failed' ? ['failed', 'expired'].includes(r.status) : r.status === tab);
            if (!statusMatch) return false;
            if (method !== 'ALL' && r.method !== method) return false;
            if (!q) return true;
            return `${r.order_id} ${r.customer_name} ${r.method} ${r.payment_type}`.toLowerCase().includes(q);
        });
    }, [rows, tab, method, query]);

    async function syncStatuses(targets) {
        if (!configured) return toast.error('Midtrans belum dikonfigurasi. Isi kunci API terlebih dahulu.');
        if (!targets.length) return toast.info('Tidak ada pembayaran yang menunggu.');
        setSyncing(true);
        let changed = 0, errors = 0;
        for (const row of targets.slice(0, 12)) {
            try {
                const res = await fetch(`/api/midtrans/status/${encodeURIComponent(row.order_id)}`);
                const data = await res.json().catch(() => ({}));
                if (!res.ok) { errors += 1; continue; }
                setOverrides(prev => ({ ...prev, [row.order_id]: { status: data.status, method: data.method || row.method } }));
                changed += 1;
            }
            catch { errors += 1; }
        }
        setSyncing(false);
        if (changed) { toast.success(`${changed} status pembayaran diperbarui.`); router.refresh(); }
        if (errors) toast.error(`${errors} status gagal dicek ke Midtrans.`);
    }

    async function checkOne(row) {
        if (!configured) return toast.error('Midtrans belum dikonfigurasi.');
        setChecking(row.order_id);
        try {
            const res = await fetch(`/api/midtrans/status/${encodeURIComponent(row.order_id)}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Gagal mengambil status.');
            setOverrides(prev => ({ ...prev, [row.order_id]: { status: data.status, method: data.method || row.method } }));
            setSelected(prev => (prev && prev.order_id === row.order_id ? { ...prev, status: data.status, method: data.method || prev.method } : prev));
            toast.success(`${row.order_id}: ${STATUS_META[data.status]?.[0] || data.status}.`);
        }
        catch (err) { toast.error(err.message); }
        finally { setChecking(''); }
    }

    async function copyOrderId(orderId) {
        try { await navigator.clipboard.writeText(orderId); toast.success('ID transaksi disalin.'); }
        catch { toast.error('Gagal menyalin ID transaksi.'); }
    }

    return <div className="flex flex-col gap-5">
        <PageHeader title="Pembayaran" description="Pantau transaksi gateway, sinkronkan status, dan kelola konfigurasi Midtrans Snap.">
            <span className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[11px] font-bold ${configured ? 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-500' : 'border-amber-500/25 bg-amber-500/[0.06] text-amber-500'}`}><span className={`size-1.5 rounded-full ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`}/>{environment === 'production' ? 'PRODUCTION' : environment === 'sandbox' ? 'SANDBOX' : 'BELUM DIKONFIGURASI'}</span>
            <Button variant="outline" onClick={() => syncStatuses(pending)} disabled={syncing || !pending.length || !configured}>{syncing ? <Loader2 data-icon="inline-start" className="animate-spin"/> : <RefreshCw data-icon="inline-start"/>}{syncing ? 'Menyinkronkan...' : 'Sinkronkan'}</Button>
        </PageHeader>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-card"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">Volume Berhasil</p><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500"><Wallet className="size-5"/></span></div><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{rupiah(volume)}</strong><p className="mt-1 text-xs text-muted-foreground">{paid.length} transaksi lunas</p></div>
            <div className="metric-card"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">Tingkat Keberhasilan</p><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><TrendingUp className="size-5"/></span></div><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{Math.round(successRate)}%</strong><div className="progress-track mt-2"><span style={{ width: `${successRate}%`, background: successRate >= 80 ? '#10b981' : successRate >= 50 ? '#f59e0b' : 'var(--primary)' }}/></div><p className="mt-1 text-xs text-muted-foreground">{paid.length} dari {rows.length} transaksi</p></div>
            <div className={`metric-card ${pending.length ? 'warning' : ''}`}><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">Menunggu Pembayaran</p><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500"><Clock3 className="size-5"/></span></div><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{pending.length}</strong><p className="mt-1 text-xs text-muted-foreground">{rupiah(pendingAmount)} belum masuk</p></div>
            <div className="metric-card"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">Gagal / Kadaluarsa</p><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-500"><XCircle className="size-5"/></span></div><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{failed.length}</strong><p className="mt-1 text-xs text-muted-foreground">stok tidak dipotong</p></div>
        </section>

        <section className="grid items-start gap-4 xl:grid-cols-2">
            <PaymentGatewayCard environment={environment} volume={volume} totalCount={rows.length} paidCount={paid.length} pendingCount={pending.length} failedCount={failed.length} pendingAmount={pendingAmount} successRate={successRate}/>
            <PaymentBreakdown series={series} sample={false}/>
        </section>

        <Card className="rounded-[17px]">
            <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Riwayat Pembayaran</CardTitle><CardDescription>Transaksi gateway dari Midtrans dan kasir.</CardDescription></div><Link href="/kasir" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline">Buat transaksi<ArrowUpRight className="size-3.5"/></Link></CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col gap-3 border-b border-border p-3.5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="input-with-icon min-w-0 flex-1"><Search className="size-4"/><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari ID transaksi, pelanggan, atau metode..." className="h-10"/></div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex gap-1.5">{TABS.map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${tab === value ? 'bg-primary text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{label}<span className="rounded-full bg-black/10 px-1.5 font-mono text-[10px] dark:bg-white/10">{counts[value]}</span></button>)}</div>
                        <Select value={method} onValueChange={setMethod}><SelectTrigger className="h-9 w-fit min-w-[150px] bg-card"><SelectValue placeholder="Semua Metode"/></SelectTrigger><SelectContent><SelectGroup><SelectItem value="ALL">Semua Metode</SelectItem>{methods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectGroup></SelectContent></Select>
                    </div>
                </div>
                <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px]"><thead><tr className="border-b border-border">{[['ID Transaksi', 'left'], ['Tanggal', 'left'], ['Pelanggan', 'left'], ['Metode', 'left'], ['Status', 'left'], ['Jumlah', 'right'], ['Aksi', 'right']].map(([h, align]) => <th key={h} className={`px-3.5 py-2.5 font-medium uppercase tracking-wide ${align === 'right' ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
                    <tbody>{shown.map(r => <tr key={`${r.source}-${r.id}`} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                        <td className="px-3.5 py-3 font-mono text-xs">{r.order_id}</td>
                        <td className="px-3.5 py-3 whitespace-nowrap text-[13px] text-muted-foreground">{rowDate(r)}</td>
                        <td className="px-3.5 py-3 text-[13px]">{r.customer_name || 'Pelanggan Umum'}</td>
                        <td className="px-3.5 py-3 text-[13px]">{r.method || '—'}</td>
                        <td className="px-3.5 py-3"><StatusBadge status={r.status}/></td>
                        <td className="px-3.5 py-3 text-right text-[13px] font-semibold">{rupiah(r.amount)}</td>
                        <td className="px-3.5 py-3 text-right"><Button variant="outline" size="sm" onClick={() => setSelected(r)}><Eye data-icon="inline-start"/>Detail</Button></td>
                    </tr>)}</tbody></table></div>
                <div className="grid gap-3 p-3 md:hidden">{shown.map(r => <article key={`${r.source}-${r.id}`} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-mono text-[10px] text-muted-foreground">{r.order_id}</p><h2 className="mt-1 truncate text-sm font-semibold">{r.customer_name || 'Pelanggan Umum'}</h2></div><StatusBadge status={r.status}/></div>
                    <div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted-foreground">{r.method || '—'} · {rowDate(r)}</span><strong className="text-[15px]">{rupiah(r.amount)}</strong></div>
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setSelected(r)}><Eye data-icon="inline-start"/>Lihat Detail</Button>
                </article>)}</div>
                {!shown.length && <div className="grid place-items-center gap-1 px-4 py-14 text-center"><p className="text-sm font-semibold">{rows.length ? 'Tidak ada pembayaran yang cocok.' : 'Belum ada pembayaran'}</p><p className="text-xs text-muted-foreground">{rows.length ? 'Ubah kata kunci atau filter status.' : 'Transaksi QRIS/Transfer dari kasir akan muncul di sini.'}</p></div>}
            </CardContent>
        </Card>

        <GatewayConfigCard environment={environment} hasServerKey={hasServerKey} hasClientKey={hasClientKey} supabaseConnected={supabaseConnected} webhookPath="/api/midtrans/notification"/>

        <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}>
            <DialogContent className="sm:max-w-lg">
                {selected && <>
                    <DialogHeader><DialogTitle className="flex flex-wrap items-center gap-2">Detail Pembayaran<StatusBadge status={selected.status}/></DialogTitle><DialogDescription className="font-mono text-xs">{selected.order_id}</DialogDescription></DialogHeader>
                    <div className="rounded-2xl border border-border bg-muted/60 p-4"><p className="text-xs text-muted-foreground">Jumlah</p><strong className="mt-1 block text-2xl font-bold tracking-[-.03em]">{rupiah(selected.amount)}</strong><p className="mt-1 text-[11px] text-muted-foreground">{selected.source === 'midtrans' ? 'Tersimpan di Supabase' : 'Tercatat dari kasir'}</p></div>
                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                        {[['Pelanggan', selected.customer_name || 'Pelanggan Umum'], ['Metode', selected.method || '—'], ['Tipe pembayaran', selected.payment_type || '—'], ['Dibuat', rowDate(selected)], ['Dibayar', selected.paid_at ? dateText(selected.paid_at) : '—'], ['Sumber', selected.source === 'midtrans' ? 'Midtrans' : 'Kasir']].map(([label, value]) => <div key={label}><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 truncate font-semibold">{value}</p></div>)}
                    </div>
                    {selected.items?.length > 0 && <div className="rounded-xl border border-border p-3"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Item</p><div className="grid gap-1.5">{selected.items.map((item, i) => <div key={`${item.productId}-${i}`} className="flex items-center justify-between gap-2 text-[12px]"><span className="min-w-0 truncate">{item.quantity}× {item.productName}</span><strong className="shrink-0">{rupiah(item.price * item.quantity)}</strong></div>)}</div></div>}
                    {selected.payload && <div><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Payload Midtrans</p><pre className="max-h-40 overflow-auto rounded-xl bg-muted p-3 font-mono text-[10px] leading-relaxed">{JSON.stringify(selected.payload, null, 2)}</pre></div>}
                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" onClick={() => copyOrderId(selected.order_id)}><Copy data-icon="inline-start"/>Salin ID</Button>
                        <Button onClick={() => checkOne(selected)} disabled={!configured || checking === selected.order_id}>{checking === selected.order_id ? <Loader2 data-icon="inline-start" className="animate-spin"/> : <RefreshCw data-icon="inline-start"/>}{checking === selected.order_id ? 'Mengecek...' : 'Cek Status'}</Button>
                    </DialogFooter>
                </>}
            </DialogContent>
        </Dialog>
    </div>;
}
