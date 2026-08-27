'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validators';
export async function loginAction(_, formData) {
    const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
    if (!parsed.success)
        return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' };
    const supabase = await createClient();
    if (!supabase)
        return { error: 'Supabase belum dikonfigurasi. Isi variabel lingkungan untuk mengaktifkan login.' };
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error)
        return { error: 'Email atau password tidak valid.' };
    redirect('/dashboard');
}
