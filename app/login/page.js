'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { loginAction } from './actions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';

const fieldCls = 'min-h-[49px] w-full rounded-[11px] border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-foreground/25 focus:border-primary focus:ring-3 focus:ring-primary/10';

export default function LoginPage() {
    const [state, action, pending] = useActionState(loginAction, { error: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [fields, setFields] = useState({ email: '', password: '' });
    const update = (key) => (event) => setFields((current) => ({ ...current, [key]: event.target.value }));

    return <main className="relative min-h-screen bg-background lg:grid lg:grid-cols-[1.12fr_.88fr]">
    <section className="relative z-10 isolate flex min-h-[320px] flex-col justify-between overflow-hidden border-b border-border px-6 py-7 sm:min-h-[380px] lg:min-h-screen lg:border-r lg:border-b-0 lg:px-9 xl:px-14">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <Image src="/images/landing/contact-workshop.jpg" alt="" fill preload sizes="(min-width: 1024px) 56vw, 100vw" className="scale-110 object-cover object-center blur-[4px]" />
        <div className="absolute inset-0 bg-background/[.67]" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent to-background/80 lg:block" />
      </div>
      <div className="flex items-center gap-3"><span className="brand-mark"><span>DM</span></span><div><strong className="block text-[17px] tracking-tight">DIAN MOTOR</strong><small className="mt-0.5 block font-mono text-[10px] tracking-[.18em] text-foreground/80">SISTEM BENGKEL</small></div><ThemeToggle className="ml-auto size-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" /></div>
      <div className="animate-login-rise max-w-2xl py-8 lg:py-0">
        <h1 className="text-[clamp(32px,7vw,48px)] font-extrabold leading-[.98] tracking-[-.06em] lg:text-[clamp(46px,4.6vw,72px)]">Kendali bengkel.<br /><span className="text-red-800 dark:text-red-400">Satu akses aman.</span></h1>
        <p className="mt-4 hidden max-w-lg text-base leading-[1.8] text-foreground/80 sm:block">Kasir, stok, dan jadwal servis dalam satu terminal. Masuk dengan akun cabang yang terdaftar.</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-[.12em] text-foreground/80"><p className="m-0">KASIR · STOK · SERVIS</p><strong className="ml-auto">BUMIAYU · BREBES</strong></div>
    </section>
    <section className="relative isolate flex min-h-[640px] items-center justify-center overflow-hidden bg-background p-5 md:p-10 lg:min-h-screen lg:overflow-y-auto">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image src="/images/landing/whyus-engine.jpg" alt="" fill sizes="(min-width: 1024px) 44vw, 100vw" className="animate-login-drift scale-105 object-cover object-center opacity-[.22] grayscale contrast-125 blur-[1.5px] dark:opacity-[.3]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/80 to-background" />
      </div>
      <div className="relative z-10 w-full max-w-[440px]">
        <Link href="/" className="relative z-20 mb-3 inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 font-mono text-[10px] font-bold tracking-[.12em] text-foreground/80 uppercase shadow-sm transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ArrowLeft className="size-3.5"/>Beranda</Link>
        <div className="relative">
          <div aria-hidden="true" className="pointer-events-none absolute -inset-x-1 -bottom-1.5 top-2 rounded-2xl border border-border/60 bg-card/40" />
          <div className="animate-login-rise relative overflow-hidden rounded-2xl border border-border bg-card/95 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,.45)] backdrop-blur-xl dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,.8)] sm:p-8 [--rise-delay:60ms]">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
              <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-emerald-600/20 bg-emerald-500/[.06] px-2 py-1 font-mono text-[9px] font-bold tracking-[.12em] text-emerald-700 dark:text-emerald-300 sm:px-2.5"><span className="size-1.5 rounded-full bg-emerald-500 animate-live-beacon" aria-hidden="true"/>Portal resmi · Pemilik &amp; kasir</span>
              <span className="hidden h-px flex-1 bg-border/70 sm:block" aria-hidden="true"/>
              <span className="hidden shrink-0 font-mono text-[9px] tracking-[.14em] text-muted-foreground sm:inline">BUMIAYU</span>
            </div>
            <div className="mb-6">
              <h2 className="text-[clamp(24px,2vw,30px)] font-bold leading-[1.1] tracking-[-.045em]">Masuk ke terminal</h2>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">Gunakan email dan kata sandi terdaftar untuk membuka sesi kerja.</p>
          </div>
          {state.error && <Alert className="mb-4 border-destructive/30 bg-destructive/5 text-destructive dark:text-red-300"><AlertDescription className="text-inherit">{state.error}</AlertDescription></Alert>}
          <form action={action} onSubmit={() => {
                const remember = document.querySelector('input[name=remember_terminal]')?.checked;
                try { localStorage.setItem('dian-motor-remember', remember ? '1' : '0'); } catch {}
            }} className="grid gap-4">
            <label className="grid gap-1.5 text-xs font-semibold">Email terdaftar
              <span className="input-with-icon"><Mail className="size-[18px]"/><input name="email" type="email" required autoComplete="email" inputMode="email" placeholder="nama@dianmotor.co.id" value={fields.email} onChange={update('email')} className={fieldCls}/></span>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold">Kata sandi
              <span className="input-with-icon"><LockKeyhole className="size-[18px]"/><input name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder="Masukkan kata sandi Anda" value={fields.password} onChange={update('password')} className={fieldCls + ' pr-16'}/><button type="button" className="absolute inset-y-0 right-2 z-[1] flex items-center px-3 text-[11px] font-bold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onMouseDown={e => e.preventDefault()} onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Sembunyi' : 'Lihat'}</button></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-2.5">
              <input type="checkbox" name="remember_terminal" defaultChecked className="mt-0.5 size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
              <span><strong className="block text-[12px] font-semibold">Ingat sesi ini</strong><small className="mt-0.5 block text-[11px] text-muted-foreground">Tetap masuk di terminal ini.</small></span>
            </label>
            <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="h-12 w-full rounded-xl text-[13px] font-semibold hover:bg-primary/95 disabled:opacity-100">{pending ? <><Loader2 className="size-4 animate-spin"/>Memproses...</> : 'Masuk'}</Button>
          </form>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap items-center justify-center gap-2.5 rounded-full border border-border/60 bg-background px-3 py-1.5 font-mono text-[10px] text-muted-foreground"><a href="mailto:support@dianmotor.co.id" className="inline-flex items-center rounded-sm py-1.5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Bantuan teknis</a><span className="text-muted-foreground/40">•</span><span>DIAN MOTOR © 2026</span></nav>
      </div>
    </section>
  </main>;
}
