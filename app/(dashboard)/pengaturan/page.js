'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Server, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { isSupabaseConfigured } from '@/lib/supabase/client';

function Switch({ on, onChange }) {
    return <button type="button" role="switch" aria-checked={on} data-on={on} className="switch-thumb" onClick={() => onChange(!on)} aria-label="Atur sakelar"/>;
}

const tabCls = 'h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary';

export default function Page() {
    const [prefs, setPrefs] = useState({ push: true, struk: true, backup: false, reorder: true });
    const [payMethods, setPayMethods] = useState({ Tunai: true, Transfer: true, QRIS: true, 'Virtual Account': true, 'E-Wallet': true });
    const set = (k) => () => setPrefs(p => ({ ...p, [k]: !p[k] }));
    const supabaseOk = isSupabaseConfigured();
    const midtransOk = Boolean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
    const health = [
        ['Supabase Database', supabaseOk ? 'Terhubung' : 'Belum dikonfigurasi', supabaseOk],
        ['Auth Service', supabaseOk ? 'Siap digunakan' : 'Belum dikonfigurasi', supabaseOk],
        ['Payment Gateway (Midtrans)', midtransOk ? 'Terkonfigurasi' : 'Belum dikonfigurasi', midtransOk],
    ];
    return <div className="flex flex-col gap-5"><PageHeader title="Pengaturan" description="Kelola profil bengkel dan preferensi sistem."></PageHeader>
    <Tabs defaultValue="business" className="gap-4"><TabsList variant="line" className="h-auto w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-card p-1 shadow-sm ring-1 ring-foreground/10"><TabsTrigger value="business" className={tabCls}>Informasi Bisnis</TabsTrigger><TabsTrigger value="system" className={tabCls}>Preferensi Sistem</TabsTrigger><TabsTrigger value="tax" className={tabCls}>Metode Pembayaran</TabsTrigger></TabsList>
      <TabsContent value="business" className="mt-4"><div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Informasi Bisnis</CardTitle><CardDescription>Informasi ini ditampilkan pada struk dan laporan.</CardDescription></CardHeader><CardContent className="p-5"><FieldGroup><Field><FieldLabel>Nama Bengkel</FieldLabel><Input defaultValue="DIAN MOTOR" className="h-11"/></Field><div className="grid gap-4 sm:grid-cols-2"><Field><FieldLabel>Nomor Telepon</FieldLabel><Input defaultValue="021-555-0182" className="h-11"/></Field><Field><FieldLabel>Jam Operasional</FieldLabel><Input defaultValue="Senin–Sabtu, 08.00–18.00" className="h-11"/></Field></div><Field><FieldLabel>Alamat</FieldLabel><Textarea defaultValue="Jl. Raya Otomotif No. 24, Jakarta"/></Field><Button className="h-10" onClick={() => toast.success('Pengaturan berhasil disimpan.')}>Simpan Perubahan</Button></FieldGroup></CardContent></Card>
        <div className="grid gap-4">
          <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2"><Server className="size-4 text-primary"/>Kesehatan Sistem</CardTitle></CardHeader><CardContent className="grid gap-2 p-5">{health.map(([name, st, ok]) => <div key={name} className="flex items-center justify-between border-b border-border py-2.5 last:border-0"><span><strong className="block text-[13px]">{name}</strong></span><small className={`font-mono text-[10px] ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>{st}</small></div>)}</CardContent></Card>
        </div>
      </div></TabsContent>
      <TabsContent value="system" className="mt-4"><div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle>Preferensi Sistem</CardTitle><CardDescription>Atur perilaku aplikasi sesuai kebutuhan operasional.</CardDescription></CardHeader><CardContent className="grid gap-4 p-5">{[[prefs.push, set('push'), 'Notifikasi peringatan stok', 'Kirim peringatan saat stok di bawah minimum.'], [prefs.struk, set('struk'), 'Cetak struk otomatis', 'Cetak struk langsung setelah pembayaran.'], [prefs.reorder, set('reorder'), 'Pesan ulang otomatis', 'Generate PO ke supplier saat stok kritis.'], [prefs.backup, set('backup'), 'Backup harian otomatis', 'Sinkronkan arsip transaksi tiap pukul 23.00 WIB.']].map(([on, fn, name, desc]) => <div key={name} className="flex items-center justify-between gap-4 border-b border-border pb-3.5 last:border-0 last:pb-0"><span><strong className="block text-[13px]">{name}</strong><small className="mt-1 block text-[11px] text-muted-foreground">{desc}</small></span><Switch on={on} onChange={fn}/></div>)}</CardContent></Card>
        <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary"/>Keamanan Sesi</CardTitle></CardHeader><CardContent className="grid gap-3 p-5">{[['Autentikasi', supabaseOk ? 'Supabase Auth aktif' : 'Belum dikonfigurasi'], ['Sesi berjalan', 'Aktif selama perangkat online'], ['Perlindungan token', 'Sesi diperbarui otomatis']].map(([name, st]) => <div key={name} className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-[13px] font-semibold">{name}</span><small className="max-w-[55%] truncate font-mono text-[10px] text-muted-foreground">{st}</small></div>)}<Button variant="outline" className="h-10" onClick={() => toast.success('Sesi diperbarui.')}>Perbarui Sesi</Button></CardContent></Card>
      </div></TabsContent>
      <TabsContent value="tax" className="mt-4"><div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="rounded-[17px]"><CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2"><CreditCard className="size-4 text-primary"/>Metode Pembayaran</CardTitle><CardDescription>Aktifkan metode yang diterima di kasir.</CardDescription></CardHeader><CardContent className="grid gap-3 p-5">{['Tunai', 'Transfer', 'QRIS', 'Virtual Account', 'E-Wallet'].map(m => <div key={m} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"><span className="text-[13px] font-semibold">{m}</span><Switch on={payMethods[m]} onChange={() => setPayMethods(p => ({ ...p, [m]: !p[m] }))}/></div>)}</CardContent></Card>
      </div></TabsContent>
    </Tabs>
  </div>;
}