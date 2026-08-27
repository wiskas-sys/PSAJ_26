import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
export async function proxy(request) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
        return NextResponse.next();
    let response = NextResponse.next({ request });
    const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(items) { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
    const { data: { user } } = await supabase.auth.getUser();
    const isLogin = request.nextUrl.pathname === '/login';
    if (!user && !isLogin) {
        const next = request.nextUrl.clone();
        next.pathname = '/login';
        return NextResponse.redirect(next);
    }
    if (user && isLogin) {
        const next = request.nextUrl.clone();
        next.pathname = '/dashboard';
        return NextResponse.redirect(next);
    }
    return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };
