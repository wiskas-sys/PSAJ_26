'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function loginAction(_, formData) {
    const email = `${formData?.get('email') || ''}`.trim();
    const password = `${formData?.get('password') || ''}`;
    const supabase = await createClient();
    if (!supabase) return { error: 'Supabase belum dikonfigurasi pada server.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Email atau password tidak cocok.' };
    redirect('/dashboard');
}

export async function logoutAction() {
    const supabase = await createClient();
    await supabase?.auth.signOut();
    redirect('/login');
}
