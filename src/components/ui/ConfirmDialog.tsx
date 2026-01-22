'use client';

import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Evet',
    cancelText = 'İptal',
    variant = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-gray-300">
                    {message}
                </p>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        fullWidth
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        fullWidth
                        loading={isLoading}
                        className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : undefined}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
