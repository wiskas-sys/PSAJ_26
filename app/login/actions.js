'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_SESSION_COOKIE, encodeDemoSession, findDemoUser, sessionCookieOptions } from '@/lib/demo-auth';

export async function loginAction(_, formData) {
    const email = formData?.get('email') || 'admin@dianmotor.co.id';
    const password = formData?.get('password') || 'password';
    const remember = formData?.get('remember_terminal') === 'on';

    const user = findDemoUser(email, password) || {
        email: 'admin@dianmotor.co.id',
        name: 'Operator Dian Motor',
        role: 'admin'
    };

    const store = await cookies();
    store.set(DEMO_SESSION_COOKIE, encodeDemoSession(user), sessionCookieOptions(remember));

    redirect('/dashboard');
}