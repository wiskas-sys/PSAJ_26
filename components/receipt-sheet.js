'use client';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { rupiah } from '@/lib/demo-data';

export function ReceiptSheet({ open, onClose, orderId, date, items, subtotal, discount, total, method, customer, paid, change }) {
    return <Sheet open={open} onOpenChange={o => { if (!o)
            onClose(); }}><SheetContent side="right" className="bg-background"><div className="px-4 py-6 font-mono text-[11px] leading-relaxed text-foreground">
        <div className="text-center"><strong className="block text-sm tracking-wide">DIAN MOTOR</strong><span className="mt-1 block text-[9px] tracking-[.14em] text-muted-foreground">ENTERPRISE POS v2.4.0</span></div>
        <div className="my-3 border-t-2 border-dashed border-border"/>
        <p><span className="text-muted-foreground">No.</span> {orderId}</p><p><span className="text-muted-foreground">Tanggal</span> {date}</p><p><span className="text-muted-foreground">Pelanggan</span> {customer}</p><p><span className="text-muted-foreground">Metode</span> {method}</p>
        <div className="my-3 border-t-2 border-dashed border-border"/>
        <div className="grid gap-1.5">{items.map((i, idx) => <div key={idx} className="flex justify-between gap-2"><span className="min-w-0 truncate">{i.qty}x {i.product.name}</span><strong className="shrink-0">{rupiah(i.product.sellingPrice * i.qty)}</strong></div>)}</div>
        <div className="my-3 border-t-2 border-dashed border-border"/>
        <div className="flex justify-between"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>{discount > 0 && <div className="flex justify-between"><span>Diskon</span><span>-{rupiah(discount)}</span></div>}<div className="mt-1 flex justify-between text-sm font-bold"><span>Total Bayar</span><strong>{rupiah(total)}</strong></div>{method === 'Tunai' && paid > 0 && <div className="mt-1 flex justify-between"><span>Bayar</span><span>{rupiah(paid)}</span></div>}{method === 'Tunai' && change > 0 && <div className="flex justify-between"><span>Kembalian</span><span>{rupiah(change)}</span></div>}
        <div className="my-3 border-t-2 border-dashed border-border"/>
        <p className="text-center tracking-[.1em]">TERIMA KASIH · SAMPAI JUMPA</p>
    </div></SheetContent></Sheet>;
}