'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DashboardRealtime() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        let refreshTimer;
        const refresh = () => {
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => router.refresh(), 120);
        };
        const channel = supabase.channel('dashboard-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, refresh)
            .subscribe();

        return () => {
            clearTimeout(refreshTimer);
            supabase.removeChannel(channel);
        };
    }, [router]);

    return null;
}
