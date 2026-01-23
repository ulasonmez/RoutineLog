'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    subscribeToLogsByDateRange,
    getLogCountsByDate,
    subscribeToLogsByDate,
    deleteLog,
    subscribeToItems,
} from '@/lib/firestore';
import {
    formatDate,
    getMonthDateRange,
    formatDateTurkish
} from '@/lib/utils';
import { Log, Item } from '@/types';
import { Calendar } from '@/components/Calendar';
import { LogList } from '@/components/LogEntry';
import { Button } from '@/components/ui/Button';
import { AddLogModal } from '@/components/AddLogModal';

export default function CalendarPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    // State
    const [logs, setLogs] = useState<Log[]>([]); // All logs for dots
    const [items, setItems] = useState<Item[]>([]); // Items for color lookup
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDateLogs, setSelectedDateLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch items for color lookup
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToItems(user.uid, (fetchedItems) => {
            setItems(fetchedItems);
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch all logs for dots (broad range)
    useEffect(() => {
        if (!user) return;

        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);

        const unsubscribe = subscribeToLogsByDateRange(
            user.uid,
            formatDate(start),
            formatDate(end),
            (fetchedLogs) => {
                setLogs(fetchedLogs);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Fetch logs for selected date
    useEffect(() => {
        if (!user) return;

        const dateStr = formatDate(selectedDate);
        const unsubscribe = subscribeToLogsByDate(
            user.uid,
            dateStr,
            (fetchedLogs) => {
                setSelectedDateLogs(fetchedLogs);
            }
        );

        return () => unsubscribe();
    }, [user, selectedDate]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
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

    const logCounts = getLogCountsByDate(logs);

    // Calculate colors for dots (unique colors per date)
    const logColors: Record<string, string[]> = {};
    logs.forEach(log => {
        if (!logColors[log.date]) {
            logColors[log.date] = [];
        }

        // Try to get color from log first, then fallback to item lookup
        let color = log.groupColor;

        if (!color) {
            // Find the item to get its color
            const item = items.find(i => i.id === log.itemId);
            color = item?.groupColorSnapshot || '#8b5cf6';
        }

        // Only add color if not already present (deduplicate by group)
        if (!logColors[log.date].includes(color)) {
            logColors[log.date].push(color);
        }
    });

    const displayDate = formatDateTurkish(selectedDate);

    if (loading) {
        return (
            <div className="p-4 max-w-lg mx-auto pb-24 animate-pulse">
                <header className="mb-6">
                    <div className="h-8 w-32 bg-white/10 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-white/5 rounded"></div>
                </header>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-8 h-[350px]"></div>
                <div className="h-4 w-32 bg-white/10 rounded mb-2"></div>
                <div className="h-3 w-48 bg-white/5 rounded"></div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Takvim</h1>
                <p className="text-gray-400 text-sm">Geçmiş kayıtlarınızı inceleyin</p>
            </header>

            {/* Calendar */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-xl shadow-black/20 mb-8">
                <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    logCounts={logCounts}
                    logColors={logColors}
                />
            </div>

            {/* Selected Day Details */}
            <section className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">
                        {displayDate}
                    </h2>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        + Kayıt Ekle
                    </Button>
                </div>

                {selectedDateLogs.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                        <p className="text-gray-500 text-sm">Bu tarihte kayıt bulunmuyor.</p>
                    </div>
                ) : (
                    <LogList
                        logs={selectedDateLogs}
                        onDelete={handleDeleteLog}
                    />
                )}
            </section>

            <AddLogModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                date={selectedDate}
            />
        </div>
    );
}
