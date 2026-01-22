'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(`${username}@routinelog.app`, password);
            showToast('Giriş başarılı', 'success');
            router.push('/today');
        } catch (error: any) {
            console.error(error);
            let message = 'Giriş yapılırken bir hata oluştu';
            if (error.code === 'auth/invalid-credential') {
                message = 'Kullanıcı adı veya şifre hatalı';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Çok fazla deneme yaptınız, lütfen bekleyin';
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
                    <p className="text-gray-400">Hesabınıza giriş yapın</p>
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
                            placeholder="Şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        size="lg"
                    >
                        Giriş Yap
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500">
                    Hesabınız yok mu?{' '}
                    <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                        Kayıt Ol
                    </Link>
                </p>
            </div>
        </div>
    );
}
