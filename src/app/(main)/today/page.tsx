'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    addLog,
    deleteLog,
    subscribeToItems,
    subscribeToLogsByDate,
    getItemsOnce,
    getLogsByDateOnce,
} from '@/lib/firestore';
import {
    formatDate,
    formatTime,
    formatDateTurkish
} from '@/lib/utils';
import { Item, Log } from '@/types';
import { Button } from '@/components/ui/Button';
import { TimePicker } from '@/components/ui/TimePicker';
import { ItemChipList } from '@/components/ItemChip';
import { LogList } from '@/components/LogEntry';
import { EmptyState } from '@/components/EmptyState';

export default function TodayPage() {
    const { user } = useAuth();
    const { showToast } = useToast();

    // State
    const [items, setItems] = useState<Item[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [time, setTime] = useState(formatTime(new Date()));
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Current date
    const today = new Date();
    const dateStr = formatDate(today);
    const displayDate = formatDateTurkish(today);

    useEffect(() => {
        if (!user) return;

        console.time('TodayPage:LoadData');

        // Initial fetch with getDocs (bypasses realtime connection issues)
        const fetchData = async () => {
            try {
                const [initialItems, initialLogs] = await Promise.all([
                    getItemsOnce(user.uid),
                    getLogsByDateOnce(user.uid, dateStr)
                ]);

                setItems(initialItems);
                setLogs(initialLogs);
                setLoading(false);
                console.timeEnd('TodayPage:LoadData');
            } catch (error) {
                console.error('Initial fetch failed:', error);
                // Fallback to loading false so user isn't stuck
                setLoading(false);
            }
        };

        fetchData();

        // Then subscribe for updates
        const unsubscribeItems = subscribeToItems(user.uid, (fetchedItems) => {
            setItems(fetchedItems);
        });

        const unsubscribeLogs = subscribeToLogsByDate(user.uid, dateStr, (fetchedLogs) => {
            setLogs(fetchedLogs);
        });

        return () => {
            unsubscribeItems();
            unsubscribeLogs();
        };
    }, [user, dateStr]);

    const handleAddLog = () => {
        if (!user || !selectedItemId) return;

        const selectedItem = items.find(i => i.id === selectedItemId);
        if (!selectedItem) return;

        const itemToAdd = selectedItemId;
        const itemName = selectedItem.name;
        const timeToAdd = time;

        // Optimistic UI updates
        setSelectedItemId(null);

        addLog(
            user.uid,
            dateStr,
            timeToAdd,
            itemToAdd,
            itemName
        )
            .then(() => {
                showToast('Kayıt eklendi', 'success');
            })
            .catch((error) => {
                console.error(error);
                setSelectedItemId(itemToAdd); // Restore selection
                showToast('Hata oluştu', 'error');
            });
    };

    const handleDeleteLog = async (log: Log) => {
        if (!user || !confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

        try {
            await deleteLog(user.uid, log.id);
            showToast('Kayıt silindi', 'info');
        } catch (error) {
            console.error(error);
            showToast('Silme hatası', 'error');
        }
    };

    // Skeleton Loading State
    if (loading) {
        return (
            <div className="p-4 max-w-lg mx-auto pb-24 animate-pulse">
                <header className="mb-6">
                    <div className="h-8 w-32 bg-white/10 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-white/5 rounded"></div>
                </header>
                <section className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-8 h-[200px]"></section>
                <section>
                    <div className="h-6 w-24 bg-white/10 rounded mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-white/5 rounded-xl"></div>
                        <div className="h-16 bg-white/5 rounded-xl"></div>
                        <div className="h-16 bg-white/5 rounded-xl"></div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Bugün</h1>
                <p className="text-gray-400 text-sm">{displayDate}</p>
            </header>

            {/* Quick Add Section */}
            <section className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-xl shadow-black/20 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Hızlı Ekle
                    </h2>
                    <TimePicker
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>

                <ItemChipList
                    items={items}
                    selectedIds={selectedItemId ? [selectedItemId] : []}
                    onToggle={(id) => setSelectedItemId(id === selectedItemId ? null : id)}
                />

                {items.length === 0 && (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">Henüz hiç öğe eklemediniz.</p>
                        <Link href="/items">
                            <Button variant="secondary" size="sm">
                                + Katalogdan Ekle
                            </Button>
                        </Link>
                    </div>
                )}

                <div className="mt-4">
                    <Button
                        onClick={handleAddLog}
                        disabled={!selectedItemId || isSubmitting}
                        fullWidth
                        loading={isSubmitting}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                    >
                        Kaydet
                    </Button>
                </div>
            </section>

            {/* Today's Logs */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4">
                    Günlük Akış
                </h2>

                {logs.length === 0 ? (
                    <EmptyState
                        title="Bugün henüz boş"
                        description="Güne başlamak için yukarıdan bir aktivite seçin."
                    />
                ) : (
                    <LogList
                        logs={logs}
                        onDelete={handleDeleteLog}
                    />
                )}
            </section>
        </div>
    );
}
