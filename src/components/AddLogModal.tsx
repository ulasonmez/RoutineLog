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
import { MaskedTimeInput } from '@/components/ui/MaskedTimeInput';
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
    const [time, setTime] = useState(''); // Start empty to show placeholder
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user || !isOpen) return;

        // Reset time when opening
        setTime('');
        setError(null);

        const unsubscribe = subscribeToItems(user.uid, (fetchedItems) => {
            setItems(fetchedItems);
        });

        return () => unsubscribe();
    }, [user, isOpen]);

    const handleAddLog = async () => {
        if (!user || !selectedItemId) return;

        const selectedItem = items.find(i => i.id === selectedItemId);
        if (!selectedItem) return;

        // Validation Logic
        let finalTime = time;
        const raw = time.replace(/\D/g, ''); // Extract digits: "1430" or "1" or ""

        if (raw.length === 0) {
            // Empty -> 00:00
            finalTime = '00:00';
        } else if (raw.length <= 2) {
            // 1 or 2 digits -> HH:00
            let h = parseInt(raw);
            if (h > 23) {
                setError('Saat 23\'ten büyük olamaz');
                return;
            }
            finalTime = `${raw.padStart(2, '0')}:00`;
        } else {
            // 3 or 4 digits -> HH:MM
            const padded = raw.padEnd(4, '0');
            const h = parseInt(padded.slice(0, 2));
            const m = parseInt(padded.slice(2, 4));

            if (h > 23) {
                setError('Saat 23\'ten büyük olamaz');
                return;
            }
            if (m > 59) {
                setError('Dakika 59\'dan büyük olamaz');
                return;
            }
            finalTime = `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
        }

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

                {/* Time & Action */}
                <div>
                    <label className="block text-xs text-gray-500 mb-2">SAAT</label>
                    <MaskedTimeInput
                        value={time}
                        onChange={(val) => {
                            setTime(val);
                            setError(null);
                        }}
                        className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[48px] ${error ? 'border-red-500' : 'border-white/10'
                            }`}
                    />
                    {error && (
                        <p className="text-xs text-red-400 mt-2">{error}</p>
                    )}
                    {!error && (
                        <p className="text-xs text-gray-500 mt-2">
                            Örn: 1430 yazarsanız 14:30 olur. Boş bırakırsanız 00:00.
                        </p>
                    )}
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
