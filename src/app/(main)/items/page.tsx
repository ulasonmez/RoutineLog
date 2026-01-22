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

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToItems(user.uid, (fetchedItems) => {
            setItems(fetchedItems);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newItemName.trim()) return;

        setIsSubmitting(true);
        try {
            await addItem(user.uid, newItemName);
            setNewItemName('');
            showToast('Öğe eklendi', 'success');
        } catch (error) {
            console.error(error);
            showToast('Öğe eklenirken hata oluştu', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !editingItem || !editName.trim()) return;

        try {
            await updateItem(user.uid, editingItem.id, editName);
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
        return <div className="p-4 text-center text-gray-400">Yükleniyor...</div>;
    }

    return (
        <div className="p-4 max-w-lg mx-auto pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Katalog</h1>
                <p className="text-gray-400 text-sm">Rutin öğelerinizi yönetin</p>
            </header>

            {/* Add New Item Form */}
            <form onSubmit={handleAddItem} className="mb-8 flex gap-2">
                <Input
                    placeholder="Yeni öğe adı (örn: Biotin)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" disabled={!newItemName.trim() || isSubmitting}>
                    Ekle
                </Button>
            </form>

            {/* Items List */}
            <div className="space-y-3">
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
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group"
                        >
                            <span className="font-medium text-white">{item.name}</span>
                            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditingItem(item);
                                        setEditName(item.name);
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
                    ))
                )}
            </div>

            {/* Edit Modal */}
            <Modal
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
        </div>
    );
}
