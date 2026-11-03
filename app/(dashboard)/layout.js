import { AppShell } from '@/components/app-shell';
import AiChatWidget from '@/components/ai/ai-chat-widget';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }) {
    const supabase = await createClient();
    if (!supabase) redirect('/login?error=supabase');
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) redirect('/login');
    const { data: profile, error } = await supabase.from('profiles').select('full_name,role,is_active').eq('id', authUser.id).single();
    if (error || !profile?.is_active) redirect('/login?error=profile');
    const user = { email: authUser.email, name: profile.full_name || authUser.email, role: profile.role };
    return (
        <>
            <AppShell user={user}>{children}</AppShell>
            <AiChatWidget />
        </>
    );
}
