'use client';
import { useMemo, useState } from 'react';
import { CheckCircle2, Minus, Plus, Search, ShoppingCart, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { products, rupiah } from '@/lib/demo-data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const categories = ['Semua', ...[...new Set(products.map(p => p.category))]];

function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function StockChip({ stock, minimum }) {
    const cls = stock === 0 ? 'out' : stock <= minimum ? 'low' : '';
    return <span className={`stock-chip ${cls}`}>{stock === 0 ? 'HABIS' : `${stock} ${minimum ? 'unit' : ''}`}</span>;
}

export default function PosPage() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('Semua');
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paid, setPaid] = useState(0);
    const [success, setSuccess] = useState(false);
    const [method, setMethod] = useState('Tunai');
    const [customer, setCustomer] = useState('umum');
    const [gwOrderId, setGwOrderId] = useState(null);
    const shown = useMemo(() => products.filter(p => `${p.name} ${p.code}`.toLowerCase().includes(query.toLowerCase()) && (category === 'Semua' || p.category === category)), [query, category]);
    const subtotal = cart.reduce((s, i) => s + i.product.sellingPrice * i.qty, 0);
    const total = Math.max(0, subtotal - discount);
    const change = Math.max(0, paid - total);
    const count = cart.reduce((s, i) => s + i.qty, 0);
    function add(p) { if (p.stock === 0)
        return toast.error('Stok produk habis.'); setCart(c => { const found = c.find(i => i.product.id === p.id); if (found) {
        if (found.qty >= p.stock) {
            toast.error('Jumlah melebihi stok tersedia.');
            return c;
        }
        return c.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
    } return [...c, { product: p, qty: 1 }]; }); }
    function qty(id, delta) { setCart(c => c.map(i => i.product.id === id ? { ...i, qty: Math.min(i.product.stock, Math.max(1, i.qty + delta)) } : i)); }
    const customerNames = { umum: 'Pelanggan Umum', budi: 'Budi Santoso', siti: 'Siti Aminah' };
    function loadSnap() {
        return new Promise((resolve) => {
            if (window.snap)
                return resolve();
            const s = document.createElement('script');
            s.src = (process.env.NEXT_PUBLIC_MIDTRANS_PRODUCTION === 'true' ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com') + '/snap/snap.js';
            s.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
            s.onload = () => resolve();
            s.onerror = () => resolve();
            document.body.appendChild(s);
        });
    }
    function payViaSnap() {
        const orderId = `TRX-${Date.now()}`;
        (async () => {
            let res;
            try {
                res = await fetch('/api/midtrans/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, grossAmount: total, customer: { name: customerNames[customer] || customerNames.umum }, items: cart.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.sellingPrice, qty: i.qty })) }) });
            }
            catch {
                return toast.error('Tidak dapat terhubung ke server pembayaran.');
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                return toast.error(data.error || 'Gagal membuat pembayaran.');
            await loadSnap();
            const snap = window.snap;
            if (!snap)
                return toast.error('Snap Midtrans gagal dimuat.');
            snap.pay(data.token, {
                onSuccess: () => { setGwOrderId(orderId); setSuccess(true); },
                onPending: () => toast.info('Pembayaran menunggu konfirmasi.'),
                onError: () => toast.error('Pembayaran gagal.'),
                onClose: () => toast.info('Popup pembayaran ditutup, transaksi batal.'),
            });
        })();
    }
    function pay() { if (!cart.length)
        return toast.error('Keranjang masih kosong.'); const midtransEnabled = Boolean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY); if (midtransEnabled && (method === 'QRIS' || method === 'Transfer'))
        return payViaSnap(); if (paid < total)
        return toast.error('Jumlah bayar belum mencukupi.'); setGwOrderId(null); setSuccess(true); }
    return <div className="flex flex-col gap-5"><PageHeader eyebrow="TERMINAL POS" title="Kasir" description="Transaksi penjualan cepat dan akurat."> <span className="hidden items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2 sm:flex"><span className="live-dot"/>SESSION ACTIVE · <span className="font-mono text-xs">TRX-014</span></span></PageHeader>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.85fr)_420px]">
      <section className="min-w-0">
        <div className="mb-4 grid gap-3">
          <div className="input-with-icon"><Search className="size-4"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari produk, kode SKU..." className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/10"/></div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">{categories.map(c => <button key={c} type="button" onClick={() => setCategory(c)} className={cnTab(category === c)}>{c}</button>)}</div>
        </div>
        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-red-500/15 bg-red-500/[0.05] px-4 py-3"><div className="flex items-center gap-2.5"><Zap className="size-4 text-primary"/><span><strong className="block text-[13px]">Quick SKU lookup</strong><small className="mt-0.5 block text-[11px] text-muted-foreground">Gunakan Ctrl K dari mana pun untuk mencari item</small></span></div><kbd>Ctrl K</kbd></div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{shown.map(p => <article key={p.id} className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-500/40"><div className="flex items-center justify-between gap-2"><span className="grid size-9 place-items-center rounded-[10px] bg-muted font-mono text-[11px] font-extrabold text-primary">{initials(p.name)}</span><StockChip stock={p.stock} minimum={p.minimumStock}/></div><p className="mt-3 font-mono text-[10px] text-muted-foreground">{p.code}</p><h2 className="mt-0.5 text-[15px] leading-snug font-semibold">{p.name}</h2><p className="mt-1 text-[11px] text-muted-foreground">{p.category} · {p.unit}</p><div className="mt-auto flex items-center justify-between gap-2 pt-4"><strong className="text-[15px]">{rupiah(p.sellingPrice)}</strong><Button size="sm" onClick={() => add(p)} disabled={p.stock === 0}><Plus data-icon="inline-start"/>Tambah</Button></div></article>)}
        {!shown.length && <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">Tidak ada produk yang cocok dengan pencarian.</div>}
        </div>
      </section>
      <Card className="rounded-[17px] shadow-xl xl:sticky xl:top-[100px]"><CardContent className="p-4">
        <div className="flex items-center justify-between border-b border-border pb-3"><h2 className="text-lg font-bold">Keranjang</h2><span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground">{count} ITEM</span></div>
        <div className="max-h-[300px] min-h-[120px] overflow-y-auto border-b border-border py-2">{cart.length === 0 ? <div className="grid h-[120px] place-items-center text-center"><div><ShoppingCart className="mx-auto size-9 text-muted-foreground/30"/><p className="mt-2 text-sm font-semibold">Keranjang masih kosong</p><p className="text-[11px] text-muted-foreground">Pilih produk untuk memulai transaksi.</p></div></div> : cart.map(i => <div key={i.product.id} className="border-b border-border py-2.5 last:border-0"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-[13px] font-semibold">{i.product.name}</h3><p className="font-mono text-[10px] text-muted-foreground">{i.product.sellingPrice.toLocaleString('id-ID')}</p></div><div className="text-right"><strong className="block text-[13px]">{rupiah(i.product.sellingPrice * i.qty)}</strong><button type="button" className="mt-0.5 text-red-500 hover:text-red-400" onClick={() => setCart(c => c.filter(x => x.product.id !== i.product.id))} aria-label="Hapus"><Trash2 className="size-3.5"/></button></div></div><div className="mt-1.5 flex items-center gap-2"><button type="button" className="grid size-7 place-items-center rounded-lg border border-border bg-muted" onClick={() => qty(i.product.id, -1)} aria-label="Kurangi"><Minus className="size-3.5"/></button><span className="w-7 text-center text-sm font-bold">{i.qty}</span><button type="button" className="grid size-7 place-items-center rounded-lg border border-border bg-muted" onClick={() => qty(i.product.id, 1)} aria-label="Tambah"><Plus className="size-3.5"/></button></div></div>)}</div>
        <div className="flex flex-col gap-3 pt-3">
          <Select value={customer} onValueChange={setCustomer}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="umum">Pelanggan Umum</SelectItem><SelectItem value="budi">Budi Santoso</SelectItem><SelectItem value="siti">Siti Aminah</SelectItem></SelectGroup></SelectContent></Select>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
          <div className="flex items-center gap-3"><label htmlFor="discount" className="flex-1 text-sm text-muted-foreground">Diskon</label><input id="discount" type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="h-9 w-28 rounded-lg border border-border bg-transparent px-2.5 text-right text-sm outline-none focus:border-primary"/></div>
          <div className="flex items-end justify-between border-t border-dashed border-border pt-3"><span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Total</span><strong className="text-[25px] leading-none text-primary">{rupiah(total)}</strong></div>
          <Select value={method} onValueChange={setMethod}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{['Tunai', 'Transfer', 'QRIS'].map(x => <SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectGroup></SelectContent></Select>
          <input type="number" value={paid || ''} onChange={e => setPaid(Number(e.target.value))} placeholder="Jumlah Bayar" className="h-11 w-full rounded-xl border border-border bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/10"/>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Kembalian</span><strong className={change > 0 ? 'text-emerald-400' : ''}>{rupiah(change)}</strong></div>
          <div className="grid grid-cols-[1fr_1.7fr] gap-2"><Button variant="outline" size="lg" onClick={() => { setCart([]); setDiscount(0); setPaid(0); }}>Batal</Button><Button size="lg" onClick={pay}>Bayar</Button></div>
        </div>
      </CardContent></Card>
    </div>
    <Dialog open={success} onOpenChange={setSuccess}><DialogContent className="rounded-2xl"><DialogHeader><div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-9"/></div><DialogTitle className="text-center text-2xl font-bold">Transaksi Berhasil</DialogTitle><DialogDescription className="text-center">Pembayaran telah disimpan dan stok otomatis diperbarui.</DialogDescription></DialogHeader><div className="rounded-xl bg-muted p-5"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Nomor</span><strong className="font-mono">{gwOrderId || 'TRX-260827-019'}</strong></div>{gwOrderId && <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Metode</span><strong>Midtrans Snap · {method}</strong></div>}<div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Total</span><strong>{rupiah(total)}</strong></div>{!gwOrderId && <><div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Bayar</span><strong>{rupiah(paid)}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Kembalian</span><strong>{rupiah(change)}</strong></div></>}</div><DialogFooter className="grid sm:grid-cols-2"><Button variant="outline">Cetak Struk</Button><Button onClick={() => { setCart([]); setDiscount(0); setSuccess(false); setPaid(0); setGwOrderId(null); }}>Transaksi Baru</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function cnTab(active) {
    return `flex h-9 shrink-0 items-center rounded-lg px-3.5 text-[13px] font-semibold transition-colors ${active ? 'border border-primary bg-primary text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`;
}