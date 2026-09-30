import { cookies } from 'next/headers';
import { AppShell } from '@/components/app-shell';
import { DEMO_SESSION_COOKIE, decodeDemoSession } from '@/lib/demo-auth';

async function resolveUser() {
    const store = await cookies();
    const demoCookie = store.get(DEMO_SESSION_COOKIE)?.value;
    const demoUser = decodeDemoSession(demoCookie);

    if (demoUser && demoUser.email) {
        return demoUser;
    }

    // Default user dummy agar AppShell tidak me-redirect ke login
    return { 
        email: 'admin@dianmotor.co.id', 
        name: 'Operator Dian Motor', 
        role: 'admin' 
    };
}

export default async function DashboardLayout({ children }) {
    const user = await resolveUser();
    return <AppShell user={user}>{children}</AppShell>;
}