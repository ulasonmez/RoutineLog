'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    getFriendshipStatus,
    getLogsByDateRange,
    getLogCountsByDate,
    getLogsByDate,
    subscribeToItems
} from '@/lib/firestore';
import { Friendship, Log, Item } from '@/types';
import { Calendar } from '@/components/Calendar';
import { formatDate, formatDateTurkish } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function FriendProfilePage({ params }: { params: Promise<{ friendId: string }> }) {
    const { user } = useAuth();
    const router = useRouter();
    const { friendId } = use(params);

    const [friendship, setFriendship] = useState<Friendship | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDateLogs, setSelectedDateLogs] = useState<Log[]>([]);

    // 1. Check friendship status & permissions
    useEffect(() => {
        if (!user) return;

        const checkFriendship = async () => {
            try {
                // Check if I am friends with them (i.e., do they have me in their friends list?)
                // Actually, we need to check MY friends list to get their username,
                // BUT we need THEIR friends list to get permissions they gave ME.
                // The getFriendshipStatus function checks THEIR record of ME.
                const status = await getFriendshipStatus(user.uid, friendId);

                if (!status) {
                    // Not friends or removed
                    router.push('/settings/friends');
                    return;
                }

                setFriendship(status);
            } catch (error) {
                console.error(error);
                router.push('/settings/friends');
            }
        };

        checkFriendship();
    }, [user, friendId, router]);

    // 2. Fetch data if allowed
    useEffect(() => {
        if (!user || !friendship) return;

        if (!friendship.permissions.viewCalendar) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);

            try {
                // Fetch logs
                const fetchedLogs = await getLogsByDateRange(
                    friendId,
                    formatDate(start),
                    formatDate(end)
                );
                setLogs(fetchedLogs);

                // Fetch items for colors (we need this to show colored dots)
                // Note: This might fail if security rules are strict about reading other users' items
                // For now assuming it works or we fallback to default colors
                // Ideally we would fetch items only if viewDetails is true, 
                // but we need colors for the calendar dots even if details are hidden.
                // Let's try to fetch items.
                // Since we don't have a direct "getItems" for other users exposed easily,
                // we might need to rely on what's in the log (groupColor).
                // But wait, we updated logs to have groupColor! So we are good for dots.

                setLoading(false);
            } catch (error) {
                console.error('Error fetching friend data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [user, friendship, friendId]);

    // 3. Update selected date logs
    useEffect(() => {
        if (!friendship || !friendship.permissions.viewCalendar) return;

        const dateStr = formatDate(selectedDate);
        const dayLogs = logs.filter(l => l.date === dateStr);

        // Sort by time
        dayLogs.sort((a, b) => a.time.localeCompare(b.time));

        setSelectedDateLogs(dayLogs);
    }, [selectedDate, logs, friendship]);

    const logCounts = getLogCountsByDate(logs);

    // Calculate colors for dots
    const logColors: Record<string, string[]> = {};
    logs.forEach(log => {
        if (!logColors[log.date]) {
            logColors[log.date] = [];
        }

        // Use groupColor if available, otherwise default violet
        const color = log.groupColor || '#8b5cf6';

        if (!logColors[log.date].includes(color)) {
            logColors[log.date].push(color);
        }
    });

    if (loading) {
        return (
            <div className="p-4 max-w-lg mx-auto pb-24 animate-pulse">
                <div className="h-8 w-48 bg-white/10 rounded mb-6"></div>
                <div className="bg-white/5 rounded-2xl h-[350px] mb-8"></div>
            </div>
        );
    }

    if (!friendship) return null;

    return (
        <div className="p-4 max-w-lg mx-auto pb-24">
            <header className="mb-6 flex items-center gap-3">
                <Link href="/settings/friends" className="p-2 -ml-2 text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {friendship.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">{friendship.username}</h1>
                        <p className="text-gray-400 text-xs">Accountability Buddy</p>
                    </div>
                </div>
            </header>

            {friendship.permissions.viewCalendar ? (
                <>
                    {/* Calendar */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-xl shadow-black/20 mb-8">
                        <Calendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            logCounts={logCounts}
                            logColors={logColors}
                        />
                    </div>

                    {/* Selected Day Details */}
                    <section className="animate-fade-in">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            {formatDateTurkish(selectedDate)}
                        </h2>

                        {selectedDateLogs.length === 0 ? (
                            <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                <p className="text-gray-500 text-sm">Bu tarihte kayıt bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedDateLogs.map(log => (
                                    <div key={log.id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Color Indicator */}
                                            <div
                                                className="w-1.5 h-8 rounded-full"
                                                style={{ backgroundColor: log.groupColor || '#8b5cf6' }}
                                            />

                                            <div>
                                                <h3 className="text-white font-medium">
                                                    {friendship.permissions.viewDetails
                                                        ? log.itemNameSnapshot
                                                        : 'Tamamlanan Aktivite'}
                                                </h3>
                                                {!friendship.permissions.hideTimes && (
                                                    <p className="text-xs text-gray-500 font-mono">
                                                        {log.time}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            ) : (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-gray-400 font-medium">Bu profil gizli.</p>
                    <p className="text-gray-600 text-sm mt-1">Arkadaşınız takvimini paylaşmıyor.</p>
                </div>
            )}
        </div>
    );
}
