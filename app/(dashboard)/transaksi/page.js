'use client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { rupiah } from '@/lib/demo-data';
import { ManagementPage } from '@/components/management-page';

const CACHE_KEY = 'dian_motor_recent_txs';

function getInitialTransactions() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export default function Page() {
    const [sales, setSales] = useState(getInitialTransactions);

    useEffect(() => {
        let live = true;
        const supabase = createClient();
        const refresh = async () => {
            const { data, error } = await supabase.from('transactions')
                .select('id,transaction_code,created_at,customers(name),payment_method,total,status')
                .order('created_at', { ascending: false });
            if (error) {
                if (live && !sales.length) toast.error(error.message || 'Gagal memuat transaksi Supabase.');
                return;
            }
            if (live && data) {
                setSales(data);
                try {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.slice(0, 50)));
                } catch {}
            }
        };

        // Langsung refresh dari database Supabase
        refresh();

        const channel = supabase.channel('transactions-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
                if (payload.eventType === 'INSERT' && payload.new) {
                    setSales(prev => {
                        const exists = prev.some(item => item.id === payload.new.id || item.transaction_code === payload.new.transaction_code);
                        if (exists) return prev;
                        const formatted = {
                            id: payload.new.id,
                            transaction_code: payload.new.transaction_code,
                            created_at: payload.new.created_at,
                            customers: { name: 'Pelanggan' },
                            payment_method: payload.new.payment_method,
                            total: payload.new.total,
                            status: payload.new.status || 'Selesai',
                        };
                        return [formatted, ...prev];
                    });
                }
                refresh();
            })
            .subscribe();

        return () => {
            live = false;
            supabase.removeChannel(channel);
        };
    }, []);

    const rows = useMemo(() => sales.map(s => [
        s.transaction_code,
        new Date(s.created_at).toLocaleString('id-ID'),
        s.customers?.name || 'Pelanggan Umum',
        s.payment_method,
        rupiah(Number(s.total)),
        s.status,
    ]), [sales]);

    return <ManagementPage title="Transaksi" description="Lihat dan cari seluruh riwayat penjualan secara instan real-time." rows={rows} />;
}
