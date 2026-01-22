'use client';

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';

interface MaskedTimeInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function MaskedTimeInput({ value, onChange, className = '' }: MaskedTimeInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Internal state to manage the display value (e.g. "1_:__")
    // If external value is "14:30", display is "14:30"
    // If external value is empty, display is "" (showing placeholder)
    // But user wants to see "1_:__" when typing.

    // Helper to format value to mask
    const formatToMask = (val: string) => {
        // val is like "1", "14", "143"
        const clean = val.replace(/\D/g, '').slice(0, 4);
        let res = '';

        for (let i = 0; i < 5; i++) {
            if (i === 2) {
                res += ':';
                continue;
            }

            // Map index to digit index (0,1 -> 0,1; 3,4 -> 2,3)
            const digitIndex = i > 2 ? i - 1 : i;

            if (digitIndex < clean.length) {
                res += clean[digitIndex];
            } else {
                res += '_'; // Using underscore as placeholder char
            }
        }
        return res;
    };

    // Helper to extract raw digits
    const getRawValue = (val: string) => val.replace(/\D/g, '');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        // We handle logic in onKeyDown mostly, but onChange catches paste/mobile sometimes
        // But for a strict mask, controlled input is best.
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const raw = getRawValue(value);
            if (raw.length > 0) {
                const newRaw = raw.slice(0, -1);
                updateValue(newRaw);
            }
        } else if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            const raw = getRawValue(value);
            if (raw.length < 4) {
                const newRaw = raw + e.key;
                updateValue(newRaw);
            }
        }
    };

    const updateValue = (raw: string) => {
        // raw is "1430"
        // We need to pass the formatted time back to parent? 
        // Or just the raw? The parent expects "HH:MM" usually.
        // But here we are building it.

        // Let's construct the "HH:MM" format if complete, or partial.
        // Actually, the parent `AddLogModal` expects a string.
        // If I pass "14:3_", the parent might be confused if it tries to parse it.
        // But I should pass the MASKED value so the input displays it.

        // Wait, if I pass "1_:__" to parent, parent state `time` becomes "1_:__".
        // Then `value` prop becomes "1_:__".
        // And I render it.

        const masked = formatToMask(raw);
        onChange(masked);
    };

    // Initial mount: if value is empty, do we show placeholder?
    // User said "placeholder --:--".
    // If value is empty, input is empty, showing placeholder.
    // If user types '1', value becomes '1_:__'.

    // Paste handler
    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        const raw = text.replace(/\D/g, '').slice(0, 4);
        updateValue(raw);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={value}
            placeholder="--:--"
            onChange={() => { }} // Controlled by onKeyDown
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={`font-mono tracking-widest text-center ${className}`}
        />
    );
}
