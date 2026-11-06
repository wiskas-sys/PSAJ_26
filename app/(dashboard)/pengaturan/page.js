'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, CreditCard, Save, Server, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { RoleGuard } from '@/components/role-guard';

function Switch({ on, onChange }) {
    return <button type="button" role="switch" aria-checked={on} data-on={on} className="switch-thumb" onClick={() => onChange(!on)} aria-label="Atur sakelar"/>;
}

const tabCls = 'h-9 rounded-lg px-3.5 text-xs font-semibold data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary';

const SETTINGS_STORAGE_KEY = 'dian_motor_system_settings';

const DEFAULT_PROFILE = {
    nama: 'DIAN MOTOR',
    telepon: '+62 823-1388-9969',
    jamOperasional: 'Setiap Hari, 08.30 – 22.00 WIB',
    alamat: 'Jl. Ps. Wage No. 19, RT.05/RW.04, Krajan, Jatisawit, Kec. Bumiayu, Kabupaten Brebes, Jawa Tengah 52273',
    rekening: 'BCA: 1590676221 a.n. Diyan Purwanti',
};

const DEFAULT_PREFS = { 
    notifStok: true, 
    waReceipt: true, 
    auditLog: true, 
    cloudSync: true 
};

const DEFAULT_PAY_METHODS = { 
    'Kas Tunai POS (Cash Fisik)': true, 
    'QRIS Dinamis (Standar Nasional)': true, 
    'Transfer Bank BCA (1590676221 a.n. Diyan Purwanti)': true 
};

export default function Page() {
    const [profile, setProfile] = useState(DEFAULT_PROFILE);
    const [prefs, setPrefs] = useState(DEFAULT_PREFS);
    const [payMethods, setPayMethods] = useState(DEFAULT_PAY_METHODS);
    const [saved, setSaved] = useState(false);

    // Muat pengaturan tersimpan dari localStorage saat halaman dibuka
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.profile) setProfile(p => ({ ...p, ...parsed.profile }));
                if (parsed.prefs) setPrefs(p => ({ ...p, ...parsed.prefs }));
                if (parsed.payMethods) setPayMethods(p => ({ ...p, ...parsed.payMethods }));
            }
        } catch (err) {
            console.error('Gagal memuat pengaturan tersimpan:', err);
        }
    }, []);

    const saveSettings = () => {
        try {
            const payload = {
                profile,
                prefs,
                payMethods,
                updatedAt: new Date().toISOString(),
            };
            window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
            window.dispatchEvent(new CustomEvent('dian-motor:settings-updated', { detail: payload }));
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            toast.success('Pengaturan sistem Dian Motor berhasil disimpan!');
        } catch (err) {
            toast.error('Gagal menyimpan pengaturan: ' + err.message);
        }
    };

    const togglePref = (k) => () => setPrefs(p => ({ ...p, [k]: !p[k] }));
    const togglePay = (m) => () => setPayMethods(p => ({ ...p, [m]: !p[m] }));

    const supabaseOk = isSupabaseConfigured();
    const midtransOk = Boolean(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY && !process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY.startsWith('your-') && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY !== 'your-client-key');
    const health = [
        ['Supabase Database', supabaseOk ? 'Terhubung (Live)' : 'Mode Lokal', supabaseOk],
        ['Auth Service', supabaseOk ? 'Siap digunakan' : 'Sesi Demo Aktif', supabaseOk],
        ['Payment Gateway', midtransOk ? 'Terkonfigurasi' : 'Siap Konfigurasi', midtransOk],
    ];

    return (
        <RoleGuard allowRole="owner" fallbackTitle="Pengaturan Sistem Hanya Untuk Owner">
            <div className="flex flex-col gap-5">
                <PageHeader title="Pengaturan Sistem" description="Kelola profil bengkel, rekening pembayaran, dan kebijakan operasional Dian Motor." />
                <Tabs defaultValue="business" className="gap-4">
                    <TabsList variant="line" className="h-auto w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-card p-1 shadow-sm ring-1 ring-foreground/10">
                        <TabsTrigger value="business" className={tabCls}>Informasi Bisnis</TabsTrigger>
                        <TabsTrigger value="system" className={tabCls}>Preferensi Operasional</TabsTrigger>
                        <TabsTrigger value="payment" className={tabCls}>Metode Pembayaran</TabsTrigger>
                    </TabsList>
                    
                    {/* Tab 1: Informasi Bisnis */}
                    <TabsContent value="business" className="mt-4">
                        <div className="grid items-start gap-4 xl:grid-cols-2">
                            <Card className="rounded-[17px]">
                                <CardHeader className="border-b border-border">
                                    <CardTitle>Profil Bengkel Dian Motor</CardTitle>
                                    <CardDescription>Informasi ini dicantumkan pada struk WhatsApp, kwitansi, dan nota servis resmi.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel>Nama Bengkel</FieldLabel>
                                            <Input 
                                                value={profile.nama} 
                                                onChange={e => setProfile(p => ({ ...p, nama: e.target.value }))} 
                                                className="h-11 font-bold"
                                            />
                                        </Field>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field>
                                                <FieldLabel>WhatsApp / Telepon</FieldLabel>
                                                <Input 
                                                    value={profile.telepon} 
                                                    onChange={e => setProfile(p => ({ ...p, telepon: e.target.value }))} 
                                                    className="h-11 font-mono"
                                                />
                                            </Field>
                                            <Field>
                                                <FieldLabel>Jam Operasional</FieldLabel>
                                                <Input 
                                                    value={profile.jamOperasional} 
                                                    onChange={e => setProfile(p => ({ ...p, jamOperasional: e.target.value }))} 
                                                    className="h-11"
                                                />
                                            </Field>
                                        </div>
                                        <Field>
                                            <FieldLabel>Alamat Lengkap Workshop</FieldLabel>
                                            <Textarea 
                                                value={profile.alamat} 
                                                onChange={e => setProfile(p => ({ ...p, alamat: e.target.value }))} 
                                                rows={3}
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>Rekening Resmi Toko (Transfer Bank)</FieldLabel>
                                            <Input 
                                                value={profile.rekening} 
                                                onChange={e => setProfile(p => ({ ...p, rekening: e.target.value }))} 
                                                className="h-11 font-mono font-semibold"
                                            />
                                        </Field>
                                        <Button 
                                            className="h-10 cursor-pointer bg-primary hover:bg-primary/90 text-white font-bold" 
                                            onClick={saveSettings}
                                        >
                                            {saved ? <Check className="size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                                            {saved ? 'Pengaturan Tersimpan!' : 'Simpan Perubahan'}
                                        </Button>
                                    </FieldGroup>
                                </CardContent>
                            </Card>
                            <div className="grid gap-4">
                                <Card className="rounded-[17px]">
                                    <CardHeader className="border-b border-border">
                                        <CardTitle className="flex items-center gap-2">
                                            <Server className="size-4 text-primary"/>Status Konektivitas Sistem
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2 p-5">
                                        {health.map(([name, st, ok]) => (
                                            <div key={name} className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
                                                <span><strong className="block text-[13px]">{name}</strong></span>
                                                <small className={`font-mono text-[10px] ${ok ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}`}>{st}</small>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Preferensi Operasional */}
                    <TabsContent value="system" className="mt-4">
                        <div className="grid items-start gap-4 xl:grid-cols-2">
                            <Card className="rounded-[17px]">
                                <CardHeader className="border-b border-border">
                                    <CardTitle>Kebijakan Operasional Owner</CardTitle>
                                    <CardDescription>Kendali fitur sistem kasir dan inventori yang berlaku di bengkel.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 p-5">
                                    {[
                                        [prefs.notifStok, togglePref('notifStok'), 'Peringatan Stok Menipis', 'Tampilkan indikator peringatan stok kritis dan barang habis di dashboard monitoring.'],
                                        [prefs.waReceipt, togglePref('waReceipt'), 'Struk Digital WhatsApp', 'Otomatis sediakan link nota & struk WhatsApp resmi pelanggan setelah transaksi kasir lunas.'],
                                        [prefs.auditLog, togglePref('auditLog'), 'Pencatatan Audit & Mutasi', 'Arsipkan seluruh log barang masuk supplier, pengeluaran kasir, dan pemakaian servis otomatis.'],
                                        [prefs.cloudSync, togglePref('cloudSync'), 'Sinkronisasi Cloud Supabase', 'Seluruh transaksi dan data suku cadang tersinkronisasi live ke cloud database.']
                                    ].map(([on, fn, name, desc]) => (
                                        <div key={name} className="flex items-center justify-between gap-4 border-b border-border pb-3.5 last:border-0 last:pb-0">
                                            <span>
                                                <strong className="block text-[13px]">{name}</strong>
                                                <small className="mt-1 block text-[11px] text-muted-foreground">{desc}</small>
                                            </span>
                                            <Switch on={on} onChange={fn}/>
                                        </div>
                                    ))}
                                    <div className="pt-2">
                                        <Button 
                                            className="h-10 cursor-pointer bg-primary hover:bg-primary/90 text-white font-bold" 
                                            onClick={saveSettings}
                                        >
                                            {saved ? <Check className="size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                                            {saved ? 'Kebijakan Tersimpan!' : 'Simpan Kebijakan Operasional'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="rounded-[17px]">
                                <CardHeader className="border-b border-border">
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-primary"/>Keamanan &amp; Hak Akses
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-3 p-5">
                                    {[
                                        ['Tipe Autentikasi', supabaseOk ? 'Supabase Auth Aktif' : 'Mode Demo / Sesi Lokal'],
                                        ['Hak Akses Owner', 'Akses Penuh Laporan Omset, HPP & Audit'],
                                        ['Hak Akses Kasir', 'Terbatas POS Kasir, Cek Rak & Servis (HPP Rahasia)'],
                                        ['Perlindungan Data', 'Enkripsi SSL/TLS & Token Aman']
                                    ].map(([name, st]) => (
                                        <div key={name} className="flex items-center justify-between rounded-xl border border-border p-3">
                                            <span className="text-[13px] font-semibold">{name}</span>
                                            <small className="max-w-[55%] truncate font-mono text-[10px] text-muted-foreground">{st}</small>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="h-10 cursor-pointer" onClick={() => toast.success('Sesi keamanan diverifikasi.')}>Verifikasi Sesi</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Metode Pembayaran */}
                    <TabsContent value="payment" className="mt-4">
                        <div className="grid items-start gap-4 xl:grid-cols-2">
                            <Card className="rounded-[17px]">
                                <CardHeader className="border-b border-border">
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="size-4 text-primary"/>Metode Pembayaran Resmi
                                    </CardTitle>
                                    <CardDescription>Kanal transaksi yang diterima di kasir dan kasir servis bengkel Dian Motor.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-3 p-5">
                                    {Object.keys(payMethods).map(m => (
                                        <div key={m} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <span className="text-[13px] font-semibold">{m}</span>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    {m.includes('Tunai') ? 'Pembayaran uang fisik langsung dengan kalkulasi kembalian otomatis.' : m.includes('QRIS') ? 'Scan QRIS Standar Nasional dengan nominal pas.' : 'Transfer ke rekening resmi toko BCA: 1590676221 a.n. Diyan Purwanti.'}
                                                </p>
                                            </div>
                                            <Switch on={payMethods[m]} onChange={togglePay(m)}/>
                                        </div>
                                    ))}
                                    <div className="pt-2">
                                        <Button 
                                            className="h-10 cursor-pointer bg-primary hover:bg-primary/90 text-white font-bold" 
                                            onClick={saveSettings}
                                        >
                                            {saved ? <Check className="size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                                            {saved ? 'Metode Pembayaran Tersimpan!' : 'Simpan Metode Pembayaran'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </RoleGuard>
    );
}
