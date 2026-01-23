'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { deleteAllUserData } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
    const { user, deleteAccount } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [step, setStep] = useState<'credentials' | 'confirm'>('credentials');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen && user?.email) {
            // Extract username from email (remove @routinelog.app)
            const extractedUsername = user.email.split('@')[0];
            setUsername(extractedUsername);
        }
    }, [isOpen, user]);

    const handleClose = () => {
        if (!isDeleting) {
            setStep('credentials');
            setUsername('');
            setPassword('');
            onClose();
        }
    };

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            showToast('Kullanıcı adı ve şifre gerekli', 'error');
            return;
        }

        // Move to confirmation step
        setStep('confirm');
    };

    const handleFinalDelete = async () => {
        if (!user) return;

        setIsDeleting(true);

        try {
            // Construct email from username
            const emailToDelete = `${username.toLowerCase()}@routinelog.app`;

            // 1. Delete all user data from Firestore
            await deleteAllUserData(user.uid);

            // 2. Delete the user account from Firebase Auth
            await deleteAccount(emailToDelete, password);

            showToast('Hesabınız başarıyla silindi', 'success');

            // 3. Redirect to login page
            router.push('/login');
        } catch (error: any) {
            console.error('Delete account error:', error);

            // Handle specific errors
            if (error.code === 'auth/wrong-password') {
                showToast('Yanlış şifre', 'error');
                setStep('credentials'); // Go back to credentials step
            } else if (error.code === 'auth/user-not-found') {
                showToast('Kullanıcı bulunamadı', 'error');
            } else if (error.code === 'auth/invalid-email') {
                showToast('Geçersiz kullanıcı adı', 'error');
                setStep('credentials');
            } else {
                showToast('Hesap silinemedi: ' + error.message, 'error');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === 'credentials' ? 'Hesabı Sil' : 'Son Onay'}
        >
            {step === 'credentials' ? (
                <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <p className="text-red-400 text-sm">
                            ⚠️ Hesabınızı silmek için kullanıcı adı ve şifrenizi doğrulayın.
                            Bu işlem geri alınamaz.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-2">KULLANICI ADI</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="kullaniciadi"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-2">ŞİFRE</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={handleClose} fullWidth type="button">
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Devam Et
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <p className="text-red-400 text-sm font-semibold mb-2">
                            ⚠️ Hesabınız siliniyor!
                        </p>
                        <p className="text-red-300 text-sm">
                            Tüm verileriniz (gruplar, öğeler, kayıtlar) kalıcı olarak silinecek.
                            Bu işlem geri alınamaz.
                        </p>
                    </div>

                    <p className="text-gray-300 text-center text-sm">
                        Hesabınızı silmek istediğinizden emin misiniz?
                    </p>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setStep('credentials')}
                            fullWidth
                            disabled={isDeleting}
                        >
                            Geri Dön
                        </Button>
                        <Button
                            onClick={handleFinalDelete}
                            fullWidth
                            loading={isDeleting}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Evet, Sil
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
