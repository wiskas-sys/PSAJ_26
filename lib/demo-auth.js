export const DEMO_SESSION_COOKIE = 'dian-motor-session';

export const roleLabels = {
    owner: 'Owner (Pemilik)',
    admin: 'Owner (Pemilik)',
    kasir: 'Kasir',
};

// Batasan akun resmi Dian Motor
export const MAX_OWNER_ACCOUNTS = 3;
export const MAX_KASIR_ACCOUNTS = 1;

// 3 Akun Owner Resmi & 1 Akun Kasir Resmi
export const authorizedUsers = [
    {
        email: 'owner@dianmotor.co.id',
        password: 'owner123',
        name: 'Owner Utama Dian Motor',
        role: 'admin', // Owner
    },
    {
        email: 'owner2@dianmotor.co.id',
        password: 'owner123',
        name: 'Co-Owner Dian Motor',
        role: 'admin', // Owner
    },
    {
        email: 'owner3@dianmotor.co.id',
        password: 'owner123',
        name: 'Supervisor Dian Motor',
        role: 'admin', // Owner
    },
    {
        email: 'kasir@dianmotor.co.id',
        password: 'kasir123',
        name: 'Kasir Shift Dian Motor',
        role: 'kasir',
    },
];

export const demoUsers = authorizedUsers;

export function isOwner(role) {
    return role === 'admin' || role === 'owner';
}

export function isKasir(role) {
    return role === 'kasir';
}

export function findDemoUser(email, password) {
    const normalized = String(email ?? '').trim().toLowerCase();
    return authorizedUsers.find((user) =>
        user.email.toLowerCase() === normalized &&
        (!password || user.password === password)
    ) ?? null;
}

export function encodeDemoSession(user) {
    return btoa(JSON.stringify({ email: user.email, name: user.name, role: user.role }));
}

export function decodeDemoSession(raw) {
    if (!raw) return null;
    try {
        const session = JSON.parse(atob(raw));
        if (!session?.email) return null;
        return {
            email: session.email,
            name: session.name ?? session.email,
            role: session.role ?? 'kasir',
        };
    } catch {
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
