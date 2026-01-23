'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (email: string, password: string): Promise<void> => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = async (): Promise<void> => {
        await signOut(auth);
    };

    const deleteAccount = async (email: string, password: string): Promise<void> => {
        if (!user) {
            throw new Error('No user is currently signed in');
        }

        // Re-authenticate the user before deletion (Firebase requirement)
        const credential = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(user, credential);

        // Delete the user account
        await deleteUser(user);
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        deleteAccount,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
