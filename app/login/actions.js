'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEMO_SESSION_COOKIE, encodeDemoSession, findDemoUser, sessionCookieOptions } from '@/lib/demo-auth';

export async function loginAction(_, formData) {
    const email = `${formData?.get('email') || ''}`.trim().toLowerCase();
    const password = `${formData?.get('password') || ''}`;
    const remember = formData?.get('remember_terminal') === 'on';

    let loggedIn = false;

    // 1. Coba login via Supabase Auth
    try {
        const supabase = await createClient();
        if (supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error && data?.user) {
                loggedIn = true;
            }
        }
    } catch (e) {
        console.warn('Supabase login warning:', e?.message);
    }

    // 2. Fallback jika offline atau akun demo terdaftar
    const demoUser = findDemoUser(email, password);
    if (loggedIn || demoUser) {
        const store = await cookies();
        const sessionUser = demoUser || {
            email,
            name: email.includes('owner') ? 'Owner Dian Motor' : 'Kasir Dian Motor',
            role: email.includes('owner') ? 'admin' : 'kasir',
        };
        store.set(DEMO_SESSION_COOKIE, encodeDemoSession(sessionUser), sessionCookieOptions(remember));
        redirect('/dashboard');
    }

    return { error: 'Email atau kata sandi tidak cocok.' };
}

export async function logoutAction() {
    try {
        const supabase = await createClient();
        await supabase?.auth.signOut();
    } catch (e) {}

    try {
        const store = await cookies();
        store.delete(DEMO_SESSION_COOKIE);
    } catch (e) {}

    redirect('/login');
}
