'use client';

import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && (
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-gray-400 max-w-xs mb-6">{description}</p>
            )}
            {action}
        </div>
    );
}
