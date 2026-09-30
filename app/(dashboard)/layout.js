import { cookies } from 'next/headers';
import { AppShell } from '@/components/app-shell';
import { createClient } from '@/lib/supabase/server';
import { DEMO_SESSION_COOKIE, decodeDemoSession } from '@/lib/demo-auth';

async function resolveUser() {
    const store = await cookies();
    const demoUser = decodeDemoSession(store.get(DEMO_SESSION_COOKIE)?.value);

    // 1. Cek dan prioritaskan cookie demo login
    if (demoUser) {
        return demoUser;
    }

    // 2. Jika tidak ada cookie demo, baru coba cek Supabase
    const supabase = await createClient();
    if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
            const email = data.user.email ?? '';
            return { 
                email, 
                name: data.user.user_metadata?.full_name ?? email, 
                role: data.user.app_metadata?.role ?? 'admin' 
            };
        }
    }

    // 3. Fallback default user jika tidak ada sesi terdeteksi
    return { email: 'admin@dianmotor.co.id', name: 'Operator Dian Motor', role: 'admin' };
}

export default async function DashboardLayout({ children }) {
    const user = await resolveUser();
    return <AppShell user={user}>{children}</AppShell>;
}