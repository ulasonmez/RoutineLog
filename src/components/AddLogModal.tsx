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
import { TimePicker } from '@/components/ui/TimePicker';
import { ItemChipList } from '@/components/ItemChip';
import { Modal } from '@/components/ui/Modal';
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

    // Time state
    const [hour, setHour] = useState(formatTime(new Date()).split(':')[0]);
    const [minute, setMinute] = useState(formatTime(new Date()).split(':')[1]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user || !isOpen) return;

        const unsubscribe = subscribeToItems(user.uid, (fetchedItems) => {
            setItems(fetchedItems);
        });

        return () => unsubscribe();
    }, [user, isOpen]);

    const handleAddLog = async () => {
        if (!user || !selectedItemId) return;

        const selectedItem = items.find(i => i.id === selectedItemId);
        if (!selectedItem) return;

        // Time Validation Logic
        let finalTime = '';

        if (!hour && !minute) {
            // Both empty -> Allow (default to 00:00)
            finalTime = '00:00';
        } else if (hour && !minute) {
            // Hour filled, Minute empty -> Default minute to 00
            finalTime = `${hour}:00`;
        } else if (!hour && minute) {
            // Hour empty, Minute filled -> Error
            showToast('Lütfen saat seçiniz', 'error');
            return;
        } else {
            // Both filled
            finalTime = `${hour}:${minute}`;
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

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

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

                {/* Time Selection */}
                <div>
                    <label className="block text-xs text-gray-500 mb-2">SAAT</label>
                    <div className="flex gap-2">
                        <select
                            value={hour}
                            onChange={(e) => setHour(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="">--</option>
                            {hours.map(h => (
                                <option key={h} value={h} className="bg-slate-900">{h}</option>
                            ))}
                        </select>
                        <span className="text-white self-center">:</span>
                        <select
                            value={minute}
                            onChange={(e) => setMinute(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="">--</option>
                            {minutes.map(m => (
                                <option key={m} value={m} className="bg-slate-900">{m}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Saat seçip dakikayı boş bırakırsanız 00 olarak kabul edilir.
                    </p>
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
