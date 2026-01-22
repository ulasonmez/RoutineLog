'use client';

import { Log } from '@/types';

interface LogEntryProps {
    log: Log;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function LogEntry({ log, onEdit, onDelete }: LogEntryProps) {
    return (
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 group">
            {/* Time */}
            <div className="text-violet-400 font-mono text-sm font-medium min-w-[50px]">
                {log.time}
            </div>

            {/* Item name */}
            <div className="flex-1">
                <span className="text-white font-medium">{log.itemNameSnapshot}</span>
                {log.note && (
                    <p className="text-gray-400 text-sm mt-0.5 line-clamp-1">{log.note}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

interface LogListProps {
    logs: Log[];
    onEdit?: (log: Log) => void;
    onDelete?: (log: Log) => void;
}

export function LogList({ logs, onEdit, onDelete }: LogListProps) {
    if (logs.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            {logs.map((log) => (
                <LogEntry
                    key={log.id}
                    log={log}
                    onEdit={onEdit ? () => onEdit(log) : undefined}
                    onDelete={onDelete ? () => onDelete(log) : undefined}
                />
            ))}
        </div>
    );
}
