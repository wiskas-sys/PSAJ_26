'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
    Bell, Boxes, ChevronDown, ChevronRight, CircleUserRound, Clock3, CreditCard, HelpCircle, LogOut, Menu, Moon,
    ReceiptText, Search, Settings, ShoppingCart, Sun, Wrench, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const nav = [
    ['Cashier / Terminal POS', '/kasir', ShoppingCart],
    ['Sales & Transactions', '/transaksi', ReceiptText],
    ['Live Inventory', '/stok', Boxes],
    ['Service & Work Orders', '/servis', Wrench],
    ['Payments & Gateway', '/pembayaran', CreditCard],
    ['Daily Shift Settlement', '/laporan', Clock3],
    ['System Settings', '/pengaturan', Settings],
];

const mobileNav = [
    ['Cashier', '/kasir'],
    ['Transactions', '/transaksi'],
    ['Inventory', '/stok'],
    ['Payments', '/pembayaran'],
    ['Work Orders', '/servis'],
    ['Shift', '/laporan'],
];

function labelFor(pathname) {
    const hit = nav.find(([, href]) => href === pathname);
    if (hit)
        return hit[0];
    const slug = pathname.split('/').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return slug || 'Terminal';
}

function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}

function LiveClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);
    return <time className="hidden font-mono text-[11px] text-muted-foreground md:block">{now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} · {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</time>;
}

function ThemeToggle({ className }) {
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();
    return (<button type="button" className={cn('grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground', className)} aria-label="Ganti tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{mounted && theme === 'light' ? <Moon className="size-4"/> : <Sun className="size-4"/>}</button>);
}

function NavList({ onClick }) {
    const path = usePathname();
    return <nav className="grid gap-1.5 px-[9px] py-5" aria-label="Navigasi utama">{nav.map(([label, href, Icon]) => {
            const active = path === href;
            return <Link key={href} href={href} onClick={onClick} className={cn('flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors', active ? 'bg-primary text-white shadow-[0_9px_24px_rgba(220,38,38,.21)]' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><Icon className="size-[18px]" aria-hidden="true"/><span>{label}</span></Link>;
        })}</nav>;
}

function SignOutItem() {
    const router = useRouter();
    async function signOut() {
        try {
            if (isSupabaseConfigured()) {
                const supabase = createClient();
                await supabase.auth.signOut();
            }
        }
        finally {
            router.push('/login');
            router.refresh();
        }
    }
    return <DropdownMenuItem className="h-9 text-red-500 data-[variant=destructive]:text-red-500" onClick={signOut}><LogOut className="size-4 text-red-500"/>Keluar dengan aman</DropdownMenuItem>;
}

export function AppShell({ children }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    useEffect(() => setOpen(false), [pathname]);
    return <div className="relative min-h-screen bg-background lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
    <div className="fx-grid lg:hidden" aria-hidden="true"/>
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:z-40 lg:bg-sidebar/70 lg:backdrop-blur-2xl ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex h-[76px] items-center gap-3 border-b border-border px-4"><Link href="/kasir" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3"><span className="brand-mark"><span>DM</span></span><div className="min-w-0"><strong className="block truncate tracking-wide">DIAN MOTOR</strong><small className="mt-0.5 block font-mono text-[9px] tracking-[.16em] text-muted-foreground">ENTERPRISE POS v2.4.0</small></div></Link><button type="button" onClick={() => setOpen(false)} className="ml-auto grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden" aria-label="Tutup navigasi"><X className="size-4"/></button></div>
      <div className="min-h-0 flex-1 overflow-y-auto"><NavList onClick={() => setOpen(false)}/></div>
      <div className="terminal-card">
        <p><span>Terminal</span><strong>TERM-01</strong></p>
        <p><span>Operator</span><strong className="flex items-center text-emerald-400"><span className="live-dot mr-1.5"/>Shift Active</strong></p>
        <p><span>System</span><strong className="text-emerald-400">99.98%</strong></p>
      </div>
    </aside>
    {open && <button type="button" aria-label="Tutup navigasi" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"/>}
    <div className="relative z-10 min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-30 flex min-h-[76px] items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-5">
        <button type="button" onClick={() => setOpen(true)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground lg:hidden" aria-label="Buka navigasi"><Menu className="size-4"/></button>
        <div className="hidden items-center gap-1 text-xs text-muted-foreground lg:flex"><strong className="text-foreground">DIAN MOTOR</strong><ChevronRight className="size-3"/><span>{labelFor(pathname)}</span><ChevronRight className="size-3"/><span className="text-emerald-400">Active Session</span></div>
        <label className="relative ml-auto block w-full min-w-0 sm:w-[min(440px,38vw)]"><Search className="absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Search SKU, phone, or Work Order..." className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/10"/><kbd className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 sm:inline">Ctrl K</kbd></label>
        <Button variant="outline" size="sm" className="hidden h-10 shrink-0 xl:flex">Hold Sale <kbd className="ml-1.5">F2</kbd></Button>
        <LiveClock />
        <Link href="/notifikasi" className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground" aria-label="Notifikasi"><Bell className="size-4"/><span className="absolute -top-1.5 -right-1.5 grid size-[17px] place-items-center rounded-full bg-primary text-[9px] font-bold text-white">3</span></Link>
        <ThemeToggle className="shrink-0"/>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex shrink-0 items-center gap-2.5 rounded-xl p-1 pr-2 text-left transition-colors hover:bg-muted"><span className="grid size-9 place-items-center rounded-full bg-primary text-[11px] font-extrabold text-white">AB</span><span className="hidden max-w-[150px] xl:block"><strong className="block truncate text-[13px]">Admin Bengkel</strong><small className="block truncate text-[10px] text-muted-foreground">Administrator</small></span><ChevronDown className="hidden size-3.5 text-muted-foreground xl:block"/></DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-1.5" align="end" sideOffset={10}>
            <DropdownMenuLabel className="pb-2">Cashier Profile</DropdownMenuLabel>
            <DropdownMenuItem className="h-9"><CircleUserRound className="size-4 text-muted-foreground"/>Profil &amp; hak akses</DropdownMenuItem>
            <DropdownMenuItem className="h-9"><Wrench className="size-4 text-muted-foreground"/>Aktivitas shift</DropdownMenuItem>
            <DropdownMenuItem className="h-9"><HelpCircle className="size-4 text-muted-foreground"/>Bantuan shortcut</DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <nav className="sticky top-[76px] z-20 flex gap-1.5 overflow-x-auto border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur-xl lg:hidden" aria-label="Navigasi cepat">{mobileNav.map(([l, href]) => <Link key={href} href={href} className={cn('flex h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold', pathname === href ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground')}>{l}</Link>)}</nav>
      <main className="relative p-4 md:p-6 xl:p-8"><div className="mx-auto max-w-[1400px]">{children}</div></main>
    </div>
  </div>;
}