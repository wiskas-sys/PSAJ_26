import { createClient } from '@/lib/supabase/client';

const READ_NOTIFS_KEY = 'dian-motor:read-notif-ids';
const NOTIF_EVENT = 'dian-motor:notif-update';

export function getReadNotifIds() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(READ_NOTIFS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markNotifAsRead(id) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getReadNotifIds();
    ids.add(id);
    window.localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify([...ids]));
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
  } catch {}
}

export function markAllNotifsAsRead(idsToMark) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getReadNotifIds();
    idsToMark.forEach((id) => ids.add(id));
    window.localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify([...ids]));
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
  } catch {}
}

function timeAgo(dateString) {
  if (!dateString) return 'Baru saja';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return past.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export async function fetchLiveNotifications() {
  const supabase = createClient();
  const readIds = getReadNotifIds();
  const notifs = [];

  try {
    // 1. Ambil barang hampir habis (stok > 0 dan stok <= stok_minimum)
    const { data: lowProducts } = await supabase
      .from('products')
      .select('id, code, name, stock, minimum_stock, unit, updated_at')
      .gt('stock', 0)
      .order('stock', { ascending: true });

    if (lowProducts) {
      for (const p of lowProducts) {
        const minStock = p.minimum_stock ?? 5;
        if (p.stock <= minStock) {
          const id = `hampir_habis-${p.id}`;
          notifs.push({
            id,
            category: 'hampir_habis',
            categoryLabel: 'Hampir Habis',
            title: `Stok ${p.name} hampir habis!`,
            desc: `Sisa stok tinggal ${p.stock} ${p.unit || 'pcs'} (Batas minimum: ${minStock} ${p.unit || 'pcs'}). Segera lakukan pemesanan ulang.`,
            code: p.code,
            time: timeAgo(p.updated_at),
            timestamp: new Date(p.updated_at || Date.now()).getTime(),
            read: readIds.has(id),
            link: '/stok',
            linkLabel: 'Cek Stok & Rak',
          });
        }
      }
    }

    // 2. Ambil barang yang habis (stok <= 0) - batas 30 item teratas agar performa cepat
    const { data: outProducts } = await supabase
      .from('products')
      .select('id, code, name, stock, minimum_stock, unit, updated_at')
      .lte('stock', 0)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (outProducts) {
      for (const p of outProducts) {
        const id = `habis-${p.id}`;
        notifs.push({
          id,
          category: 'habis',
          categoryLabel: 'Barang Habis',
          title: `Stok ${p.name} telah HABIS!`,
          desc: `Stok saat ini 0 ${p.unit || 'pcs'}. Permintaan pelanggan belum dapat dipenuhi sebelum restock.`,
          code: p.code,
          time: timeAgo(p.updated_at),
          timestamp: new Date(p.updated_at || Date.now()).getTime(),
          read: readIds.has(id),
          link: '/stok',
          linkLabel: 'Buka Stok & Inventori',
        });
      }
    }

    // 3. Ambil data transaksi yang sudah selesai
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, transaction_code, total, payment_method, status, created_at, customers(name)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (transactions) {
      for (const t of transactions) {
        const isDone = t.status === 'completed' || t.status === 'sukses' || !t.status;
        if (isDone) {
          const id = `trx-${t.id}`;
          const formattedTotal = Number(t.total || 0).toLocaleString('id-ID');
          const custName = t.customers?.name || 'Pelanggan Umum';
          notifs.push({
            id,
            category: 'transaksi_selesai',
            categoryLabel: 'Transaksi Selesai',
            title: `Transaksi ${t.transaction_code || t.id.slice(0, 8)} berhasil diselesaikan.`,
            desc: `Total penjualan Rp ${formattedTotal} (${t.payment_method || 'Tunai'}) oleh ${custName}.`,
            time: timeAgo(t.created_at),
            timestamp: new Date(t.created_at || Date.now()).getTime(),
            read: readIds.has(id),
            link: '/transaksi',
            linkLabel: 'Lihat Riwayat Transaksi',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error fetching live notifications:', err);
  }

  // Urutkan paling baru di atas
  notifs.sort((a, b) => b.timestamp - a.timestamp);
  return notifs;
}

export function subscribeUnread(listener) {
  let isMounted = true;

  const update = async () => {
    try {
      const notifs = await fetchLiveNotifications();
      if (!isMounted) return;
      const unreadCount = notifs.filter((n) => !n.read).length;
      listener(unreadCount);
    } catch {}
  };

  update();

  const supabase = createClient();
  const channel = supabase
    .channel('realtime-notif-badges')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, update)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, update)
    .subscribe();

  const onLocalEvent = () => update();
  if (typeof window !== 'undefined') {
    window.addEventListener(NOTIF_EVENT, onLocalEvent);
  }

  return () => {
    isMounted = false;
    supabase.removeChannel(channel);
    if (typeof window !== 'undefined') {
      window.removeEventListener(NOTIF_EVENT, onLocalEvent);
    }
  };
}
