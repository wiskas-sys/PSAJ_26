import { AppShell } from '@/components/app-shell';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AiChatWidget from '@/components/ai/ai-chat-widget';
import { DEMO_SESSION_COOKIE, decodeDemoSession } from '@/lib/demo-auth';

export default async function DashboardLayout({ children }) {
    let user = null;

    try {
        const supabase = await createClient();
        if (supabase) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name,role,is_active')
                    .eq('id', authUser.id)
                    .single();
                if (profile && profile.is_active) {
                    user = {
                        email: authUser.email,
                        name: profile.full_name || authUser.email,
                        role: profile.role, // 'admin' (Owner) atau 'kasir'
                    };
                }
            }
        }
    } catch (e) {
        console.error('Auth verification error:', e);
    }

    // Cek sesi demo / cookie
    if (!user) {
        try {
            const store = await cookies();
            const demoCookie = store.get(DEMO_SESSION_COOKIE)?.value;
            const demoUser = decodeDemoSession(demoCookie);
            if (demoUser) {
                user = demoUser;
            }
        } catch (e) {}
    }

    // Jika belum login, proteksi dan arahkan ke halaman login
    if (!user) {
        redirect('/login');
    }

    return (
        <>
            <AppShell user={user}>{children}</AppShell>
            <AiChatWidget userRole={user.role} />
        </>
    );
}
