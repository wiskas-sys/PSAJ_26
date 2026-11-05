'use client';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { rupiah } from '@/lib/demo-data';
import { Printer, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ReceiptSheet({ open, onClose, orderId, date, items = [], subtotal, discount, total, method, customer, paid, change }) {
    function shareToWhatsApp() {
        const itemLines = (items || []).map(i => {
            const name = i.product?.name || i.name || 'Item';
            const price = i.product?.sellingPrice || i.price || 0;
            const q = i.qty || i.quantity || 1;
            return `• ${q}x ${name} (${rupiah(price * q)})`;
        }).join('\n');

        const message = `*STRUK PEMBAYARAN DIAN MOTOR*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `No. Nota: ${orderId}\n` +
            `Tanggal : ${date}\n` +
            `Pelanggan: ${customer || 'Pelanggan Umum'}\n` +
            `Metode  : ${method}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `*Rincian Pembelian:*\n${itemLines}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `Subtotal: ${rupiah(subtotal || total)}\n` +
            (discount > 0 ? `Diskon: -${rupiah(discount)}\n` : '') +
            `*TOTAL BAYAR: ${rupiah(total)}*\n` +
            (method === 'Tunai' && paid > 0 ? `Bayar: ${rupiah(paid)}\nKembalian: ${rupiah(change || 0)}\n` : '') +
            `\n*STATUS: LUNAS* ✅\n` +
            `Terima kasih telah mempercayakan kendaraan Anda di DIAN MOTOR!\n` +
            `Jl. Raya Dian Motor · Solusi Servis & Suku Cadang Terpercaya`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        toast.success('Format struk WhatsApp berhasil dibuka!');
    }

    function handlePrint() {
        window.print();
    }

    return (
        <Sheet open={open} onOpenChange={o => { if (!o) onClose(); }}>
            <SheetContent side="right" className="bg-background w-full sm:max-w-md overflow-y-auto">
                <div id="printable-receipt" className="px-3 py-4 font-mono text-[11px] leading-relaxed text-foreground">
                    <div className="text-center">
                        <strong className="block text-base font-extrabold tracking-wide">DIAN MOTOR</strong>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">Bengkel Motor &amp; Toko Suku Cadang</span>
                        <span className="mt-0.5 block text-[9px] tracking-[.14em] text-muted-foreground">STRUK DIGITAL RESMI</span>
                    </div>

                    <div className="my-3 border-t-2 border-dashed border-border"/>
                    <div className="grid gap-1">
                        <p><span className="text-muted-foreground">No. Transaksi :</span> <strong className="text-foreground">{orderId}</strong></p>
                        <p><span className="text-muted-foreground">Waktu         :</span> {date}</p>
                        <p><span className="text-muted-foreground">Pelanggan     :</span> {customer || 'Pelanggan Umum'}</p>
                        <p><span className="text-muted-foreground">Pembayaran    :</span> <strong className="text-emerald-500 font-bold">{method}</strong></p>
                    </div>

                    <div className="my-3 border-t-2 border-dashed border-border"/>
                    <div className="grid gap-2">
                        {items.map((i, idx) => {
                            const name = i.product?.name || i.name || 'Item';
                            const price = Number(i.product?.sellingPrice || i.price || 0);
                            const q = Number(i.qty || i.quantity || 1);
                            return (
                                <div key={idx} className="flex justify-between items-start gap-2">
                                    <span className="min-w-0 font-medium">{q}x {name}</span>
                                    <strong className="shrink-0 font-bold">{rupiah(price * q)}</strong>
                                </div>
                            );
                        })}
                    </div>

                    <div className="my-3 border-t-2 border-dashed border-border"/>
                    <div className="grid gap-1">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{rupiah(subtotal || total)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Diskon</span>
                                <span>-{rupiah(discount)}</span>
                            </div>
                        )}
                        <div className="mt-1 flex justify-between text-sm font-black border-t border-dashed border-border pt-1">
                            <span>TOTAL</span>
                            <strong className="text-primary text-base">{rupiah(total)}</strong>
                        </div>
                        {method === 'Tunai' && paid > 0 && (
                            <>
                                <div className="mt-1 flex justify-between text-muted-foreground">
                                    <span>Uang Diterima</span>
                                    <span>{rupiah(paid)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Kembalian</span>
                                    <strong className="text-foreground">{rupiah(change || 0)}</strong>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="my-3 border-t-2 border-dashed border-border"/>
                    <div className="rounded-lg bg-muted/60 p-2.5 text-center text-[10px] text-muted-foreground">
                        <p className="font-semibold text-emerald-500">STATUS: LUNAS ✅</p>
                        <p className="mt-0.5">Garansi servis 7 hari untuk pengerjaan mesin &amp; komponen.</p>
                        <p className="mt-1 tracking-widest font-bold">TERIMA KASIH</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-border">
                    <Button onClick={shareToWhatsApp} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10">
                        <MessageCircle className="size-4 mr-2" />
                        Kirim Struk via WhatsApp
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={handlePrint} className="h-9">
                            <Printer className="size-3.5 mr-1.5" />
                            Cetak / PDF
                        </Button>
                        <Button variant="secondary" onClick={onClose} className="h-9 font-semibold">
                            Tutup Struk
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
