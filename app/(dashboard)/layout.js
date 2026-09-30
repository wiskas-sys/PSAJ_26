import { AppShell } from '@/components/app-shell';
import AiChatWidget from '@/components/ai/ai-chat-widget';

export default function DashboardLayout({ children }) {
    // Memaksa user dummy aktif agar AppShell langsung membuka dashboard
    const user = {
        email: 'admin@dianmotor.co.id',
        name: 'Operator Dian Motor',
        role: 'admin'
    };

    return (
        <>
            <AppShell user={user}>{children}</AppShell>
            <AiChatWidget />
        </>
    );
}