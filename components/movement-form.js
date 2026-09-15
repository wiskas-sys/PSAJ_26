'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine, PackageCheck } from 'lucide-react';
import { products, stockStatus } from '@/lib/demo-data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
export function MovementForm({ type }) {
    const outgoing = type === 'OUT';
    const [product, setProduct] = useState(products[0]);
    const [qty, setQty] = useState(1);
    const Icon = outgoing ? ArrowUpFromLine : ArrowDownToLine;
    function submit(e) { e.preventDefault(); if (qty <= 0)
        return toast.error('Jumlah harus lebih dari 0.'); if (outgoing && qty > product.stock)
        return toast.error('Stok tidak mencukupi.'); toast.success(outgoing ? 'Barang berhasil dikeluarkan dari stok.' : 'Barang berhasil ditambahkan ke stok.'); }
    return <div className="flex flex-col gap-5"><PageHeader eyebrow={outgoing ? 'OUTBOUND STOCK' : 'INBOUND STOCK'} title={`Barang ${outgoing ? 'Keluar' : 'Masuk'}`} description={outgoing ? 'Catat penggunaan barang dan kurangi stok dengan aman.' : 'Tambahkan stok barang dari pemasok.'}></PageHeader>
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Form Barang {outgoing ? 'Keluar' : 'Masuk'}</CardTitle><CardDescription>Kolom bertanda wajib harus diisi.</CardDescription></CardHeader><CardContent className="p-5"><form onSubmit={submit}><FieldGroup><Field><FieldLabel>Produk</FieldLabel><Select value={product.id} onValueChange={v => setProduct(products.find(p => p.id === v) ?? products[0])}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel htmlFor="qty">Jumlah</FieldLabel><Input id="qty" type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="h-11"/></Field><Field><FieldLabel>Satuan</FieldLabel><Input value={product.unit} disabled className="h-11"/></Field></div>{outgoing && <Field><FieldLabel>Jenis Penggunaan</FieldLabel><Select defaultValue="Penjualan"><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{['Penjualan', 'Servis', 'Rusak', 'Lainnya'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>}<Field><FieldLabel>Tanggal {outgoing ? '' : 'Masuk'}</FieldLabel><Input type="date" defaultValue="2026-08-27" className="h-11"/></Field><Field><FieldLabel>Catatan</FieldLabel><Textarea placeholder="Tambahkan keterangan bila diperlukan..."/></Field><Button type="submit" size="lg" className="h-11"><Icon data-icon="inline-start"/>Simpan Barang {outgoing ? 'Keluar' : 'Masuk'}</Button></FieldGroup></form></CardContent></Card>
      <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Informasi Stok</CardTitle><CardDescription>Preview dampak terhadap stok</CardDescription></CardHeader><CardContent className="p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><PackageCheck className="size-5"/></span><div><p className="font-mono text-[10px] text-muted-foreground">{product.code}</p><p className="text-sm font-semibold">{product.name}</p></div></div><div className="mt-5 rounded-2xl bg-muted p-5"><p className="text-xs text-muted-foreground">Stok saat ini</p><p className="mt-1 text-4xl font-bold tracking-[-.03em]">{product.stock} <span className="text-base font-normal text-muted-foreground">{product.unit}</span></p></div><div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">Setelah disimpan</span><strong className={outgoing && qty > product.stock ? 'text-red-500' : 'text-primary'}>{outgoing ? Math.max(0, product.stock - qty) : product.stock + qty} {product.unit}</strong></div><div className="mt-4 border-t border-dashed border-border pt-4"><span className={`stock-chip ${stockStatus(product.stock, product.minimumStock) === 'Stok Aman' ? '' : stockStatus(product.stock, product.minimumStock) === 'Stok Habis' ? 'out' : 'low'}`}>{stockStatus(product.stock, product.minimumStock)}</span></div></CardContent></Card>
    </div>
  </div>;
}