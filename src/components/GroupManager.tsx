'use client';

import { useState } from 'react';
import { Group } from '@/types';
import { addGroup, updateGroup, deleteGroup } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface GroupManagerProps {
    userId: string;
    groups: Group[];
    isOpen: boolean;
    onClose: () => void;
}

const COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#d946ef', // fuchsia-500
    '#f43f5e', // rose-500
    '#64748b', // slate-500
];

export function GroupManager({ userId, groups, isOpen, onClose }: GroupManagerProps) {
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[6]); // Default violet
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        setIsSubmitting(true);
        try {
            await addGroup(userId, newGroupName, selectedColor);
            setNewGroupName('');
            setSelectedColor(COLORS[6]);
        } catch (error) {
            console.error('Error adding group:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroup || !editingGroup.name.trim()) return;

        setIsSubmitting(true);
        try {
            await updateGroup(userId, editingGroup.id, {
                name: editingGroup.name,
                color: editingGroup.color,
            });
            setEditingGroup(null);
        } catch (error) {
            console.error('Error updating group:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Bu grubu silmek istediğinize emin misiniz? Gruba ait öğeler silinmeyecek ancak grupsuz kalacaklar.')) return;

        try {
            await deleteGroup(userId, groupId);
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Grupları Yönet">
            <div className="space-y-6">
                {/* Add New Group */}
                <form onSubmit={handleAddGroup} className="space-y-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Yeni grup adı"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={!newGroupName.trim() || isSubmitting}>
                            Ekle
                        </Button>
                    </div>
                    {/* Color Picker */}
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedColor(color)}
                                className={`w-6 h-6 rounded-full transition-transform ${selectedColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </form>

                {/* Groups List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {groups.map((group) => (
                        <div
                            key={group.id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                            {editingGroup?.id === group.id ? (
                                <form onSubmit={handleUpdateGroup} className="flex-1 flex gap-2 items-center">
                                    <Input
                                        value={editingGroup.name}
                                        onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                        className="flex-1 h-8 text-sm"
                                        autoFocus
                                    />
                                    <div className="flex gap-1">
                                        {COLORS.slice(0, 5).map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setEditingGroup({ ...editingGroup, color })}
                                                className={`w-4 h-4 rounded-full ${editingGroup.color === color ? 'ring-1 ring-white' : ''
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        type="submit"
                                        className="text-green-400 hover:text-green-300 p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingGroup(null)}
                                        className="text-gray-400 hover:text-gray-300 p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: group.color }}
                                        />
                                        <span className="text-sm font-medium text-white">{group.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setEditingGroup(group)}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGroup(group.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
