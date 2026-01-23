'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto pb-24">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">Ayarlar</h1>
                <p className="text-gray-400 text-sm">Hesap ve uygulama ayarları</p>
            </header>

            <div className="space-y-6">
                {/* Account Section */}
                <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Hesap
                    </h2>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xl font-bold text-white">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-white font-medium">{user?.email?.split('@')[0]}</p>
                            <p className="text-xs text-gray-500">Kullanıcı</p>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleLogout}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                    >
                        Çıkış Yap
                    </Button>
                </section>

                {/* About Section */}
                <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Hakkında
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-gray-300">Versiyon</span>
                            <span className="text-gray-500 font-mono text-sm">1.0.2</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-gray-300">Geliştirici</span>
                            <span className="text-gray-500 text-sm">Ulaş Sönmez</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
