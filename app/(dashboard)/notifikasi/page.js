'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  PackageX,
  ReceiptText,
  TriangleAlert,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Filter,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  fetchLiveNotifications,
  markNotifAsRead,
  markAllNotifsAsRead,
} from '@/lib/notif-store';

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchLiveNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Setup Supabase Realtime channel untuk mendengarkan perubahan stok & transaksi secara live
    const supabase = createClient();
    const channel = supabase
      .channel('notifikasi-page-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadNotifications();
        toast.info('Pembaruan stok terdeteksi di database.', { duration: 2500 });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        loadNotifications();
        toast.success('Transaksi baru berhasil diselesaikan!', { duration: 3000 });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  const counts = useMemo(() => {
    const all = notifications.length;
    const hampirHabis = notifications.filter((n) => n.category === 'hampir_habis').length;
    const habis = notifications.filter((n) => n.category === 'habis').length;
    const transaksi = notifications.filter((n) => n.category === 'transaksi_selesai').length;
    const servis = notifications.filter((n) => n.category === 'servis_siap_bayar').length;
    const unread = notifications.filter((n) => !n.read).length;

    return { all, hampirHabis, habis, transaksi, servis, unread };
  }, [notifications]);

  // Filter notifikasi sesuai tab aktif dan pencarian
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // 1. Filter Kategori
      if (activeTab === 'hampir_habis' && item.category !== 'hampir_habis') return false;
      if (activeTab === 'habis' && item.category !== 'habis') return false;
      if (activeTab === 'transaksi_selesai' && item.category !== 'transaksi_selesai') return false;
      if (activeTab === 'servis_siap_bayar' && item.category !== 'servis_siap_bayar') return false;

      // 2. Filter Pencarian Teks
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(query);
        const matchDesc = (item.desc || '').toLowerCase().includes(query);
        const matchCode = (item.code || '').toLowerCase().includes(query);
        return matchTitle || matchDesc || matchCode;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  function handleMarkRead(id) {
    markNotifAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function handleMarkAll() {
    if (counts.unread === 0) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    markAllNotifsAsRead(unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('Semua notifikasi ditandai sudah dibaca.');
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifikasi"
        description="Pembaruan penting operasional bengkel: ketersediaan stok & transaksi selesai."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            disabled={loading}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={counts.unread === 0}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <CheckCheck className="size-4 text-emerald-500" />
            <span>Tandai Semua Dibaca</span>
          </Button>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-4xl space-y-4">
        {/* Search Bar & Filter Tabs */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari notifikasi berdasarkan nama barang, kode transaksi, plat nomor..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs placeholder:text-muted-foreground"
            />
          </div>

          {/* Row 2: Tabs Filter with horizontal scroll support */}
          <div
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex w-full items-center gap-2 overflow-x-auto pb-2 pt-0.5 touch-pan-x scrollbar-thin scrollbar-thumb-border scroll-smooth"
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>Semua</span>
              <span className="rounded-full bg-black/20 dark:bg-white/20 px-1.5 py-0.2 text-[10px]">
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hampir_habis')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'hampir_habis'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <TriangleAlert className="size-3.5 text-amber-500" />
              <span>Hampir Habis</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-600 dark:text-amber-400">
                {counts.hampirHabis}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('habis')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'habis'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <PackageX className="size-3.5 text-red-500" />
              <span>Barang Habis</span>
              <span className="rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] text-red-600 dark:text-red-400">
                {counts.habis}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transaksi_selesai')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'transaksi_selesai'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <ReceiptText className="size-3.5 text-emerald-500" />
              <span>Transaksi Selesai</span>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-600 dark:text-emerald-400">
                {counts.transaksi}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('servis_siap_bayar')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'servis_siap_bayar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Wrench className="size-3.5 text-blue-500" />
              <span>Servis Siap Bayar</span>
              <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[10px] text-blue-400">
                {counts.servis}
              </span>
            </button>
          </div>
        </div>

        {/* Notifikasi List Container */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Card Top Indicator */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
            <p className="font-mono text-[11px] font-bold tracking-[.1em] text-muted-foreground">
              {counts.unread} BELUM DIBACA · {filteredNotifications.length} DITAMPILKAN
            </p>

            <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] font-bold text-emerald-500">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE KE DATABASE
            </span>
          </div>

          {/* Empty State */}
          {!loading && filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <div className="grid size-12 place-items-center rounded-2xl bg-muted mb-3">
                <CheckCircle2 className="size-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Tidak ada notifikasi pada kategori ini.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Semua stok dan transaksi operasional saat ini berjalan normal.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <RefreshCw className="size-5 animate-spin mx-auto text-primary mb-2" />
              <span>Memuat notifikasi live dari Supabase...</span>
            </div>
          )}

          {/* List of Notification Items */}
          <div className="divide-y divide-border">
            {filteredNotifications.map((n) => {
              const isHampirHabis = n.category === 'hampir_habis';
              const isHabis = n.category === 'habis';
              const isTrx = n.category === 'transaksi_selesai';
              const isServis = n.category === 'servis_siap_bayar';

              return (
                <article
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors ${
                    n.read
                      ? 'bg-transparent opacity-80'
                      : 'bg-primary/[0.03] hover:bg-primary/[0.06] cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Icon Badge */}
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl border ${
                        isHabis
                          ? 'border-red-500/30 bg-red-500/10 text-red-500'
                          : isHampirHabis
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                          : isServis
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {isHabis && <PackageX className="size-5" />}
                      {isHampirHabis && <TriangleAlert className="size-5" />}
                      {isTrx && <ReceiptText className="size-5" />}
                      {isServis && <Wrench className="size-5" />}
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold tracking-wide uppercase ${
                            isHabis
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : isHampirHabis
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : isServis
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {n.categoryLabel}
                        </span>

                        <h3
                          className={`text-sm font-semibold truncate ${
                            n.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {n.title}
                        </h3>

                        {!n.read && (
                          <span
                            className="size-2 rounded-full bg-primary shrink-0 animate-pulse"
                            title="Belum dibaca"
                          />
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {n.desc}
                      </p>

                      <p className="mt-2 font-mono text-[10px] text-muted-foreground/80">
                        {n.time}
                      </p>
                    </div>
                  </div>

                  {/* Action Link Button */}
                  <div className="sm:shrink-0 flex items-center justify-end">
                    <Link
                      href={n.link}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:bg-muted"
                    >
                      <span>{n.linkLabel}</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
