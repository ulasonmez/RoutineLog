'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { addDemoItems } from '@/lib/firestore';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await register(`${username}@routinelog.app`, password);
            // Note: We can't easily get the uid here without waiting for auth state change,
            // but the AuthContext will update. 
            // Ideally we should wait for the user to be set in context, but for now let's just redirect.
            // The demo items adding might need to happen after we are sure we have a user.
            // A better place for demo items might be in a separate "onboarding" step or check in the main layout.
            // However, let's try to do it here if we can, or just skip it for now and let the user add them manually or via a button.
            // The prompt said "İlk girişte demo item'ları otomatik ekleme opsiyonel... ama bunu kullanıcı kontrol edebilsin".
            // So I won't auto-add them here to keep it simple and fast. I'll add a button in Items page.

            showToast('Hesap oluşturuldu', 'success');
            router.push('/today');
        } catch (error: any) {
            console.error(error);
            let message = 'Kayıt olurken bir hata oluştu';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Bu kullanıcı adı zaten kullanımda';
            } else if (error.code === 'auth/weak-password') {
                message = 'Şifre en az 6 karakter olmalı';
            }
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                        Routine Log
                    </h1>
                    <p className="text-gray-400">Yeni hesap oluşturun</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Kullanıcı Adı"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                        <Input
                            type="password"
                            placeholder="Şifre (en az 6 karakter)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        size="lg"
                    >
                        Kayıt Ol
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500">
                    Zaten hesabınız var mı?{' '}
                    <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
