import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { DEMO_SESSION_COOKIE, decodeDemoSession } from '@/lib/demo-auth';
export async function proxy(request) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const isLogin = request.nextUrl.pathname === '/login';
    let signedIn = false;
    let response = NextResponse.next({ request });
    if (url && key) {
        let refreshed = [];
        const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(items) { items.forEach(({ name, value }) => request.cookies.set(name, value)); refreshed = items; response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
        const { data: { user } } = await supabase.auth.getUser();
        signedIn = Boolean(user);
        if (signedIn === isLogin) {
            const next = request.nextUrl.clone();
            next.pathname = signedIn ? '/dashboard' : '/login';
            const redirectResponse = NextResponse.redirect(next);
            refreshed.forEach(({ name, value, options }) => redirectResponse.cookies.set(name, value, options));
            return redirectResponse;
        }
        return response;
    }
    signedIn = Boolean(decodeDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value));
    if (signedIn === isLogin) {
        const next = request.nextUrl.clone();
        next.pathname = signedIn ? '/dashboard' : '/login';
        return NextResponse.redirect(next);
    }
    return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/midtrans/notification|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };