'use client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { rupiah } from '@/lib/demo-data';
import { ManagementPage } from '@/components/management-page';

export default function Page() {
    const [sales, setSales] = useState([]);

    useEffect(() => {
        let live = true;
        const supabase = createClient();
        const refresh = async () => {
            const { data, error } = await supabase.from('transactions').select('id,transaction_code,created_at,customers(name),payment_method,total,status').order('created_at', { ascending: false });
            if (error) { if (live) toast.error(error.message || 'Gagal memuat transaksi Supabase.'); return; }
            if (live) setSales(data || []);
        };
        refresh();
        const channel = supabase.channel('transactions-live').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, refresh).subscribe();
        return () => { live = false; supabase.removeChannel(channel); };
    }, []);

    const rows = useMemo(() => sales.map(s => [
        s.transaction_code,
        new Date(s.created_at).toLocaleString('id-ID'),
        s.customers?.name || 'Pelanggan Umum',
        s.payment_method,
        rupiah(Number(s.total)),
        s.status,
    ]), [sales]);

    return <ManagementPage title="Transaksi" description="Lihat dan cari seluruh riwayat penjualan." rows={rows} />;
}
