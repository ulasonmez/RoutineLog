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

        // Subscribe to items
        const unsubscribeItems = subscribeToItems(user.uid, (fetchedItems) => {
            setItems(fetchedItems);
        });

        // Subscribe to today's logs
        const unsubscribeLogs = subscribeToLogsByDate(user.uid, dateStr, (fetchedLogs) => {
            console.timeEnd('TodayPage:LoadData');
            setLogs(fetchedLogs);
            setLoading(false);
        });

        return () => {
            unsubscribeItems();
            unsubscribeLogs();
        };
    }, [user, dateStr]);

    const handleAddLog = async () => {
        if (!user || !selectedItemId) return;

        const selectedItem = items.find(i => i.id === selectedItemId);
        if (!selectedItem) return;

        setIsSubmitting(true);
        try {
            await addLog(
                user.uid,
                dateStr,
                time,
                selectedItemId,
                selectedItem.name
            );
            showToast('Kayıt eklendi', 'success');
            setSelectedItemId(null);
        } catch (error) {
            console.error(error);
            showToast('Hata oluştu', 'error');
        } finally {
            setIsSubmitting(false);
        }
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
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Bugün</h1>
                <p className="text-violet-400 font-medium">{displayDate}</p>
            </header>

            {/* Quick Add Section */}
            <section className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-8 shadow-xl shadow-black/20">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Hızlı Ekle
                </h2>

                <div className="space-y-4">
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
                                <Link href="/items" className="text-sm text-violet-400 hover:text-violet-300">
                                    + Katalogdan öğe ekle
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Time & Action */}
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <TimePicker
                                label="SAAT"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleAddLog}
                            disabled={!selectedItemId || isSubmitting}
                            loading={isSubmitting}
                            className="h-[48px] px-8"
                        >
                            Ekle
                        </Button>
                    </div>
                </div>
            </section>

            {/* Today's Logs */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    Günlük Akış
                    <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-gray-400">
                        {logs.length}
                    </span>
                </h2>

                {logs.length === 0 ? (
                    <EmptyState
                        title="Bugün henüz kayıt yok"
                        description="Yukarıdaki alandan yaptıklarını ekleyerek gününü takip et."
                        icon={
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
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
