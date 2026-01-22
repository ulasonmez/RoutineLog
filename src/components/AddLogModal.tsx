'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    addLog,
    subscribeToItems,
} from '@/lib/firestore';
import { formatDate, formatTime } from '@/lib/utils';
import { Item } from '@/types';
import { Button } from '@/components/ui/Button';
import { ItemChipList } from '@/components/ItemChip';
import { Modal } from '@/components/ui/Modal';
import { TimePicker } from '@/components/ui/TimePicker';
import Link from 'next/link';

interface AddLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
}

export function AddLogModal({ isOpen, onClose, date }: AddLogModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [time, setTime] = useState(formatTime(new Date()));
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user || !isOpen) return;

        setTime(formatTime(new Date()));

        const unsubscribe = subscribeToItems(user.uid, (fetchedItems) => {
            setItems(fetchedItems);
        });

        return () => unsubscribe();
    }, [user, isOpen]);

    const handleAddLog = async () => {
        if (!user || !selectedItemId) return;

        const selectedItem = items.find(i => i.id === selectedItemId);
        if (!selectedItem) return;

        const finalTime = time || '00:00';

        setIsSubmitting(true);
        try {
            await addLog(
                user.uid,
                formatDate(date),
                finalTime,
                selectedItemId,
                selectedItem.name
            );
            showToast('Kayıt eklendi', 'success');
            setSelectedItemId(null);
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Hata oluştu', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Geçmiş Kayıt Ekle">
            <div className="space-y-6">
                {/* Item Selection */}
                <div>
                    <label className="block text-xs text-gray-500 mb-2">NE YAPTIN?</label>
                    <ItemChipList
                        items={items}
                        selectedIds={selectedItemId ? [selectedItemId] : []}
                        onToggle={(id) => setSelectedItemId(id === selectedItemId ? null : id)}
                    />
                    {items.length === 0 && (
                        <div className="mt-2">
                            <Link href="/items" className="text-sm text-violet-400 hover:text-violet-300" onClick={onClose}>
                                + Katalogdan öğe ekle
                            </Link>
                        </div>
                    )}
                </div>

                {/* Time Selection - SAME AS TODAY PAGE */}
                <div>
                    <label className="block text-xs text-gray-500 mb-2">SAAT</label>
                    <TimePicker
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        İptal
                    </Button>
                    <Button
                        onClick={handleAddLog}
                        disabled={!selectedItemId || isSubmitting}
                        loading={isSubmitting}
                        fullWidth
                    >
                        Ekle
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
