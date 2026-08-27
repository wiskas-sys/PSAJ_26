'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Boxes, ChartNoAxesCombined, ChevronDown, CircleUserRound, Gauge, HandCoins, LayoutGrid, LogOut, Menu, Package, PackageMinus, PackagePlus, ReceiptText, Settings, ShoppingCart, Tags, UserCog, Users, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
const nav = [
    ['Dashboard', '/dashboard', Gauge], ['Kasir', '/kasir', ShoppingCart], ['Stok Barang', '/stok', Boxes], ['Barang Masuk', '/barang-masuk', PackagePlus], ['Barang Keluar', '/barang-keluar', PackageMinus], ['Produk', '/produk', Package], ['Kategori', '/kategori', Tags], ['Supplier', '/supplier', HandCoins], ['Pelanggan', '/pelanggan', Users], ['Servis', '/servis', Wrench], ['Transaksi', '/transaksi', ReceiptText], ['Laporan', '/laporan', ChartNoAxesCombined], ['Notifikasi', '/notifikasi', Bell], ['Pengguna', '/pengguna', UserCog], ['Pengaturan', '/pengaturan', Settings],
];
function NavLinks({ mobile = false }) {
    const path = usePathname();
    return <nav className={cn('flex flex-col gap-1', mobile && 'pt-3')}>{nav.map(([label, href, Icon]) => {
            const active = path === href;
            return <Link key={href} href={href} className={cn('flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors', active ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}><Icon className="size-5" aria-hidden="true"/><span>{label}</span>{label === 'Notifikasi' && <Badge className="ml-auto">3</Badge>}</Link>;
        })}</nav>;
}
export function AppShell({ children }) {
    return <div className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[248px_1fr]">
    <aside className="hidden min-h-screen bg-sidebar p-4 lg:fixed lg:inset-y-0 lg:flex lg:w-[248px] lg:flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3 text-sidebar-foreground"><span className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-black text-primary-foreground">DM</span><span><strong className="block tracking-wide">DIAN MOTOR</strong><small className="text-sidebar-foreground/50">Sistem Bengkel</small></span></Link>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto"><NavLinks /></div>
      <div className="flex items-center gap-3 border-t border-sidebar-border pt-4"><CircleUserRound className="size-9 text-sidebar-foreground"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-sidebar-foreground">Admin Bengkel</p><p className="text-xs text-sidebar-foreground/50">Administrator</p></div><LogOut className="size-4 text-sidebar-foreground/60"/></div>
    </aside>
    <div className="lg:col-start-2">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3"><Sheet><SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden"/>}><Menu /><span className="sr-only">Buka navigasi</span></SheetTrigger><SheetContent side="left" className="w-[290px] bg-sidebar p-4"><SheetHeader><SheetTitle className="text-left text-sidebar-foreground">DIAN MOTOR</SheetTitle></SheetHeader><NavLinks mobile/></SheetContent></Sheet><div><p className="text-sm font-semibold">DIAN MOTOR</p><p className="hidden text-xs text-muted-foreground sm:block">Kamis, 27 Agustus 2026</p></div></div>
        <div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="relative"><Bell /><Badge className="absolute -right-1 -top-1 size-5 justify-center p-0 text-[10px]">3</Badge><span className="sr-only">Notifikasi</span></Button><Button variant="ghost" className="hidden gap-2 sm:flex"><CircleUserRound /><span>Admin</span><ChevronDown /></Button></div>
      </header>
      <main className="p-4 pb-24 md:p-6 lg:p-8 lg:pb-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background p-1 lg:hidden">{[['Beranda', '/dashboard', LayoutGrid], ['Kasir', '/kasir', ShoppingCart], ['Stok', '/stok', Boxes], ['Masuk', '/barang-masuk', PackagePlus], ['Keluar', '/barang-keluar', PackageMinus]].map(([label, href, Icon]) => <Link key={href} href={href} className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-muted-foreground"><Icon className="size-5"/><span>{label}</span></Link>)}</nav>
    </div>
  </div>;
}
