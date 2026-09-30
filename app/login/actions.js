'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validators';
import { DEMO_SESSION_COOKIE, encodeDemoSession, findDemoUser, sessionCookieOptions } from '@/lib/demo-auth';

export async function loginAction(_, formData) {
    const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
    if (!parsed.success)
        return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' };
    const remember = formData.get('remember_terminal') === 'on' || formData.get('remember_terminal') === 'true';
    const supabase = await createClient();
    if (supabase) {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error)
            return { error: 'Email atau password tidak valid.' };
    }
    else {
        const user = findDemoUser(parsed.data.email, parsed.data.password);
        if (!user)
            return { error: 'Email atau password tidak valid.' };
        const store = await cookies();
        store.set(DEMO_SESSION_COOKIE, encodeDemoSession(user), sessionCookieOptions(remember));
    }
    redirect('/dashboard');
}

export async function logoutAction() {
    const supabase = await createClient();
    if (supabase) {
        try { await supabase.auth.signOut(); }
        catch { }
    }
    const store = await cookies();
    store.set(DEMO_SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
    redirect('/login');
}