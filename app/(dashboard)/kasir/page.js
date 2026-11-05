'use client';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CreditCard, Check, Minus, Plus, Search, ShoppingCart, Trash2, TriangleAlert, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { rupiah, todayISO } from '@/lib/demo-data';
import { formatThousands, parseThousands } from '@/lib/money-format';
import { checkoutStockSale, listStockCustomers, listStockProducts } from '@/lib/supabase/stock-products';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReceiptSheet } from '@/components/receipt-sheet';
import { QrisPaymentDialog } from '@/components/qris-payment-dialog';

function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function StockChip({ stock, minimum }) {
    const cls = stock === 0 ? 'out' : stock <= minimum ? 'low' : '';
    return <span className={`stock-chip ${cls}`}>{stock === 0 ? 'HABIS' : `${stock} ${minimum ? 'unit' : ''}`}</span>;
}

export default function PosPage() {
    const [catalog, setCatalog] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [query, setQuery] = useState('');
    useEffect(() => {
        let live = true;
        const supabase = createClient();
        const refresh = () => listStockProducts().then(rows => { if (live) setCatalog(rows); }).catch(error => toast.error(error.message || 'Gagal memuat katalog Supabase.'));
        refresh();
        listStockCustomers().then(rows => { if (live) setCustomers(rows); }).catch(error => toast.error(error.message || 'Gagal memuat pelanggan.'));
        const channel = supabase.channel('kasir-stock-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refresh).subscribe();
        return () => { live = false; supabase.removeChannel(channel); };
    }, []);
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem('pending_service_orders');
            const list = raw ? JSON.parse(raw) : [];
            if (Array.isArray(list) && list.length > 0) {
                const params = new URLSearchParams(window.location.search);
                const sId = params.get('serviceId');
                const matched = sId ? list.find(x => x.id === sId) : list[0];
                if (matched) setPendingService(matched);
            }
        } catch (e) {}
    }, []);
    const [category, setCategory] = useState('Semua');
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paid, setPaid] = useState(0);
    const [success, setSuccess] = useState(false);
    const [method, setMethod] = useState('Tunai');
    const [customer, setCustomer] = useState('umum');
    const [gwOrderId, setGwOrderId] = useState(null);
    const [showStruk, setShowStruk] = useState(false);
    const [orderCode, setOrderCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [showQris, setShowQris] = useState(false);
    const [pendingService, setPendingService] = useState(null);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [serviceMethod, setServiceMethod] = useState('Tunai');
    const [servicePaidAmount, setServicePaidAmount] = useState(0);
    const [serviceBusy, setServiceBusy] = useState(false);
    const [serviceReceipt, setServiceReceipt] = useState(null);
    const [serviceQrisOpen, setServiceQrisOpen] = useState(false);
    const committedRef = useRef(new Set());
    const idempotencyRef = useRef(new Map());
    const categories = useMemo(() => ['Semua', ...new Set(catalog.map(p => p.category).filter(Boolean))], [catalog]);
    const shortage = useMemo(() => {
        const live = new Map(catalog.map(p => [p.id, p.stock]));
        return cart.filter(i => !i.product?.isService && i.qty > (live.get(i.product.id) ?? 0));
    }, [cart, catalog]);
    const shown = useMemo(() => catalog.filter(p => `${p.name} ${p.code}`.toLowerCase().includes(query.toLowerCase()) && (category === 'Semua' || p.category === category)), [query, category, catalog]);
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
    function qty(id, delta) { const live = catalog.find(p => p.id === id); const cap = live?.stock ?? 0; setCart(c => c.map(i => i.product.id === id ? { ...i, qty: Math.min(cap, Math.max(1, i.qty + delta)) } : i)); }
    const customerNames = Object.fromEntries(customers.map(row => [row.id, row.name]));
    const customerName = customerNames[customer] || 'Pelanggan Umum';

    /**
     * Satu order hanya boleh masuk satu kali. Midtrans bisa memanggil
     * onSuccess berulang, dan tombol Bayar bisa diklik dua kali, jadi kode
     * transaksi dipakai sebagai kunci idempotensi.
     *
     * Kalau uang sudah masuk tapi stok habis karena dipakai kasir lain, sales
     * tetap dicatat dengan status perlu tinjauan supaya uang tidak hilang,
     * lalu stoknya dicatat lewat Barang Masuk atau koreksi manual.
     */
    async function commitSale(gatewayOrderId) {
        const code = gatewayOrderId || `TRX-${todayISO().replaceAll('-', '').slice(2)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        if (committedRef.current.has(code)) return true;
        if (!idempotencyRef.current.has(code)) idempotencyRef.current.set(code, crypto.randomUUID());
        try {
            const stockItems = cart.filter(i => !i.product?.isService);
            if (stockItems.length > 0) {
                await checkoutStockSale({ code, idempotencyKey: idempotencyRef.current.get(code),
                items: stockItems.map(i => ({ product_id: i.product.id, quantity: i.qty })),
                discount, method, paid: gatewayOrderId ? total : paid,
                customerId: customer === 'umum' ? null : customer });
            } else {
                await fetch('/api/servis/bayar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId: code, customer: customerName, job: cart.map(i => i.product.name).join(', '), totalBill: total, method, paidAmount: gatewayOrderId ? total : paid, changeAmount: change }) });
            }
            committedRef.current.add(code);
            setOrderCode(code);
            setCatalog(await listStockProducts());
            return true;
        } catch (error) {
            toast.error(error.message || 'Transaksi gagal disimpan ke Supabase.');
            setCatalog(await listStockProducts().catch(() => catalog));
            return false;
        }
    }
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
        const orderId = `TRX-${todayISO().replaceAll('-', '').slice(2)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        (async () => {
            let res;
            try {
                res = await fetch('/api/midtrans/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, grossAmount: total, customer: { name: customerName }, items: cart.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.sellingPrice, qty: i.qty })) }) });
            }
            catch {
                setBusy(false);
                return toast.error('Tidak dapat terhubung ke server pembayaran.');
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setBusy(false); return toast.error(data.error || 'Gagal membuat pembayaran.'); }
            await loadSnap();
            const snap = window.snap;
            if (!snap) { setBusy(false); return toast.error('Snap Midtrans gagal dimuat.'); }
            snap.pay(data.token, {
                onSuccess: async () => { setGwOrderId(orderId); if (await commitSale(orderId)) { setBusy(false); setSuccess(true); } else setBusy(false); },
                onPending: () => { setBusy(false); toast.info('Pembayaran menunggu konfirmasi.'); },
                onError: () => { setBusy(false); toast.error('Pembayaran gagal.'); },
                onClose: () => { setBusy(false); toast.info('Popup pembayaran ditutup, transaksi batal.'); },
            });
        })();
    }
    async function pay() {
        if (busy) return;
        if (!cart.length) return toast.error('Keranjang masih kosong.');
        if (shortage.length) { toast.error('Stok berubah sejak barang masuk keranjang.'); return; }
        const midtransEnabled = Boolean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY && !process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY.startsWith('your-') && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY !== 'your-client-key');
        if (method === 'QRIS') { setShowQris(true); return; }
        if (method === 'Transfer') {
            if (midtransEnabled) { setBusy(true); return payViaSnap(); }
            setBusy(true);
            setGwOrderId(null);
            if (await commitSale(null)) { setBusy(false); setSuccess(true); }
            else setBusy(false);
            return;
        }
        if (paid < total) return toast.error('Jumlah bayar belum mencukupi.');
        setBusy(true);
        setGwOrderId(null);
        if (await commitSale(null)) { setBusy(false); setSuccess(true); }
        else setBusy(false);
    }
    function handleQrisSuccess({ orderId, totalAmount, method: paidMethod }) {
        setShowQris(false);
        setGwOrderId(orderId);
        setOrderCode(orderId);
        setPaid(totalAmount);
        committedRef.current.add(orderId);
        listStockProducts().then(rows => setCatalog(rows)).catch(() => {});
        setSuccess(true);
        setShowStruk(true);
    }
    function loadServiceToCart(service) {
        if (!service) return;
        const fee = Number(service.serviceFee || 35000);
        const serviceItem = {
            product: {
                id: `jasa-${service.id}`,
                code: 'JASA',
                name: `Jasa: ${service.job}${service.plate ? ` (${service.plate})` : ''}`,
                sellingPrice: fee,
                stock: 999,
                unit: 'layanan',
                category: 'Jasa Servis',
                isService: true,
            },
            qty: 1,
        };

        const partItems = (service.parts || []).map(p => {
            const live = catalog.find(x => x.id === p.productId) || {
                id: p.productId,
                code: p.productCode,
                name: p.productName,
                sellingPrice: Number(p.sellingPrice || 0),
                stock: 999,
                unit: p.unit || 'pcs',
                category: 'Sparepart',
            };
            return {
                product: live,
                qty: p.quantity || 1,
            };
        });

        setCart(prev => {
            const next = [...prev];
            if (!next.some(i => i.product.id === serviceItem.product.id)) {
                next.push(serviceItem);
            }
            for (const pi of partItems) {
                const exist = next.find(i => i.product.id === pi.product.id);
                if (exist) {
                    exist.qty = Math.max(exist.qty, pi.qty);
                } else {
                    next.push(pi);
                }
            }
            return next;
        });

        try {
            const raw = window.localStorage.getItem('pending_service_orders');
            const list = raw ? JSON.parse(raw) : [];
            const filtered = list.filter(x => x.id !== service.id);
            window.localStorage.setItem('pending_service_orders', JSON.stringify(filtered));
        } catch (e) {}

        setPendingService(null);
        toast.success(`Jasa servis & ${partItems.length} sparepart berhasil dimuat ke keranjang!`);
    }

    function dismissPendingService() {
        setPendingService(null);
    }

    async function handlePayServiceNow() {
        if (!pendingService) return;
        const totalBill = Number(pendingService.totalBill || pendingService.serviceFee || 35000);
        if (serviceMethod === 'Tunai' && servicePaidAmount < totalBill) {
            return toast.error('Jumlah uang tunai yang dibayar belum mencukupi.');
        }
        if (serviceMethod === 'QRIS') {
            setServiceQrisOpen(true);
            return;
        }

        setServiceBusy(true);
        try {
            const finalPaid = serviceMethod === 'Transfer BCA' ? totalBill : (servicePaidAmount || totalBill);
            const change = Math.max(0, finalPaid - totalBill);
            const res = await fetch('/api/servis/bayar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: pendingService.id,
                    customer: pendingService.customer,
                    plate: pendingService.plate,
                    brand: pendingService.brand,
                    job: pendingService.job,
                    totalBill,
                    method: serviceMethod,
                    paidAmount: finalPaid,
                    changeAmount: change,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal memproses pembayaran servis.');

            try {
                const raw = window.localStorage.getItem('dian-motor-services');
                const list = raw ? JSON.parse(raw) : [];
                const updated = list.map(s => s.id === pendingService.id ? { ...s, status: 'Selesai', paid: true, paidAt: new Date().toISOString() } : s);
                window.localStorage.setItem('dian-motor-services', JSON.stringify(updated));
            } catch (e) {}

            try {
                const raw = window.localStorage.getItem('pending_service_orders');
                const list = raw ? JSON.parse(raw) : [];
                window.localStorage.setItem('pending_service_orders', JSON.stringify(list.filter(s => s.id !== pendingService.id)));
            } catch (e) {}

            const receiptItems = [
                { qty: 1, product: { name: `Jasa: ${pendingService.job} (${pendingService.plate || 'Motor'})`, sellingPrice: Number(pendingService.serviceFee || totalBill) } },
                ...(pendingService.parts || []).map(p => ({ qty: p.quantity || 1, product: { name: p.productName || 'Sparepart', sellingPrice: Number(p.sellingPrice || 0) } }))
            ];
            setServiceReceipt({
                orderId: data.transactionCode,
                customer: `${pendingService.customer} (${pendingService.plate || 'Motor'})`,
                items: receiptItems,
                subtotal: totalBill,
                discount: 0,
                total: totalBill,
                method: serviceMethod,
                paid: finalPaid,
                change,
            });

            toast.success(`Pembayaran servis ${pendingService.id} berhasil diselesaikan!`);
            setServiceModalOpen(false);
            setPendingService(null);
            setShowStruk(true);
        } catch (err) {
            toast.error(err.message || 'Gagal memproses pembayaran.');
        } finally {
            setServiceBusy(false);
        }
    }
    function resetPos() { setCart([]); setDiscount(0); setPaid(0); setSuccess(false); setGwOrderId(null); setOrderCode(''); setShowStruk(false); setBusy(false); committedRef.current.clear(); idempotencyRef.current.clear(); }
    return <div className="flex flex-col gap-5"><PageHeader title="Kasir" description="Transaksi penjualan cepat dan akurat."></PageHeader>
      {pendingService && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 shadow-sm animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wrench className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white bg-emerald-700/60 px-2 py-0.5 rounded">
                  {pendingService.id}
                </span>
                <p className="text-sm font-bold text-foreground">
                  {pendingService.customer} <span className="text-emerald-400 font-mono">({pendingService.plate || pendingService.brand || 'Motor'})</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pekerjaan: <strong className="text-foreground">{pendingService.job}</strong> {pendingService.complaint ? `· Keluhan: "${pendingService.complaint}"` : ''} · Total Biaya Servis: <strong className="text-emerald-400 text-sm font-mono">{rupiah(pendingService.totalBill || pendingService.serviceFee || 35000)}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => { setServicePaidAmount(Number(pendingService.totalBill || pendingService.serviceFee || 35000)); setServiceModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9">
              <CreditCard className="size-3.5 mr-1"/> Bayar Tagihan Servis ({rupiah(pendingService.totalBill || pendingService.serviceFee || 35000)})
            </Button>
            <Button size="sm" variant="outline" onClick={() => loadServiceToCart(pendingService)} className="h-9 text-xs">
              <Plus className="size-3.5 mr-1"/> + Keranjang POS
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissPendingService} className="h-9 text-xs text-muted-foreground hover:text-foreground">
              Abaikan
            </Button>
          </div>
        </div>
      )}
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.85fr)_420px]">
      <section className="min-w-0">
        <div className="mb-4 grid gap-3">
          <div className="input-with-icon"><Search className="size-4"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari produk, kode SKU..." className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/10"/></div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">{categories.map(c => <button key={c} type="button" onClick={() => setCategory(c)} className={cnTab(category === c)}>{c}</button>)}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{shown.map(p => <article key={p.id} className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-500/40"><div className="flex items-center justify-between gap-2"><span className="grid size-9 place-items-center rounded-[10px] bg-muted font-mono text-[11px] font-extrabold text-primary">{initials(p.name)}</span><StockChip stock={p.stock} minimum={p.minimumStock}/></div><p className="mt-3 font-mono text-[10px] text-muted-foreground">{p.code}</p><h2 className="mt-0.5 text-[15px] leading-snug font-semibold">{p.name}</h2><p className="mt-1 text-[11px] text-muted-foreground">{p.category} · {p.unit}</p><div className="mt-auto flex items-center justify-between gap-2 pt-4"><strong className="text-[15px]">{rupiah(p.sellingPrice)}</strong><Button size="sm" onClick={() => add(p)} disabled={p.stock === 0}><Plus data-icon="inline-start"/>Tambah</Button></div></article>)}
        {!shown.length && <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">Tidak ada produk yang cocok dengan pencarian.</div>}
        </div>
      </section>
      <Card className="rounded-[17px] shadow-xl xl:sticky xl:top-[100px]"><CardContent className="p-4">
        <div className="flex items-center justify-between border-b border-border pb-3"><h2 className="text-lg font-bold">Keranjang</h2><span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground">{count} ITEM</span></div>
        <div className="max-h-[300px] min-h-[120px] overflow-y-auto border-b border-border py-2">{cart.length === 0 ? <div className="grid h-[120px] place-items-center text-center"><div><ShoppingCart className="mx-auto size-9 text-muted-foreground/30"/><p className="mt-2 text-sm font-semibold">Keranjang masih kosong</p><p className="text-[11px] text-muted-foreground">Pilih produk untuk memulai transaksi.</p></div></div> : cart.map(i => <div key={i.product.id} className="border-b border-border py-2.5 last:border-0"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-[13px] font-semibold">{i.product.name}</h3><p className="font-mono text-[10px] text-muted-foreground">{i.product.sellingPrice.toLocaleString('id-ID')}</p></div><div className="text-right"><strong className="block text-[13px]">{rupiah(i.product.sellingPrice * i.qty)}</strong><button type="button" className="mt-0.5 text-red-500 hover:text-red-400" onClick={() => setCart(c => c.filter(x => x.product.id !== i.product.id))} aria-label="Hapus"><Trash2 className="size-3.5"/></button></div></div><div className="mt-1.5 flex items-center gap-2"><button type="button" className="grid size-7 place-items-center rounded-lg border border-border bg-muted" onClick={() => qty(i.product.id, -1)} aria-label="Kurangi"><Minus className="size-3.5"/></button><span className="w-7 text-center text-sm font-bold">{i.qty}</span><button type="button" className="grid size-7 place-items-center rounded-lg border border-border bg-muted" onClick={() => qty(i.product.id, 1)} aria-label="Tambah"><Plus className="size-3.5"/></button></div></div>)}</div>
        <div className="flex flex-col gap-3 pt-3">
          <Select value={customer} onValueChange={setCustomer}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="umum">Pelanggan Umum</SelectItem>{customers.map(row => <SelectItem value={row.id} key={row.id}>{row.name}</SelectItem>)}</SelectGroup></SelectContent></Select>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
          <div className="flex items-center gap-3"><label htmlFor="discount" className="flex-1 text-sm text-muted-foreground">Diskon</label><input id="discount" type="text" inputMode="numeric" value={formatThousands(discount)} onChange={e => setDiscount(parseThousands(e.target.value))} placeholder="0" className="h-9 w-28 rounded-lg border border-border bg-transparent px-2.5 text-right text-sm outline-none focus:border-primary font-semibold"/></div>
          <div className="flex items-end justify-between border-t border-dashed border-border pt-3"><span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Total</span><strong className="text-[25px] leading-none text-primary">{rupiah(total)}</strong></div>
          <Select value={method} onValueChange={setMethod}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{['Tunai', 'Transfer', 'QRIS'].map(x => <SelectItem value={x} key={x}>{x}</SelectItem>)}</SelectGroup></SelectContent></Select>
          {method === 'QRIS' ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              ⚡ <strong>QRIS Dinamis Aktif:</strong> Klik tombol <strong>Bayar</strong> untuk membuat QR code dan nominal pas otomatis.
            </div>
          ) : method === 'Transfer' ? (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-foreground">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-400 animate-pulse"/>
                  Transfer Bank BCA
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('0461782991');
                    toast.success('No. Rekening BCA berhasil disalin!');
                  }}
                  className="rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-300 hover:bg-blue-500/30 transition-colors"
                >
                  Salin Rekening
                </button>
              </div>
              <p className="font-mono text-base font-extrabold tracking-wider text-white">0461782991</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">A.N: <strong className="text-foreground">DIAN MOTOR (BCA)</strong></p>
              <div className="mt-2 rounded-lg bg-blue-950/40 p-2 text-[10px] text-blue-200 border border-blue-500/20">
                💡 Cek mutasi masuk di BCA Mobile / KlikBCA, lalu klik tombol <strong>Bayar</strong> untuk mencatat lunas.
              </div>
            </div>
          ) : (
            <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span><input type="text" inputMode="numeric" value={formatThousands(paid)} onChange={e => setPaid(parseThousands(e.target.value))} placeholder="Jumlah Bayar (contoh: 50.000)" className="h-11 w-full rounded-xl border border-border bg-transparent pl-10 pr-3.5 text-sm font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/10"/></div>
          )}
          {method === 'Tunai' && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Kembalian</span><strong className={change > 0 ? 'text-emerald-400' : ''}>{rupiah(change)}</strong></div>}
          {shortage.length > 0 && <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2.5 text-xs text-red-600 dark:text-red-400"><TriangleAlert className="mt-0.5 size-4 shrink-0"/>Stok berubah sejak keranjang diisi: {shortage.map(i => `${i.product.name} (sisa ${catalog.find(p => p.id === i.product.id)?.stock ?? 0})`).join(', ')}.</p>}
          <div className="grid grid-cols-[1fr_1.7fr] gap-2"><Button variant="outline" size="lg" onClick={() => { setCart([]); setDiscount(0); setPaid(0); }} disabled={busy}>Batal</Button><Button size="lg" onClick={pay} disabled={shortage.length > 0 || busy}>{busy ? 'Memproses...' : 'Bayar'}</Button></div>
        </div>
      </CardContent></Card>
    </div>
    <Dialog open={success} onOpenChange={o => { if (!o) resetPos(); }}><DialogContent className="rounded-2xl"><DialogHeader><div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-9"/></div><DialogTitle className="text-center text-2xl font-bold">Transaksi Berhasil</DialogTitle><DialogDescription className="text-center">Pembayaran tersimpan dan stok sudah dikurangkan.{gwOrderId && ' Pembayaran nontunai masih menunggu verifikasi.'}</DialogDescription></DialogHeader><div className="rounded-xl bg-muted p-5"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Nomor</span><strong className="font-mono">{orderCode}</strong></div>{gwOrderId && <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Metode</span><strong>Midtrans Snap · {method}</strong></div>}<div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Total</span><strong>{rupiah(total)}</strong></div>{!gwOrderId && <><div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Bayar</span><strong>{rupiah(paid)}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Kembalian</span><strong>{rupiah(change)}</strong></div></>}</div><DialogFooter className="grid sm:grid-cols-2"><Button variant="outline" onClick={() => setShowStruk(true)}>Cetak Struk</Button><Button onClick={resetPos}>Transaksi Baru</Button></DialogFooter></DialogContent></Dialog>
    {showStruk && (
      <ReceiptSheet
        open
        onClose={() => { setShowStruk(false); setServiceReceipt(null); }}
        orderId={serviceReceipt?.orderId || orderCode}
        date={new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        items={serviceReceipt?.items || cart}
        subtotal={serviceReceipt?.subtotal ?? subtotal}
        discount={serviceReceipt?.discount ?? discount}
        total={serviceReceipt?.total ?? total}
        method={serviceReceipt?.method || (method === 'QRIS' ? 'QRIS Dinamis' : (gwOrderId ? `Midtrans Snap · ${method}` : method))}
        customer={serviceReceipt?.customer || customerName}
        paid={serviceReceipt?.paid ?? paid}
        change={serviceReceipt?.change ?? change}
      />
    )}
    <QrisPaymentDialog open={showQris} onClose={() => setShowQris(false)} amount={total} cartItems={cart} customer={{ id: customer, name: customerName }} onSuccess={handleQrisSuccess}/>

    <Dialog open={serviceModalOpen} onOpenChange={o => { if (!o) setServiceModalOpen(false); }}>
        <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <Wrench className="size-6" />
                </div>
                <DialogTitle className="text-center text-xl font-bold">Bayar Tagihan Servis</DialogTitle>
                <DialogDescription className="text-center">
                    Biaya pekerjaan dan sparepart yang telah ditentukan oleh tukang servis.
                </DialogDescription>
            </DialogHeader>
            {pendingService && (
                <div className="flex flex-col gap-4">
                    <div className="rounded-xl border border-border bg-muted/60 p-4">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">No. Servis</span>
                            <strong className="font-mono text-emerald-400">{pendingService.id}</strong>
                        </div>
                        <div className="mt-1.5 flex justify-between text-xs">
                            <span className="text-muted-foreground">Pelanggan / Motor</span>
                            <span className="font-semibold text-foreground">{pendingService.customer} · {pendingService.plate} ({pendingService.brand || 'Motor'})</span>
                        </div>
                        <div className="mt-1.5 flex justify-between text-xs">
                            <span className="text-muted-foreground">Pekerjaan Servis</span>
                            <span className="font-medium text-foreground">{pendingService.job}</span>
                        </div>
                        {pendingService.complaint && (
                            <div className="mt-1.5 flex justify-between text-xs">
                                <span className="text-muted-foreground">Keluhan</span>
                                <span className="italic text-muted-foreground">&ldquo;{pendingService.complaint}&rdquo;</span>
                            </div>
                        )}
                        {(pendingService.parts?.length ?? 0) > 0 && (
                            <div className="mt-2 border-t border-dashed border-border pt-2 text-xs">
                                <span className="text-muted-foreground block mb-1">Sparepart Diganti:</span>
                                <div className="grid gap-1">
                                    {pendingService.parts.map((p, idx) => (
                                        <div key={idx} className="flex justify-between font-mono text-[11px]">
                                            <span>{p.quantity}x {p.productName}</span>
                                            <span>{rupiah((p.sellingPrice || 0) * (p.quantity || 1))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
                            <span>Total Tagihan (Tukang Servis)</span>
                            <strong className="text-lg text-emerald-500 font-mono">{rupiah(pendingService.totalBill || pendingService.serviceFee || 35000)}</strong>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Metode Pembayaran</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setServiceMethod('Tunai')}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-semibold text-xs transition-all",
                                    serviceMethod === 'Tunai' ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold" : "border-border hover:bg-muted"
                                )}
                            >
                                <CheckCircle2 className={cn("size-3.5", serviceMethod === 'Tunai' ? "text-emerald-400" : "opacity-30")} />
                                Tunai
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setServiceMethod('Transfer BCA');
                                    setServicePaidAmount(Number(pendingService.totalBill || pendingService.serviceFee || 35000));
                                }}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-semibold text-xs transition-all",
                                    serviceMethod === 'Transfer BCA' ? "border-blue-500 bg-blue-500/10 text-blue-400 font-bold" : "border-border hover:bg-muted"
                                )}
                            >
                                <CheckCircle2 className={cn("size-3.5", serviceMethod === 'Transfer BCA' ? "text-blue-400" : "opacity-30")} />
                                Transfer BCA
                            </button>
                            <button
                                type="button"
                                onClick={() => setServiceMethod('QRIS')}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-semibold text-xs transition-all",
                                    serviceMethod === 'QRIS' ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold" : "border-border hover:bg-muted"
                                )}
                            >
                                <CheckCircle2 className={cn("size-3.5", serviceMethod === 'QRIS' ? "text-emerald-400" : "opacity-30")} />
                                QRIS
                            </button>
                        </div>
                    </div>

                    {serviceMethod === 'Transfer BCA' && (
                        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-foreground">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-blue-400 animate-pulse"/>
                                    Rekening Transfer Bank BCA
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText('0461782991');
                                        toast.success('No. Rekening BCA disalin!');
                                    }}
                                    className="rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-300 hover:bg-blue-500/30"
                                >
                                    Salin Rekening
                                </button>
                            </div>
                            <p className="font-mono text-base font-extrabold tracking-wider text-white">0461782991</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">A.N: <strong className="text-foreground">DIAN MOTOR (BCA)</strong></p>
                            <div className="mt-2.5 rounded-lg bg-blue-950/40 p-2 text-[10px] text-blue-200 border border-blue-500/20">
                                💡 Pelanggan transfer sesuai nominal tagihan. Cek mutasi BCA Mobile, lalu klik <strong>Konfirmasi & Cetak Struk</strong>.
                            </div>
                        </div>
                    )}

                    {serviceMethod === 'Tunai' && (
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-muted-foreground">Uang Diterima dari Pelanggan (Rp)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatThousands(servicePaidAmount)}
                                onChange={e => setServicePaidAmount(parseThousands(e.target.value))}
                                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-lg font-bold outline-none focus:border-primary"
                                placeholder="0"
                            />
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {[
                                    Number(pendingService.totalBill || pendingService.serviceFee || 35000),
                                    50000,
                                    100000,
                                    150000,
                                    200000
                                ].filter((v, i, a) => a.indexOf(v) === i && v >= Number(pendingService.totalBill || pendingService.serviceFee || 35000)).slice(0, 4).map(nominal => (
                                    <button
                                        key={nominal}
                                        type="button"
                                        onClick={() => setServicePaidAmount(nominal)}
                                        className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-mono font-semibold hover:bg-muted"
                                    >
                                        {nominal === Number(pendingService.totalBill || pendingService.serviceFee || 35000) ? 'Uang Pas' : rupiah(nominal)}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-sm">
                                <span className="text-muted-foreground">Kembalian</span>
                                <strong className="font-mono text-base font-bold text-foreground">
                                    {rupiah(Math.max(0, servicePaidAmount - Number(pendingService.totalBill || pendingService.serviceFee || 35000)))}
                                </strong>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="grid sm:grid-cols-2 gap-2 mt-2">
                <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Batal</Button>
                <Button onClick={handlePayServiceNow} disabled={serviceBusy} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                    {serviceBusy ? 'Memproses...' : (serviceMethod === 'QRIS' ? 'Buka QRIS Servis' : 'Konfirmasi & Cetak Struk')}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {serviceQrisOpen && pendingService && (
        <QrisPaymentDialog
            open={serviceQrisOpen}
            onClose={() => setServiceQrisOpen(false)}
            amount={Number(pendingService.totalBill || pendingService.serviceFee || 35000)}
            cartItems={[
                { id: `jasa-${pendingService.id}`, name: `Servis ${pendingService.job} (${pendingService.plate || 'Motor'})`, price: Number(pendingService.totalBill || pendingService.serviceFee || 35000), qty: 1 }
            ]}
            customer={{ id: 'service', name: `${pendingService.customer} (${pendingService.plate || 'Motor'})` }}
            onSuccess={({ orderId, totalAmount }) => {
                setServiceQrisOpen(false);
                setServiceModalOpen(false);
                try {
                    const raw = window.localStorage.getItem('dian-motor-services');
                    const list = raw ? JSON.parse(raw) : [];
                    window.localStorage.setItem('dian-motor-services', JSON.stringify(list.map(s => s.id === pendingService.id ? { ...s, status: 'Selesai', paid: true, paidAt: new Date().toISOString() } : s)));
                    const praw = window.localStorage.getItem('pending_service_orders');
                    const plist = praw ? JSON.parse(praw) : [];
                    window.localStorage.setItem('pending_service_orders', JSON.stringify(plist.filter(s => s.id !== pendingService.id)));
                } catch (e) {}
                fetch('/api/servis/bayar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serviceId: pendingService.id,
                        customer: pendingService.customer,
                        plate: pendingService.plate,
                        brand: pendingService.brand,
                        job: pendingService.job,
                        totalBill: totalAmount,
                        method: 'QRIS',
                        paidAmount: totalAmount,
                        changeAmount: 0,
                    }),
                }).catch(() => {});
                setServiceReceipt({
                    orderId,
                    customer: `${pendingService.customer} (${pendingService.plate || 'Motor'})`,
                    items: [{ qty: 1, product: { name: `Servis ${pendingService.job} (${pendingService.plate || 'Motor'})`, sellingPrice: totalAmount } }],
                    subtotal: totalAmount,
                    discount: 0,
                    total: totalAmount,
                    method: 'QRIS Dinamis',
                    paid: totalAmount,
                    change: 0,
                });
                setShowStruk(true);
                setPendingService(null);
                toast.success(`Pembayaran QRIS untuk servis ${pendingService.id} berhasil diverifikasi!`);
            }}
        />
    )}
  </div>;
}

function cnTab(active) {
    return `flex h-9 shrink-0 items-center rounded-lg px-3.5 text-[13px] font-semibold transition-colors ${active ? 'border border-primary bg-primary text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`;
}
