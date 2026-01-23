'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Friendship } from '@/types';
import { updateFriendPermissions } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface FriendPermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    friend: Friendship;
}

export function FriendPermissionsModal({ isOpen, onClose, friend }: FriendPermissionsModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [permissions, setPermissions] = useState(friend.permissions);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setPermissions(friend.permissions);
    }, [friend]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateFriendPermissions(user.uid, friend.uid, permissions);
            showToast('İzinler güncellendi', 'success');
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Güncelleme başarısız', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermission = (key: keyof Friendship['permissions']) => {
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${friend.username} için İzinler`}>
            <div className="space-y-6">
                <p className="text-sm text-gray-400">
                    Bu arkadaşınızın sizinle ilgili neleri görebileceğini seçin.
                </p>

                <div className="space-y-4">
                    {/* View Calendar */}
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                        <div>
                            <h4 className="text-white font-medium text-sm">Takvimi Görsün</h4>
                            <p className="text-xs text-gray-500">Genel aktivite takvimini görüntüleyebilir.</p>
                        </div>
                        <button
                            onClick={() => togglePermission('viewCalendar')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${permissions.viewCalendar ? 'bg-violet-600' : 'bg-gray-600'
                                }`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${permissions.viewCalendar ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    {/* View Details */}
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                        <div>
                            <h4 className="text-white font-medium text-sm">Detayları Görsün</h4>
                            <p className="text-xs text-gray-500">Aktivite isimlerini (örn: "Spor") görebilir.</p>
                        </div>
                        <button
                            onClick={() => togglePermission('viewDetails')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${permissions.viewDetails ? 'bg-violet-600' : 'bg-gray-600'
                                }`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${permissions.viewDetails ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    {/* Hide Times */}
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                        <div>
                            <h4 className="text-white font-medium text-sm">Saatleri Gizle</h4>
                            <p className="text-xs text-gray-500">Aktivite saatlerini görmesini engeller.</p>
                        </div>
                        <button
                            onClick={() => togglePermission('hideTimes')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${permissions.hideTimes ? 'bg-violet-600' : 'bg-gray-600'
                                }`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${permissions.hideTimes ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        İptal
                    </Button>
                    <Button onClick={handleSave} loading={isSaving} fullWidth>
                        Kaydet
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
