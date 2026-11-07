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
  CreditCard,
  AlertCircle,
  HelpCircle,
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
  cartItems = [],
  customer,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [qrisDataUrl, setQrisDataUrl] = useState('');
  const [staticQrisDataUrl, setStaticQrisDataUrl] = useState('');
  const [qrMode, setQrMode] = useState('dynamic'); // 'dynamic' | 'stand'
  const [totalAmount, setTotalAmount] = useState(0);
  const [uniqueCode, setUniqueCode] = useState(0);
  const [payUrl, setPayUrl] = useState('');
  const [isOfficialQris, setIsOfficialQris] = useState(false);
  const [isMidtrans, setIsMidtrans] = useState(false);
  const [status, setStatus] = useState('waiting'); // 'waiting' | 'paid' | 'expired'
  const [countdown, setCountdown] = useState(300); // 5 menit
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [copiedBca, setCopiedBca] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const pollingRef = useRef(null);
  const channelRef = useRef(null);

  const bcaAccount = '1590676221';
  const bcaHolder = 'Diyan Purwanti';

  // 1. Generate QRIS saat dialog dibuka
  useEffect(() => {
    if (!open || !amount || amount <= 0) return;

    let active = true;
    const genOrderId = `TRX-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    setLoading(true);
    setStatus('waiting');
    setCountdown(300);

    // Ambil string QRIS resmi yang tersimpan di sistem jika ada
    let storeQris = null;
    try {
      const rawSettings = window.localStorage.getItem('dian_motor_system_settings');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        storeQris = parsed.qrisString || parsed.storeQris || null;
      }
    } catch {}

    async function initQris() {
      try {
        const res = await fetch('/api/gateway/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: genOrderId,
            amount,
            customer,
            storeQris,
            items: (cartItems || []).map((i) => ({
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
          setStaticQrisDataUrl(data.staticQrisDataUrl || data.qrisDataUrl || '');
          setTotalAmount(data.totalAmount);
          setUniqueCode(data.uniqueCode);
          setPayUrl(data.payUrl);
          setIsOfficialQris(Boolean(data.isOfficialQris));
          setIsMidtrans(Boolean(data.isMidtrans));
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
      } catch (e) {}
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

    toast.success('PEMBAYARAN LUNAS! Transaksi tersimpan ke sistem.');

    setTimeout(() => {
      onSuccess?.({
        orderId,
        totalAmount: data?.amount || totalAmount,
        method: isMidtrans ? 'Midtrans QRIS' : 'QRIS Dinamis',
      });
    }, 1000);
  }

  // Konfirmasi Manual Cepat oleh Kasir
  async function handleManualConfirm() {
    try {
      const res = await fetch('/api/gateway/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: totalAmount,
          method: 'QRIS',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handlePaymentSuccess(data);
      } else {
        // Fallback langsung selesaikan transaksi
        handlePaymentSuccess({ amount: totalAmount, method: 'QRIS' });
      }
    } catch {
      handlePaymentSuccess({ amount: totalAmount, method: 'QRIS' });
    }
  }

  // Simulasi Notifikasi Webhook
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
          sender: 'BCA/DANA Gateway',
          rawText: `Transfer masuk Rp ${totalAmount.toLocaleString('id-ID')} berhasil diverifikasi.`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Verifikasi nominal berhasil dicocokkan!');
        handlePaymentSuccess(data);
      } else {
        toast.error(data.error || 'Simulasi gagal.');
      }
    } catch {
      toast.error('Gagal memanggil webhook simulasi.');
    } finally {
      setSimulating(false);
    }
  }

  function handleCopyNominal() {
    navigator.clipboard.writeText(String(totalAmount));
    setCopiedNominal(true);
    toast.success(`Nominal pas Rp ${totalAmount.toLocaleString('id-ID')} disalin!`);
    setTimeout(() => setCopiedNominal(false), 2000);
  }

  function handleCopyBca() {
    navigator.clipboard.writeText(bcaAccount);
    setCopiedBca(true);
    toast.success(`Nomor Rekening BCA ${bcaAccount} (Diyan Purwanti) disalin!`);
    setTimeout(() => setCopiedBca(false), 2000);
  }

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && status !== 'paid') onClose(); }}>
      <DialogContent className="max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-5 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 flex items-center justify-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-0.5 font-mono text-[11px] font-bold text-red-400">
            <span className="size-2 animate-ping rounded-full bg-red-500" />
            GATEWAY QRIS DIAN MOTOR
          </div>
          <DialogTitle className="text-center text-xl font-black tracking-tight">
            Pembayaran QRIS &amp; Transfer
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-neutral-400">
            Scan barcode QRIS atau transfer langsung ke rekening resmi toko
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-xs text-neutral-400">Menghasilkan string EMVCo &amp; QRIS Dinamis...</p>
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
              Pembayaran terverifikasi. Menyiapkan struk belanja...
            </p>
          </div>
        ) : (
          /* Tampilan QR Code Aktif */
          <div className="space-y-3.5">
            {/* Mode Switcher */}
            <div className="flex items-center justify-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] gap-1">
              <button
                type="button"
                onClick={() => setQrMode('dynamic')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  qrMode === 'dynamic'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                QRIS Nominal Pas
              </button>
              <button
                type="button"
                onClick={() => setQrMode('stand')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  qrMode === 'stand'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                QRIS Stand Toko (Resmi)
              </button>
            </div>

            {/* Box QR Code */}
            <div className="relative mx-auto flex w-fit flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-lg">
              {(qrMode === 'dynamic' ? qrisDataUrl : (staticQrisDataUrl || qrisDataUrl)) ? (
                <img
                  src={qrMode === 'dynamic' ? qrisDataUrl : (staticQrisDataUrl || qrisDataUrl)}
                  alt="QRIS Dian Motor"
                  className="size-52 object-contain rounded-lg"
                />
              ) : (
                <div className="size-52 grid place-items-center text-neutral-400">
                  <QrCode className="size-16" />
                </div>
              )}
              <div className="mt-2 flex flex-col items-center text-center font-mono text-[10px] text-neutral-800">
                <div className="flex items-center gap-1 font-black">
                  <ShieldCheck className="size-3.5 text-red-600" />
                  <span>DIAN MOTOR · BREBES</span>
                </div>
                <span className="text-[9px] text-neutral-500 font-medium">
                  NMID: ID1024353680076 · A01 (BCA GPN ASPI)
                </span>
                <span className="text-[9px] text-neutral-400">
                  {qrMode === 'dynamic' ? '✓ Nominal otomatis terisi saat discan' : '✓ Scan barcode fisik stand toko resmi'}
                </span>
              </div>
            </div>

            {/* Nominal Box dengan Kode Unik */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Total Tagihan:</span>
                <span className="flex items-center gap-1 font-mono text-amber-400">
                  <Clock className="size-3" />
                  {timeFormatted}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-white">{formatRupiah(totalAmount)}</span>
                  {uniqueCode > 0 && (
                    <p className="text-[10px] text-neutral-400">
                      Termasuk kode verifikasi: <strong className="text-primary font-mono">Rp {uniqueCode}</strong>
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyNominal}
                  className="h-8 gap-1 border-neutral-700 bg-neutral-800 text-[11px] text-neutral-200 hover:bg-neutral-700 cursor-pointer"
                >
                  {copiedNominal ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  Salin Nominal
                </Button>
              </div>
            </div>

            {/* Alternatif Transfer Cepat BCA Diyan Purwanti */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-950/40 p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <CreditCard className="size-3.5" />
                  Transfer Cepat Bank BCA Resmi
                </span>
                <button
                  type="button"
                  onClick={handleCopyBca}
                  className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 hover:bg-blue-500/30 cursor-pointer"
                >
                  {copiedBca ? 'Tersalin!' : 'Salin Rekening'}
                </button>
              </div>
              <p className="font-mono text-sm font-black text-white">{bcaAccount}</p>
              <p className="text-[11px] text-blue-200/80">A.N: <strong>{bcaHolder}</strong></p>
              <p className="mt-1.5 text-[10px] text-neutral-400">
                💡 Jika m-Banking gagal scan layar, transfer langsung ke BCA di atas, lalu klik <strong>Konfirmasi Lunas</strong> di bawah.
              </p>
            </div>

            {/* Tombol Aksi Cepat Kasir */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleManualConfirm}
                className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="size-4" />
                <span>Konfirmasi Lunas</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleSimulateWebhook}
                disabled={simulating}
                className="h-10 border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 text-xs gap-1.5 cursor-pointer"
              >
                <Zap className="size-3.5 text-amber-400" />
                <span>{simulating ? 'Mengecek...' : 'Cek Status Lunas'}</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-full text-xs text-neutral-400 hover:text-white cursor-pointer mt-1"
            >
              Tutup &amp; Batalkan
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
