'use client';
import { useUser } from '@/components/user-context';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function RoleGuard({ children, allowRole = 'owner', fallbackTitle = 'Akses Khusus Owner' }) {
    const { isOwner } = useUser();

    if (allowRole === 'owner' && !isOwner) {
        return (
            <div className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-login-rise">
                <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive mb-4 shadow-sm">
                    <ShieldAlert className="size-8" />
                </div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-destructive uppercase">
                    RESTRICTED ACCESS · KHUSUS OWNER
                </span>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{fallbackTitle}</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                    Halaman ini berisi data rahasia, pengaturan sistem, dan laporan keuangan yang hanya boleh diakses oleh <strong>Owner Dian Motor</strong>. Akun Kasir dibatasi untuk melindungi kebijakan operasional dan keuntungan bisnis bengkel.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link href="/kasir">
                        <Button variant="default" className="gap-2 font-semibold shadow-md">
                            <ArrowLeft className="size-4" /> Kembali ke Terminal Kasir
                        </Button>
                    </Link>
                    <Link href="/stok">
                        <Button variant="outline" className="font-semibold">
                            Cek Stok Barang
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return children;
}

