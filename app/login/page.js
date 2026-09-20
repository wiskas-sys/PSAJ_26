'use client';
import { useActionState, useEffect, useState } from 'react';
import { Boxes, ChevronRight, LockKeyhole, Mail, Moon, ReceiptText, ShieldCheck, Sun, Wrench } from 'lucide-react';
import { loginAction } from './actions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from 'next-themes';

function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();
    return (<button type="button" className="grid size-10 place-items-center rounded-xl border border-border bg-sidebar text-muted-foreground transition-colors hover:text-foreground" aria-label="Ganti tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{mounted && theme === 'light' ? <Moon className="size-4"/> : <Sun className="size-4"/>}</button>);
}

const fieldCls = 'min-h-[49px] w-full rounded-[11px] border border-border bg-white/80 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-foreground/25 focus:border-primary focus:ring-3 focus:ring-primary/10 dark:bg-[rgba(9,9,11,.58)]';

export default function LoginPage() {
    const [state, action, pending] = useActionState(loginAction, { error: '' });
    const [showPassword, setShowPassword] = useState(false);
    return <main className="relative min-h-screen bg-background lg:grid lg:grid-cols-[1.12fr_.88fr]">
    <div className="fx-grid" aria-hidden="true"/>
    <section className="relative z-10 flex min-h-[320px] flex-col justify-between border-b border-border px-6 py-7 sm:min-h-[380px] lg:min-h-screen lg:border-r lg:border-b-0 lg:px-9 xl:px-14">
      <div className="flex items-center gap-3"><span className="brand-mark"><span>DM</span></span><div><strong className="block text-[17px] tracking-tight">DIAN MOTOR</strong><small className="mt-0.5 block font-mono text-[9px] tracking-[.2em] text-muted-foreground">WORKSHOP OPERATIONS PLATFORM</small></div><ThemeToggle /></div>
      <div className="animate-login-rise max-w-2xl">
        <p className="eyebrow mt-7 lg:mt-10">DIAN MOTOR</p>
        <h1 className="mt-3 text-[clamp(32px,7vw,48px)] font-extrabold leading-[.98] tracking-[-.06em] lg:mt-4 lg:text-[clamp(46px,4.6vw,72px)]">Kendali bengkel.<br /><span className="text-primary">Satu akses aman.</span></h1>
        <p className="mt-4 hidden max-w-lg text-base leading-[1.8] text-muted-foreground sm:block">Kelola kasir, inventori, service bay, dan seluruh cabang melalui satu ruang kerja yang cepat dan terlindungi.</p>
        <div className="mt-6 hidden max-w-2xl grid-cols-3 gap-2.5 sm:grid">
          {[['Kasir & Transaksi', ReceiptText], ['Stok & Inventori', Boxes], ['Servis & Perbaikan', Wrench]].map(([label, Icon]) => <div key={label} className="flex items-center gap-3 rounded-[15px] border border-border bg-sidebar p-3"><span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-muted text-primary"><Icon className="size-4"/></span><strong className="block text-[12px] leading-snug">{label}</strong></div>)}
        </div>
      </div>
      <div className="hidden items-center gap-4 font-mono text-[8px] tracking-[.12em] text-muted-foreground lg:flex"><p className="m-0">KASIR · STOK · SERVIS</p><strong className="ml-auto text-muted-foreground">V2.4.0</strong></div>
    </section>
    <section className="relative z-10 flex min-h-[640px] items-center justify-center bg-[linear-gradient(145deg,rgba(247,248,250,.8),rgba(253,242,242,.92))] p-5 dark:bg-[linear-gradient(145deg,rgba(9,9,11,.68),rgba(16,8,10,.88))] md:p-10 lg:min-h-screen lg:overflow-y-auto">
      <div className="w-full max-w-[600px]">
        <div className="animate-login-rise relative overflow-hidden rounded-[24px] border border-border bg-[linear-gradient(155deg,rgba(255,255,255,.97),rgba(250,250,250,.93))] p-7 shadow-[0_24px_60px_rgba(16,24,40,.08)] md:p-9 [--rise-delay:60ms] dark:border-white/[0.1] dark:bg-[linear-gradient(155deg,rgba(25,25,28,.94),rgba(14,14,16,.96))] dark:shadow-[0_30px_80px_rgba(0,0,0,.5)]">
          <div className="absolute top-0 left-[13%] h-[2px] w-[74%] bg-[linear-gradient(90deg,transparent,#dc2626_50%,transparent)]" aria-hidden="true"/>
          <div className="relative mb-5 flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-[14px] border border-red-500/[0.22] bg-red-500/10 text-[#ef4444]"><ShieldCheck className="size-6"/></span>
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.065] px-2.5 py-1.5 font-mono text-[8px] font-bold tracking-[.12em] text-[#6ee7b7]"><span className="size-1.5 rounded-full bg-[#34d399]"/>AMAN &amp; TERVERIFIKASI</span>
          </div>
          <div className="relative mb-5">
            <p className="m-0 font-mono text-[9px] font-bold tracking-[.18em] text-[#ef4444]">PORTAL OPERATOR</p>
            <h2 className="mt-2 text-[clamp(27px,2vw,34px)] font-bold leading-[1.1] tracking-[-.045em]">Selamat datang kembali</h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">Masuk ke ruang kerja DIAN MOTOR untuk memulai sesi terminal Anda.</p>
          </div>
          {state.error && <Alert variant="destructive" className="mb-4"><AlertDescription>{state.error}</AlertDescription></Alert>}
          <form action={action} onSubmit={() => {
                const remember = document.querySelector('input[name=remember_terminal]')?.checked;
                try { localStorage.setItem('dian-motor-remember', remember ? '1' : '0'); } catch {}
            }} className="grid gap-3.5">
            <label className="grid gap-1.5 text-xs font-semibold">Email kerja
              <span className="input-with-icon"><Mail className="size-[18px]"/><input name="email" type="email" required autoComplete="email" inputMode="email" placeholder="nama@dianmotor.co.id" className={fieldCls}/></span>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">Password
              <span className="input-with-icon"><LockKeyhole className="size-[18px]"/><input name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder="Masukkan password Anda" className={fieldCls + ' pr-16'}/><button type="button" className="absolute top-1/2 right-2.5 z-[1] -translate-y-1/2 text-[11px] font-bold text-muted-foreground hover:text-foreground" onMouseDown={e => e.preventDefault()} onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Sembunyi' : 'Lihat'}</button></span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5">
              <input type="checkbox" name="remember_terminal" defaultChecked className="size-4 accent-[#dc2626]"/>
              <span className="flex-1"><strong className="block text-[11px]">Ingat terminal ini</strong><small className="mt-0.5 block text-[9px] text-muted-foreground">Tetap masuk di perangkat ini lebih lama.</small></span>
            </label>
            <Button type="submit" size="lg" disabled={pending} className="relative h-[51px] overflow-hidden rounded-xl text-[13px] font-bold tracking-[.055em] shadow-[0_2px_8px_rgba(220,38,38,.18)]">{pending ? <><ChevronRight className="size-4 animate-spin"/>MEMPROSES...</> : <><span>MASUK KE TERMINAL</span><ChevronRight className="size-4"/></>}</Button>
          </form>
        </div>
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-2.5 font-mono text-[9px] text-muted-foreground"><a href="mailto:support@dianmotor.co.id" className="hover:text-primary">Bantuan teknis</a><span className="text-muted-foreground/40">•</span><span>DIAN MOTOR © 2026</span></nav>
      </div>
    </section>
  </main>;
}