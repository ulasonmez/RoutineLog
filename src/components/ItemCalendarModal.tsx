'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatDate, getDaysInMonth, turkishMonthNames, isSameDay } from '@/lib/utils';
import { getLogCountsByItemId, getTotalItemUsageCount } from '@/lib/firestore';
import { Item } from '@/types';

interface ItemCalendarModalProps {
    item: Item | null;
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export function ItemCalendarModal({ item, isOpen, onClose, userId }: ItemCalendarModalProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [logCounts, setLogCounts] = useState<Record<string, number>>({});
    const [totalUsageCount, setTotalUsageCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    const days = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Fetch log counts when month/year changes
    useEffect(() => {
        if (!item || !isOpen) return;

        const fetchLogCounts = async () => {
            setLoading(true);
            try {
                // Get first and last day of current month
                const startDate = formatDate(new Date(currentYear, currentMonth, 1));
                const lastDay = new Date(currentYear, currentMonth + 1, 0);
                const endDate = formatDate(lastDay);

                const counts = await getLogCountsByItemId(userId, item.id, startDate, endDate);
                setLogCounts(counts);
            } catch (error) {
                console.error('Error fetching log counts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogCounts();
    }, [item, isOpen, userId, currentMonth, currentYear]);

    // Fetch total usage count when modal opens
    useEffect(() => {
        if (!item || !isOpen) return;

        const fetchTotalCount = async () => {
            try {
                const count = await getTotalItemUsageCount(userId, item.id);
                setTotalUsageCount(count);
            } catch (error) {
                console.error('Error fetching total usage count:', error);
            }
        };

        fetchTotalCount();
    }, [item, isOpen, userId]);

    // Reset to current month when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentMonth(today.getMonth());
            setCurrentYear(today.getFullYear());
        }
    }, [isOpen]);

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'];

    // Calculate total usage for current month
    const monthlyUsage = Object.values(logCounts).reduce((sum, count) => sum + count, 0);

    const groupColor = item?.groupColorSnapshot || '#8b5cf6';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={item?.name || 'Takvim'}
        >
            <div className="w-full">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                        <span className="text-2xl font-bold text-violet-400">{monthlyUsage}</span>
                        <p className="text-xs text-gray-400 mt-1">Bu Ay</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                        <span className="text-2xl font-bold text-indigo-400">{totalUsageCount}</span>
                        <p className="text-xs text-gray-400 mt-1">Toplam</p>
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <h2 className="text-lg font-semibold text-white">
                        {turkishMonthNames[currentMonth]} {currentYear}
                    </h2>

                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-gray-500 py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
                    {/* Empty cells for days before the first day of month */}
                    {Array.from({ length: adjustedFirstDay }).map((_, index) => (
                        <div key={`empty-${index}`} className="aspect-square" />
                    ))}

                    {/* Actual days */}
                    {days.map((date) => {
                        const dateString = formatDate(date);
                        const count = logCounts[dateString] || 0;
                        const isToday = isSameDay(date, today);
                        const isFuture = date > today;

                        return (
                            <div
                                key={dateString}
                                className={`
                                    aspect-square flex flex-col items-center justify-center rounded-xl
                                    transition-all duration-200 relative
                                    ${isToday
                                        ? 'bg-white/10 text-white'
                                        : isFuture
                                            ? 'text-gray-600'
                                            : 'text-gray-300'
                                    }
                                `}
                            >
                                <span className="text-sm font-medium">{date.getDate()}</span>

                                {/* Usage indicator dots */}
                                {count > 0 && (
                                    <div className="absolute bottom-1 flex gap-0.5 flex-wrap justify-center max-w-[90%]">
                                        {count <= 4 ? (
                                            // Show dots for 1-4 uses
                                            Array.from({ length: count }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: groupColor }}
                                                />
                                            ))
                                        ) : (
                                            // Show count for more than 4
                                            <span className="text-[10px] font-bold" style={{ color: groupColor }}>
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: groupColor }} />
                        <span>= 1 kullanım</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
