'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { products } from '@/lib/demo-data';
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
    return <div className="mx-auto flex max-w-5xl flex-col gap-6"><div><h1 className="text-3xl font-bold">Barang {outgoing ? 'Keluar' : 'Masuk'}</h1><p className="mt-1 text-muted-foreground">{outgoing ? 'Catat penggunaan barang dan kurangi stok dengan aman.' : 'Tambahkan stok barang dari pemasok.'}</p></div><div className="grid gap-6 lg:grid-cols-[1fr_340px]"><Card><CardHeader><CardTitle>Form Barang {outgoing ? 'Keluar' : 'Masuk'}</CardTitle><CardDescription>Kolom bertanda wajib harus diisi.</CardDescription></CardHeader><CardContent><form onSubmit={submit}><FieldGroup><Field><FieldLabel>Produk</FieldLabel><Select value={product.id} onValueChange={v => setProduct(products.find(p => p.id === v) ?? products[0])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel htmlFor="qty">Jumlah</FieldLabel><Input id="qty" type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))}/></Field><Field><FieldLabel>Satuan</FieldLabel><Input value={product.unit} disabled/></Field></div>{outgoing && <Field><FieldLabel>Jenis Penggunaan</FieldLabel><Select defaultValue="Penjualan"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{['Penjualan', 'Servis', 'Rusak', 'Lainnya'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>}<Field><FieldLabel>Tanggal {outgoing ? '' : 'Masuk'}</FieldLabel><Input type="date" defaultValue="2026-08-27"/></Field><Field><FieldLabel>Catatan</FieldLabel><Textarea placeholder="Tambahkan keterangan bila diperlukan..."/></Field><Button type="submit" size="lg"><Icon data-icon="inline-start"/>Simpan Barang {outgoing ? 'Keluar' : 'Masuk'}</Button></FieldGroup></form></CardContent></Card><Card className="h-fit"><CardHeader><CardTitle>Informasi Stok</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{product.code}</p><p className="mt-1 font-semibold">{product.name}</p><div className="mt-6 rounded-lg bg-muted p-5"><p className="text-sm text-muted-foreground">Stok saat ini</p><p className="text-4xl font-bold">{product.stock} <span className="text-base font-normal">{product.unit}</span></p></div><div className="mt-4 flex justify-between text-sm"><span>Setelah disimpan</span><strong className="text-primary">{outgoing ? Math.max(0, product.stock - qty) : product.stock + qty} {product.unit}</strong></div></CardContent></Card></div></div>;
}
