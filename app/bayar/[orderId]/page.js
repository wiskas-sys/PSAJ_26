'use client';

import { useEffect, useState, use } from 'react';
import {
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Clock,
  ArrowRight,
  Receipt,
  Store,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(num) || 0);
}

const EWALLETS = [
  { id: 'DANA', name: 'DANA', color: 'bg-blue-600', badge: 'Terverifikasi Instan' },
  { id: 'GoPay', name: 'GoPay', color: 'bg-emerald-600', badge: 'Terverifikasi Instan' },
  { id: 'OVO', name: 'OVO', color: 'bg-purple-600', badge: 'Terverifikasi Instan' },
  { id: 'ShopeePay', name: 'ShopeePay', color: 'bg-orange-600', badge: 'Terverifikasi Instan' },
  { id: 'BCA QRIS', name: 'BCA / QRIS Mobile', color: 'bg-indigo-600', badge: 'National QRIS' },
];

export default function CustomerPayPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const orderId = params?.orderId;

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState('DANA');
  const [payerName, setPayerName] = useState('');
  const [paying, setPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch live payment status
  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/gateway/status/${orderId}`);
        const data = await res.json();
        if (!active) return;

        if (res.ok && data) {
          setPaymentData(data);
          if (data.isPaid) {
            setIsSuccess(true);
          }
        } else {
          setErrorMsg(data.error || 'Pembayaran tidak ditemukan.');
        }
      } catch (err) {
        if (active) setErrorMsg('Gagal memuat status pembayaran.');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchStatus();

    // Polling setiap 3 detik jika belum bayar
    const interval = setInterval(() => {
      if (!isSuccess) {
        fetchStatus();
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [orderId, isSuccess]);

  // 2. Action bayar dari HP pelanggan
  async function handlePay() {
    setPaying(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/gateway/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          method: selectedWallet,
          payerName: payerName || paymentData?.customerName || 'Pelanggan QRIS',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pembayaran.');
      }

      setIsSuccess(true);
      setPaymentData((prev) => ({
        ...prev,
        isPaid: true,
        status: 'paid',
        paidAt: data.paidAt,
        method: data.method,
      }));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-neutral-400">Memuat detail tagihan...</p>
      </div>
    );
  }

  const payload = paymentData?.payload || {};
  const items = payload.items || [];
  const baseAmount = payload.baseAmount || paymentData?.amount || 0;
  const uniqueCode = payload.uniqueCode || 0;
  const totalAmount = paymentData?.amount || baseAmount + uniqueCode;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 antialiased">
      {/* Header Mobile */}
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary font-bold text-white shadow-md">
              DM
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">DIAN MOTOR</h1>
              <p className="text-[11px] text-neutral-400">Gateway Pembayaran Resmi</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <ShieldCheck className="size-3" />
            Aman & Cepat
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-md flex-1 p-4">
        {isSuccess ? (
          /* Tampilan Pembayaran Sukses */
          <div className="animate-in fade-in-50 zoom-in-95 duration-300">
            <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 via-neutral-900 to-neutral-900 p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="size-12 animate-bounce" />
              </div>

              <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 font-mono text-xs font-bold text-emerald-400">
                STATUS: LUNAS & TERVERIFIKASI
              </span>

              <h2 className="mt-3 text-2xl font-black text-white">Pembayaran Berhasil!</h2>
              <p className="mt-1 text-xs text-neutral-300">
                Notifikasi telah otomatis diterima di komputer kasir. Struk fisik sedang dicetak di kasir.
              </p>

              {/* Rincian Struk Digital */}
              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 text-left font-mono text-xs text-neutral-300 shadow-inner">
                <div className="flex justify-between border-b border-dashed border-neutral-800 pb-2.5">
                  <span className="text-neutral-400">No. Order</span>
                  <span className="font-bold text-white">{orderId}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-neutral-800 py-2.5">
                  <span className="text-neutral-400">Metode</span>
                  <span className="font-semibold text-emerald-400">{paymentData?.method || `QRIS (${selectedWallet})`}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-neutral-800 py-2.5">
                  <span className="text-neutral-400">Waktu Bayar</span>
                  <span>{new Date(paymentData?.paidAt || Date.now()).toLocaleTimeString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between pt-2.5 text-sm">
                  <span className="font-bold text-white">Total Bayar</span>
                  <span className="text-base font-black text-emerald-400">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                <Link
                  href="/"
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98]"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Tampilan Rincian Tagihan & Tombol Bayar */
          <div className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Total Pembayaran Banner */}
            <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Total Tagihan
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
                  <Clock className="size-3" />
                  Menunggu Pembayaran
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-white">
                  {formatRupiah(totalAmount)}
                </span>
                {uniqueCode > 0 && (
                  <span className="rounded-md bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                    +{uniqueCode} kode unik
                  </span>
                )}
              </div>

              <p className="mt-1 text-[11px] text-neutral-400">
                Kode unik <strong className="text-neutral-200">Rp {uniqueCode}</strong> digunakan agar sistem kasir dapat mengenali transfer Anda secara otomatis detik ini juga.
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
                <span>Order ID</span>
                <span className="font-mono font-semibold text-neutral-200">{orderId}</span>
              </div>
            </div>

            {/* Rincian Barang / Servis */}
            {items.length > 0 && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Rincian Barang & Servis
                  </h3>
                  <span className="text-[11px] text-neutral-400">{items.length} item</span>
                </div>
                <div className="divide-y divide-neutral-800/60 text-xs">
                  {items.map((i, idx) => {
                    const name = i.name || i.product?.name || 'Suku Cadang';
                    const qty = i.qty || i.quantity || 1;
                    const price = i.price || i.product?.sellingPrice || 0;
                    return (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold text-neutral-200">{name}</p>
                          <p className="text-[11px] text-neutral-400">{qty}x @ {formatRupiah(price)}</p>
                        </div>
                        <span className="font-mono font-semibold text-neutral-100">
                          {formatRupiah(price * qty)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pilihan e-Wallet */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                Pilih Aplikasi Pembayaran (e-Wallet)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EWALLETS.map((w) => {
                  const selected = selectedWallet === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWallet(w.id)}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-bold text-sm text-white">{w.name}</span>
                        {selected && <CheckCircle2 className="size-4 text-primary" />}
                      </div>
                      <span className="mt-1 text-[10px] text-neutral-400">{w.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Nama Pengirim Opsional */}
              <div className="mt-3">
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Nama Anda / Akun e-Wallet (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-xs text-white placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Tombol Eksekusi Bayar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 font-bold text-white shadow-xl shadow-red-600/20 transition-all hover:from-red-500 hover:to-rose-500 active:scale-[0.98] disabled:opacity-50"
              >
                {paying ? (
                  <>
                    <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menghubungi Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Bayar Sekarang via {selectedWallet} ({formatRupiah(totalAmount)})</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[10px] text-neutral-400">
                🔒 Sistem terhubung langsung ke kasir Dian Motor. Status kasir akan berubah otomatis saat pembayaran berhasil.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

