'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_SESSION_COOKIE, encodeDemoSession, sessionCookieOptions } from '@/lib/demo-auth';

export async function loginAction(_, formData) {
    const store = await cookies();
    
    // User dummy langsung tanpa perlu cek password/email
    const user = { 
        email: 'admin@dianmotor.co.id', 
        name: 'Operator Dian Motor', 
        role: 'admin' 
    };

    store.set(DEMO_SESSION_COOKIE, encodeDemoSession(user), sessionCookieOptions(true));

    redirect('/dashboard');
}