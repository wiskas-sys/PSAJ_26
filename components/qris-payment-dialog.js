'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  CheckCircle2,
  Clock,
  ExternalLink,
  Zap,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(num) || 0);
}

export function QrisPaymentDialog({
  open,
  onClose,
  amount,
  cartItems,
  customer,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [qrisDataUrl, setQrisDataUrl] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [uniqueCode, setUniqueCode] = useState(0);
  const [payUrl, setPayUrl] = useState('');
  const [status, setStatus] = useState('waiting'); // 'waiting' | 'paid' | 'expired'
  const [countdown, setCountdown] = useState(300); // 5 menit
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const pollingRef = useRef(null);
  const channelRef = useRef(null);

  // 1. Generate QRIS saat dialog dibuka
  useEffect(() => {
    if (!open || !amount || amount <= 0) return;

    let active = true;
    const genOrderId = `TRX-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    setLoading(true);
    setStatus('waiting');
    setCountdown(300);

    async function initQris() {
      try {
        const res = await fetch('/api/gateway/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: genOrderId,
            amount,
            customer,
            items: cartItems.map((i) => ({
              id: i.product?.id || i.id,
              name: i.product?.name || i.name,
              price: i.product?.sellingPrice || i.price,
              qty: i.qty || 1,
            })),
          }),
        });

        const data = await res.json();
        if (!active) return;

        if (res.ok && data.success) {
          setOrderId(data.orderId);
          setQrisDataUrl(data.qrisDataUrl);
          setTotalAmount(data.totalAmount);
          setUniqueCode(data.uniqueCode);
          setPayUrl(data.payUrl);
        } else {
          toast.error(data.error || 'Gagal membuat QRIS.');
          onClose();
        }
      } catch (err) {
        if (active) {
          toast.error('Tidak dapat menghubungkan ke server gateway.');
          onClose();
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initQris();

    return () => {
      active = false;
    };
  }, [open, amount]);

  // 2. Polling dan Realtime Listener status pembayaran
  useEffect(() => {
    if (!open || !orderId || status === 'paid') return;

    // Polling setiap 1.5 detik
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/gateway/status/${orderId}`);
        const data = await res.json();
        if (data.isPaid) {
          handlePaymentSuccess(data);
        }
      } catch (e) {
        // Abaikan polling error sementara
      }
    }, 1500);

    // Supabase Realtime Channel
    try {
      const supabase = createClient();
      channelRef.current = supabase
        .channel(`qris-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payments',
            filter: `order_id=eq.${orderId}`,
          },
          (payload) => {
            if (payload.new?.status === 'paid' || payload.new?.status === 'settlement') {
              handlePaymentSuccess(payload.new);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }

    // Countdown Timer
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setStatus('expired');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timer) clearInterval(timer);
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [open, orderId, status]);

  function handlePaymentSuccess(data) {
    if (status === 'paid') return;
    setStatus('paid');
    if (pollingRef.current) clearInterval(pollingRef.current);

    toast.success('PEMBAYARAN QRIS LUNAS! Transaksi tersimpan ke sistem.');

    // Auto lanjut cetak struk setelah 1.2 detik
    setTimeout(() => {
      onSuccess({
        orderId,
        totalAmount: data.amount || totalAmount,
        method: data.method || 'QRIS Dinamis',
      });
    }, 1200);
  }

  // 3. Simulasi Webhook (HP Server Tasker)
  async function handleSimulateWebhook() {
    if (simulating || status === 'paid') return;
    setSimulating(true);
    try {
      const res = await fetch('/api/gateway/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: totalAmount,
          sender: 'DANA (HP Server Tasker)',
          rawText: `DANA: Transfer masuk Rp ${totalAmount.toLocaleString('id-ID')} berhasil diterima.`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Simulasi notifikasi DANA berhasil! Sistem mencocokkan nominal.');
        handlePaymentSuccess(data);
      } else {
        toast.error(data.error || 'Simulasi gagal.');
      }
    } catch (err) {
      toast.error('Gagal memanggil webhook simulasi.');
    } finally {
      setSimulating(false);
    }
  }

  function handleCopyNominal() {
    navigator.clipboard.writeText(String(totalAmount));
    setCopied(true);
    toast.success('Nominal unik disalin!');
    setTimeout(() => setCopied(false), 2000);
  }

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && status !== 'paid') onClose(); }}>
      <DialogContent className="max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 flex items-center justify-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-mono text-[11px] font-bold text-red-400">
            <span className="size-2 animate-ping rounded-full bg-red-500" />
            GATEWAY QRIS DIAN MOTOR
          </div>
          <DialogTitle className="text-center text-xl font-black tracking-tight">
            Pembayaran QRIS Dinamis
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-neutral-400">
            Arahkan kamera HP / scan e-Wallet (DANA, GoPay, OVO, ShopeePay, BCA) ke layar ini
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-xs text-neutral-400">Menghasilkan string EMVCo & QRIS Dinamis...</p>
          </div>
        ) : status === 'paid' ? (
          /* Tampilan Lunas Berhasil */
          <div className="my-4 flex flex-col items-center rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/60 to-neutral-900 p-6 text-center animate-in zoom-in-95">
            <div className="grid size-16 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 ring-4 ring-emerald-500/10">
              <CheckCircle2 className="size-10" />
            </div>
            <span className="mt-3 font-mono text-xs font-black tracking-wider text-emerald-400">
              STATUS: LUNAS!
            </span>
            <p className="mt-1 text-2xl font-black text-white">{formatRupiah(totalAmount)}</p>
            <p className="mt-1 text-xs text-neutral-300">
              Pembayaran terverifikasi otomatis. Menyiapkan struk belanja...
            </p>
          </div>
        ) : (
          /* Tampilan QR Code Aktif */
          <div className="space-y-4">
            {/* Box QR Code */}
            <div className="relative mx-auto flex w-fit flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-lg">
              {qrisDataUrl ? (
                <img
                  src={qrisDataUrl}
                  alt="QRIS Dian Motor"
                  className="size-56 object-contain rounded-lg"
                />
              ) : (
                <div className="size-56 grid place-items-center text-neutral-400">
                  <QrCode className="size-16" />
                </div>
              )}
              <div className="mt-1 flex items-center gap-1 font-mono text-[10px] font-bold text-neutral-800">
                <ShieldCheck className="size-3 text-red-600" />
                <span>NMID: ID10200389201 · EMVCo Valid</span>
              </div>
            </div>

            {/* Nominal Box dengan Kode Unik */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Total yang Harus Dibayar:</span>
                <span className="flex items-center gap-1 font-mono text-amber-400">
                  <Clock className="size-3" />
                  {timeFormatted}
                </span>
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-white">{formatRupiah(totalAmount)}</span>
                  {uniqueCode > 0 && (
                    <p className="text-[10px] text-neutral-400">
                      Termasuk kode verifikasi otomatis: <strong className="text-primary font-mono">Rp {uniqueCode}</strong>
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyNominal}
                  className="h-8 gap-1 border-neutral-700 bg-neutral-800 text-[11px] text-neutral-200 hover:bg-neutral-700"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  Salin
                </Button>
              </div>
            </div>

            {/* Quick Testing Actions (Sesuai diagram alur otomatis) */}
            <div className="space-y-2 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                Mode Uji Coba Cepat (Simulator Alur Tasker & HP):
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Buka Halaman HP Pelanggan */}
                <a
                  href={`/bayar/${orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Buka di HP</span>
                </a>

                {/* 2. Simulasi Notifikasi Webhook DANA */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSimulateWebhook}
                  disabled={simulating}
                  className="h-9 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-600 hover:text-white"
                >
                  <Zap className="size-3.5" />
                  <span>{simulating ? 'Mengirim...' : 'Simulasi DANA'}</span>
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-full text-xs text-neutral-400 hover:text-white"
            >
              Batalkan Pembayaran
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
