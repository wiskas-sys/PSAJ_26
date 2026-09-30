'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema } from '@/lib/validators';
import { DEMO_SESSION_COOKIE, encodeDemoSession, findDemoUser, sessionCookieOptions } from '@/lib/demo-auth';

export async function loginAction(_, formData) {
    const parsed = loginSchema.safeParse({ 
        email: formData.get('email'), 
        password: formData.get('password') 
    });
    
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' };
    }

    const remember = formData.get('remember_terminal') === 'on';

    // Langsung gunakan login dummy
    const user = findDemoUser(parsed.data.email, parsed.data.password);
    if (!user) {
        return { error: 'Email atau password tidak valid.' };
    }

    const store = await cookies();
    store.set(DEMO_SESSION_COOKIE, encodeDemoSession(user), sessionCookieOptions(remember));

    redirect('/dashboard');
}