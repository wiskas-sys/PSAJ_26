'use client';
import { createContext, useContext } from 'react';
import { isOwner as checkOwner, isKasir as checkKasir, roleLabels } from '@/lib/demo-auth';

const UserContext = createContext({
    user: null,
    role: 'kasir',
    roleLabel: 'Kasir',
    isOwner: false,
    isKasir: true,
});

export function UserProvider({ children, user }) {
    const role = user?.role || 'kasir';
    const isOwner = checkOwner(role);
    const isKasir = checkKasir(role);
    const roleLabel = roleLabels[role] || (isOwner ? 'Owner (Pemilik)' : 'Kasir');

    return (
        <UserContext.Provider value={{ user, role, roleLabel, isOwner, isKasir }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
