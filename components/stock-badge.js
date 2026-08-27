import { Badge } from '@/components/ui/badge';
import { stockStatus } from '@/lib/demo-data';
export function StockBadge({ stock, minimum }) {
    const status = stockStatus(stock, minimum);
    return <Badge variant={status === 'Stok Aman' ? 'secondary' : status === 'Stok Habis' ? 'destructive' : 'outline'} className={status === 'Stok Menipis' ? 'border-primary text-primary' : ''}>{status}</Badge>;
}
