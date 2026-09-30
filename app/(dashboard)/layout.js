import { cookies } from 'next/headers';
import { AppShell } from '@/components/app-shell';
import { createClient } from '@/lib/supabase/server';
import { DEMO_SESSION_COOKIE, decodeDemoSession } from '@/lib/demo-auth';

async function resolveUser() {
    const supabase = await createClient();
    if (supabase) {
        const { data } = await supabase.auth.getUser();
        const email = data.user?.email ?? '';
        return { email, name: data.user?.user_metadata?.full_name ?? email, role: data.user?.app_metadata?.role ?? 'admin' };
    }
    const store = await cookies();
    return decodeDemoSession(store.get(DEMO_SESSION_COOKIE)?.value) ?? { email: '', name: 'Operator', role: 'kasir' };
}

export default async function DashboardLayout({ children }) {
    const user = await resolveUser();
    return <AppShell user={user}>{children}</AppShell>;
}