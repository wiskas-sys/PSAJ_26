export const DEMO_SESSION_COOKIE = 'dian-motor-session';

export const demoUsers = [
    { email: 'admin@dianmotor.co.id', password: 'dianmotor123', name: 'Admin Bengkel', role: 'admin' },
    { email: 'kasir@dianmotor.co.id', password: 'kasir123', name: 'Kasir Shift Pagi', role: 'kasir' },
    { email: 'mekanik@dianmotor.co.id', password: 'mekanik123', name: 'Mekanik Kepala', role: 'mekanik' },
];

export const roleLabels = { admin: 'Administrator', kasir: 'Kasir', mekanik: 'Mekanik' };

export function findDemoUser(email, password) {
    const normalized = String(email ?? '').trim().toLowerCase();
    return demoUsers.find((user) => user.email === normalized && user.password === password) ?? null;
}

export function encodeDemoSession(user) {
    return btoa(JSON.stringify({ email: user.email, name: user.name, role: user.role }));
}

export function decodeDemoSession(raw) {
    if (!raw)
        return null;
    try {
        const session = JSON.parse(atob(raw));
        if (!session?.email)
            return null;
        return { email: session.email, name: session.name ?? session.email, role: session.role ?? 'admin' };
    }
    catch {
        return null;
    }
}

export function sessionCookieOptions(remember = true) {
    return {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    };
}