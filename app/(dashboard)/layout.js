import { AppShell } from '@/components/app-shell';

async function resolveUser() {
    // Langsung return user dummy tanpa panggil Supabase/cookies agar tidak hang
    return { email: 'admin@dianmotor.co.id', name: 'Operator Dian Motor', role: 'admin' };
}

export default async function DashboardLayout({ children }) {
    const user = await resolveUser();
    return <AppShell user={user}>{children}</AppShell>;
}