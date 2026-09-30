'use client';
import { useEffect, useMemo, useState } from 'react';
import { dateLabel, rupiah } from '@/lib/demo-data';
import { getSales, subscribeSales } from '@/lib/sales-store';
import { ManagementPage } from '@/components/management-page';

export default function Page() {
    const [sales, setSales] = useState([]);

    useEffect(() => {
        setSales(getSales());
        return subscribeSales(() => setSales(getSales()));
    }, []);

    const rows = useMemo(() => sales.map(s => [
        s.code,
        dateLabel(s.date),
        s.customer,
        s.method,
        rupiah(s.total),
        s.status,
    ]), [sales]);

    return <ManagementPage title="Transaksi" description="Lihat dan cari seluruh riwayat penjualan." rows={rows} />;
}
