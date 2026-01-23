'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    addItem,
    updateItem,
    archiveItem,
    subscribeToItems,
    addDemoItems
} from '@/lib/firestore';
import { Item } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/EmptyState';
import { ItemCalendarModal } from '@/components/ItemCalendarModal';
import { GroupManager } from '@/components/GroupManager';
import { Group } from '@/types';
import { subscribeToGroups, ensureDefaultGroup } from '@/lib/firestore';

export default function ItemsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemName, setNewItemName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit modal state
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [editName, setEditName] = useState('');
    const [editGroupId, setEditGroupId] = useState('');

    // Calendar modal state
    const [calendarItem, setCalendarItem] = useState<Item | null>(null);

    // Groups state
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);

    // Subscribe to groups
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToGroups(user.uid, (fetchedGroups) => {
            setGroups(fetchedGroups);

            // Set default selection if empty
            if (!selectedGroupId && fetchedGroups.length > 0) {
                setSelectedGroupId(fetchedGroups[0].id);
            }
        });

        // Ensure default group exists
        ensureDefaultGroup(user.uid).then((id) => {
            if (!selectedGroupId) setSelectedGroupId(id);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToItems(user.uid, (fetchedItems) => {
            setItems(fetchedItems);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newItemName.trim()) return;

        const nameToAdd = newItemName;
        setNewItemName(''); // Optimistic clear

        // Fire and forget (with error handling)
        const groupIdToUse = selectedGroupId || (groups.length > 0 ? groups[0].id : '');
        const group = groups.find(g => g.id === groupIdToUse);

        if (!groupIdToUse) {
            showToast('Lütfen bir grup seçin', 'error');
            return;
        }

        addItem(user.uid, nameToAdd, groupIdToUse, group?.name, group?.color)
            .then(() => {
                showToast('Öğe eklendi', 'success');
            })
            .catch((error) => {
                console.error(error);
                setNewItemName(nameToAdd); // Restore on error
                showToast('Öğe eklenirken hata oluştu', 'error');
            });
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !editingItem || !editName.trim()) return;

        const group = groups.find(g => g.id === editGroupId);

        try {
            await updateItem(user.uid, editingItem.id, {
                name: editName,
                groupId: editGroupId,
                groupNameSnapshot: group?.name,
                groupColorSnapshot: group?.color
            });
            setEditingItem(null);
            showToast('Öğe güncellendi', 'success');
        } catch (error) {
            console.error(error);
            showToast('Güncelleme hatası', 'error');
        }
    };

    const handleArchiveItem = async (itemId: string) => {
        if (!user || !confirm('Bu öğeyi arşivlemek istediğinize emin misiniz?')) return;

        try {
            await archiveItem(user.uid, itemId);
            showToast('Öğe arşivlendi', 'success');
        } catch (error) {
            console.error(error);
            showToast('Arşivleme hatası', 'error');
        }
    };

    const handleAddDemoItems = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await addDemoItems(user.uid);
            showToast('Demo öğeler eklendi', 'success');
        } catch (error) {
            console.error(error);
            showToast('Hata oluştu', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 max-w-lg mx-auto pb-24 animate-pulse">
                <header className="mb-6">
                    <div className="h-8 w-32 bg-white/10 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-white/5 rounded"></div>
                </header>
                <div className="h-10 bg-white/5 rounded-lg mb-8"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-white/5 rounded-xl"></div>
                    <div className="h-16 bg-white/5 rounded-xl"></div>
                    <div className="h-16 bg-white/5 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto pb-24">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Katalog</h1>
                    <p className="text-gray-400 text-sm">Rutin öğelerinizi yönetin</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsGroupManagerOpen(true)}>
                    Grupları Yönet
                </Button>
            </header>

            {/* Add New Item Form */}
            <form onSubmit={handleAddItem} className="mb-8 space-y-3">
                <div className="flex gap-2">
                    <Input
                        placeholder="Yeni öğe adı (örn: Spor, Yemek, Meditasyon)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={!newItemName.trim() || isSubmitting}>
                        Ekle
                    </Button>
                </div>

                {/* Group Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {groups.map(group => (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`
                                px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2
                                ${selectedGroupId === group.id
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }
                            `}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: group.color }}
                            />
                            {group.name}
                        </button>
                    ))}
                </div>
            </form>

            {/* Items List Grouped by Category */}
            <div className="space-y-6">
                {items.length === 0 ? (
                    <EmptyState
                        title="Listeniz boş"
                        description="Henüz hiç öğe eklemediniz. Kendiniz ekleyebilir veya örnek listeyi kullanabilirsiniz."
                        action={
                            <Button variant="secondary" onClick={handleAddDemoItems} loading={isSubmitting}>
                                Örnek Liste Oluştur
                            </Button>
                        }
                    />
                ) : (
                    <>
                        {/* Render groups that have items */}
                        {groups.map(group => {
                            const groupItems = items.filter(item => item.groupId === group.id);
                            if (groupItems.length === 0) return null;

                            return (
                                <div key={group.id} className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: group.color }}
                                        />
                                        <h3 className="text-sm font-medium text-gray-400">{group.name}</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {groupItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors cursor-pointer"
                                                onClick={() => setCalendarItem(item)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-1.5 h-8 rounded-full"
                                                        style={{ backgroundColor: item.groupColorSnapshot || group.color }}
                                                    />
                                                    <div>
                                                        <span className="font-medium text-white block">{item.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setEditName(item.name);
                                                                setEditGroupId(item.groupId || (groups.length > 0 ? groups[0].id : ''));
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleArchiveItem(item.id)}
                                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Items with no group or unknown group */}
                        {(() => {
                            const unknownItems = items.filter(item => !item.groupId || !groups.find(g => g.id === item.groupId));
                            if (unknownItems.length === 0) return null;

                            return (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                                        <h3 className="text-sm font-medium text-gray-400">Diğer</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {unknownItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors cursor-pointer"
                                                onClick={() => setCalendarItem(item)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-8 rounded-full bg-gray-500" />
                                                    <div>
                                                        <span className="font-medium text-white block">{item.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setEditName(item.name);
                                                                setEditGroupId(item.groupId || (groups.length > 0 ? groups[0].id : ''));
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleArchiveItem(item.id)}
                                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            < Modal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title="Öğeyi Düzenle"
            >
                <form onSubmit={handleUpdateItem} className="space-y-4">
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Öğe adı"
                        autoFocus
                    />

                    {/* Group Selector in Edit Modal */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 ml-1">Grup</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    type="button"
                                    onClick={() => setEditGroupId(group.id)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2
                                        ${editGroupId === group.id
                                            ? 'bg-white text-black'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }
                                    `}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: group.color }}
                                    />
                                    {group.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setEditingItem(null)}
                            fullWidth
                        >
                            İptal
                        </Button>
                        <Button type="submit" fullWidth disabled={!editName.trim()}>
                            Kaydet
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Item Calendar Modal */}
            <ItemCalendarModal
                item={calendarItem}
                isOpen={!!calendarItem}
                onClose={() => setCalendarItem(null)}
                userId={user?.uid || ''}
            />

            {/* Group Manager Modal */}
            <GroupManager
                userId={user?.uid || ''}
                groups={groups}
                isOpen={isGroupManagerOpen}
                onClose={() => setIsGroupManagerOpen(false)}
            />
        </div>
    );
}
