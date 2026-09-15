import { stockStatus } from '@/lib/demo-data';
export function StockBadge({ stock, minimum }) {
    const status = stockStatus(stock, minimum);
    const cls = status === 'Stok Habis' ? 'out' : status === 'Stok Menipis' ? 'low' : '';
    return <span className={`stock-chip ${cls}`}>{status}</span>;
}