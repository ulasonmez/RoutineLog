/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format current time to HH:mm string
 */
export function formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Parse a date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Get Turkish day names
 */
export const turkishDayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts'];

/**
 * Get Turkish month names
 */
export const turkishMonthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/**
 * Format date for display in Turkish
 */
export function formatDateTurkish(date: Date): string {
    const day = date.getDate();
    const month = turkishMonthNames[date.getMonth()];
    const dayName = turkishDayNames[date.getDay()];
    return `${day} ${month} ${dayName}`;
}

/**
 * Get first day of month
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
    return new Date(year, month, 1);
}

/**
 * Get last day of month
 */
export function getLastDayOfMonth(year: number, month: number): Date {
    return new Date(year, month + 1, 0);
}

/**
 * Get all days in a month as array of Date objects
 */
export function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const lastDay = getLastDayOfMonth(year, month);

    for (let day = 1; day <= lastDay.getDate(); day++) {
        days.push(new Date(year, month, day));
    }

    return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Sort logs by time (ascending)
 */
export function sortLogsByTime<T extends { time: string }>(logs: T[]): T[] {
    return [...logs].sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Generate date range for a month (for Firestore queries)
 */
export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
    const firstDay = getFirstDayOfMonth(year, month);
    const lastDay = getLastDayOfMonth(year, month);

    return {
        start: formatDate(firstDay),
        end: formatDate(lastDay),
    };
}
