'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    subscribeToLogsByDate,
    deleteLog,
} from '@/lib/firestore';
import {
    formatDateTurkish,
    parseDate
} from '@/lib/utils';
import { Log } from '@/types';
import { LogList } from '@/components/LogEntry';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';

export default function DayDetailPage({ params }: { params: Promise<{ date: string }> }) {
    const { date } = use(params);
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToLogsByDate(user.uid, date, (fetchedLogs) => {
            setLogs(fetchedLogs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, date]);

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

    const displayDate = formatDateTurkish(parseDate(date));

    if (loading) {
        return <div className="p-4 text-center text-gray-400">Yükleniyor...</div>;
    }

    return (
        <div className="p-4 max-w-lg mx-auto pb-24">
            {/* Header */}
            <header className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white">{displayDate}</h1>
                    <p className="text-gray-400 text-sm">Günlük Detay</p>
                </div>
            </header>

            {/* Logs List */}
            <section>
                {logs.length === 0 ? (
                    <EmptyState
                        title="Kayıt bulunamadı"
                        description="Bu tarihte herhangi bir işlem kaydetmemişsiniz."
                        action={
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/today')}
                                className="mt-4"
                            >
                                Bugüne Git
                            </Button>
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
