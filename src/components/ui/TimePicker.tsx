'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
    ({ label, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    type="time"
                    className={`
            w-full px-4 py-3 min-h-[48px]
            bg-white/5 backdrop-blur-sm
            border border-white/10 rounded-xl
            text-white
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
            transition-all duration-200
            [&::-webkit-calendar-picker-indicator]:filter 
            [&::-webkit-calendar-picker-indicator]:invert
            ${className}
          `}
                    {...props}
                />
            </div>
        );
    }
);

TimePicker.displayName = 'TimePicker';
