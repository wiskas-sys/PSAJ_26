'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Copy, Database, ExternalLink, KeyRound, RefreshCw, Webhook, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function GatewayConfigCard({ environment, hasServerKey, hasClientKey, supabaseConnected, webhookPath }) {
    const [origin, setOrigin] = useState('');
    useEffect(() => setOrigin(window.location.origin), []);
    const webhookUrl = `${origin || 'https://domain-anda.com'}${webhookPath}`;
    const unconfigured = environment === 'unconfigured';
    const checks = [
        { label: 'MIDTRANS_SERVER_KEY', note: 'Dipakai server untuk membuat token & verifikasi notifikasi.', ok: hasServerKey, icon: KeyRound },
        { label: 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY', note: 'Dimuat browser untuk membuka popup Snap.', ok: hasClientKey, icon: KeyRound },
        { label: 'Riwayat pembayaran', note: 'Tersimpan permanen di tabel payments Supabase.', ok: supabaseConnected, icon: Database },
        { label: environment === 'production' ? 'Mode production' : 'Mode sandbox', note: environment === 'production' ? 'Transaksi memakai uang asli.' : 'Aman untuk pengujian tanpa uang asli.', ok: !unconfigured, icon: RefreshCw },
    ];
    async function copyWebhook() {
        try { await navigator.clipboard.writeText(webhookUrl); toast.success('URL notifikasi disalin.'); }
        catch { toast.error('Gagal menyalin URL. Salin manual dari kolom di atas.'); }
    }
    return <Card className="rounded-[17px]"><CardHeader>
        <div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Webhook className="size-4"/>Konfigurasi Gateway</CardTitle><CardDescription>Status integrasi Midtrans dan kanal notifikasi pembayaran.</CardDescription></div><a href={environment === 'production' ? 'https://dashboard.midtrans.com' : 'https://dashboard.sandbox.midtrans.com'} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline">Dashboard<ExternalLink className="size-3.5"/></a></div>
    </CardHeader><CardContent className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="grid gap-2">
            {checks.map(({ label, note, ok, icon: Icon }) => <div key={label} className="flex items-start gap-3 rounded-xl border border-border px-3.5 py-2.5">
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${ok ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}><Icon className="size-4"/></span>
                <div className="min-w-0 flex-1"><p className="truncate font-mono text-[11px] font-semibold">{label}</p><p className="text-[11px] text-muted-foreground">{note}</p></div>
                {ok ? <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-500"/> : <XCircle className="mt-1 size-4 shrink-0 text-amber-500"/>}
            </div>)}
        </div>
        <div className="flex flex-col gap-3">
            <div><label htmlFor="webhook-url" className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">URL notifikasi Midtrans</label><div className="flex gap-2"><Input id="webhook-url" value={webhookUrl} readOnly className="h-10 font-mono text-[11px]"/><Button type="button" variant="outline" onClick={copyWebhook} aria-label="Salin URL notifikasi"><Copy data-icon="inline-start"/>Salin</Button></div></div>
            {unconfigured ? <ol className="grid gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5 text-[11px] leading-relaxed text-muted-foreground">
                <li><strong className="text-foreground">1.</strong> Ambil Server Key &amp; Client Key di Midtrans Dashboard → Settings → Access Keys.</li>
                <li><strong className="text-foreground">2.</strong> Isi <code className="rounded bg-muted px-1 font-mono">MIDTRANS_SERVER_KEY</code> dan <code className="rounded bg-muted px-1 font-mono">NEXT_PUBLIC_MIDTRANS_CLIENT_KEY</code> di <code className="rounded bg-muted px-1 font-mono">.env.local</code>.</li>
                <li><strong className="text-foreground">3.</strong> Jalankan ulang server, lalu daftarkan URL notifikasi di Settings → Configuration.</li>
                <li><strong className="text-foreground">4.</strong> Jalankan <code className="rounded bg-muted px-1 font-mono">supabase/schema.sql</code> agar riwayat pembayaran tersimpan.</li>
            </ol> : <p className="rounded-xl border border-border bg-muted/60 p-3.5 text-[11px] leading-relaxed text-muted-foreground">Pembayaran QRIS/Transfer dari kasir otomatis memakai Snap. Status akhir dikonfirmasi lewat notifikasi dan dicek ulang saat kasir dibuka, sehingga stok tidak berkurang untuk pembayaran yang gagal.</p>}
        </div>
    </CardContent></Card>;
}
