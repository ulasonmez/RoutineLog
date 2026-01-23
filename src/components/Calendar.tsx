'use client';

import { useState } from 'react';
import { formatDate, getDaysInMonth, turkishMonthNames, isSameDay } from '@/lib/utils';

interface CalendarProps {
    selectedDate?: Date;
    onDateSelect: (date: Date) => void;
    logCounts: Record<string, number>;
    logColors?: Record<string, string[]>;
}

export function Calendar({ selectedDate, onDateSelect, logCounts, logColors = {} }: CalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const days = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

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

    return (
        <div className="w-full">
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
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the first day of month */}
                {Array.from({ length: adjustedFirstDay }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Actual days */}
                {days.map((date) => {
                    const dateString = formatDate(date);
                    const count = logCounts[dateString] || 0;
                    const colors = logColors[dateString] || [];
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                    return (
                        <button
                            key={dateString}
                            onClick={() => onDateSelect(date)}
                            className={`
                aspect-square flex flex-col items-center justify-center rounded-xl
                transition-all duration-200 relative p-1
                ${isSelected
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                                    : isToday
                                        ? 'bg-white/10 text-white'
                                        : 'text-gray-300 hover:bg-white/5'
                                }
              `}
                        >
                            <span className="text-sm font-medium mb-0.5">{date.getDate()}</span>

                            {/* Entry count indicator */}
                            <div className="h-3 flex items-center justify-center w-full">
                                {count > 0 && (
                                    <div
                                        className={`
                    flex gap-0.5 flex-wrap justify-center max-w-[90%]
                    ${isSelected ? 'text-white/70' : ''}
                  `}
                                    >
                                        {colors.length > 0 ? (
                                            // Show colored dots based on groups
                                            colors.length <= 4 ? (
                                                colors.map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className={`
                          w-1 h-1 rounded-full
                          ${isSelected ? 'ring-1 ring-white' : ''}
                        `}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))
                                            ) : (
                                                <span
                                                    className={`
                          text-[9px] font-medium leading-none
                          ${isSelected ? 'text-white/70' : 'text-violet-400'}
                        `}
                                                >
                                                    {count}
                                                </span>
                                            )
                                        ) : (
                                            // Fallback to default dots if no colors
                                            count <= 3 ? (
                                                Array.from({ length: count }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`
                            w-1 h-1 rounded-full
                            ${isSelected ? 'ring-1 ring-white' : ''}
                          `}
                                                        style={{ backgroundColor: '#8b5cf6' }} // violet-500
                                                    />
                                                ))
                                            ) : (
                                                <span
                                                    className={`
                          text-[9px] font-medium leading-none
                          ${isSelected ? 'text-white/70' : 'text-violet-400'}
                        `}
                                                >
                                                    {count}
                                                </span>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
