'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import {
    searchUserByUsername,
    sendFriendRequest,
    subscribeToIncomingRequests,
    respondToFriendRequest,
    subscribeToFriends,
    removeFriend,
    updateFriendPermissions
} from '@/lib/firestore';
import { UserProfile, FriendRequest, Friendship } from '@/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { FriendPermissionsModal } from '@/components/FriendPermissionsModal';

export default function FriendsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'list' | 'requests' | 'add'>('list');

    // Data states
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);

    // Permission Modal State
    const [selectedFriend, setSelectedFriend] = useState<Friendship | null>(null);
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Load data
    useEffect(() => {
        if (!user) return;

        // Subscribe to friends
        const unsubFriends = subscribeToFriends(user.uid, (data) => {
            setFriends(data);
        });

        // Subscribe to requests
        const unsubRequests = subscribeToIncomingRequests(user.uid, (data) => {
            setRequests(data);
        });

        return () => {
            unsubFriends();
            unsubRequests();
        };
    }, [user]);

    // Handlers
    const openPermissionsModal = (friend: Friendship) => {
        setSelectedFriend(friend);
        setIsPermissionsModalOpen(true);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError('');
        setSearchResult(null);

        try {
            const result = await searchUserByUsername(searchQuery.trim());
            if (result) {
                if (result.uid === user?.uid) {
                    setSearchError('Kendinizi ekleyemezsiniz.');
                } else {
                    setSearchResult(result);
                }
            } else {
                setSearchError('Kullanıcı bulunamadı.');
            }
        } catch (error) {
            console.error(error);
            setSearchError('Arama sırasında bir hata oluştu.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async () => {
        if (!user || !searchResult) return;

        try {
            // Get current user's username (from email for now)
            const myUsername = user.email?.split('@')[0] || 'user';

            await sendFriendRequest(
                user.uid,
                myUsername,
                searchResult.uid,
                searchResult.username
            );
            showToast('Arkadaşlık isteği gönderildi', 'success');
            setSearchResult(null);
            setSearchQuery('');
        } catch (error: any) {
            console.error(error);
            if (error.message === 'Request already pending') {
                showToast('İstek zaten gönderilmiş', 'warning');
            } else if (error.message === 'Already friends') {
                showToast('Zaten arkadaşsınız', 'info');
            } else {
                showToast('İstek gönderilemedi', 'error');
            }
        }
    };

    const handleResponse = async (requestId: string, response: 'accepted' | 'rejected') => {
        try {
            await respondToFriendRequest(requestId, response);
            showToast(response === 'accepted' ? 'İstek kabul edildi' : 'İstek reddedildi', 'success');
        } catch (error) {
            console.error(error);
            showToast('İşlem başarısız', 'error');
        }
    };

    const handleRemoveFriend = async (friendId: string, friendName: string) => {
        if (!user || !confirm(`${friendName} adlı kişiyi arkadaşlıktan çıkarmak istediğinize emin misiniz?`)) return;

        try {
            await removeFriend(user.uid, friendId);
            showToast('Arkadaş silindi', 'info');
        } catch (error) {
            console.error(error);
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto pb-24">
            <header className="mb-6 flex items-center gap-3">
                <Link href="/settings" className="p-2 -ml-2 text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Arkadaşlar</h1>
                    <p className="text-gray-400 text-sm">Accountability Buddy</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Liste
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors relative ${activeTab === 'requests' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    İstekler
                    {requests.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'add' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Ekle
                </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'list' && (
                    <div className="space-y-3">
                        {friends.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                <p className="text-gray-500 mb-2">Henüz hiç arkadaşın yok.</p>
                                <Button variant="secondary" size="sm" onClick={() => setActiveTab('add')}>
                                    + Arkadaş Ekle
                                </Button>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <div key={friend.uid} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                            {friend.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{friend.username}</h3>
                                            <p className="text-xs text-gray-500">Accountability Buddy</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/friends/${friend.uid}`}>
                                            <Button size="sm" variant="secondary">
                                                Profil
                                            </Button>
                                        </Link>
                                        <button
                                            onClick={() => handleRemoveFriend(friend.uid, friend.username)}
                                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="space-y-3">
                        {requests.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                <p className="text-gray-500">Bekleyen arkadaşlık isteği yok.</p>
                            </div>
                        ) : (
                            requests.map(request => (
                                <div key={request.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                                                {request.fromUsername[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium">{request.fromUsername}</h3>
                                                <p className="text-xs text-gray-500">Arkadaşlık İsteği</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            fullWidth
                                            onClick={() => handleResponse(request.id, 'accepted')}
                                            className="bg-violet-600 hover:bg-violet-700"
                                        >
                                            Kabul Et
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="secondary"
                                            onClick={() => handleResponse(request.id, 'rejected')}
                                        >
                                            Reddet
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="space-y-6">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Kullanıcı adı ara..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <svg className="w-5 h-5 text-gray-500 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <Button
                                type="submit"
                                className="absolute right-2 top-2"
                                size="sm"
                                loading={isSearching}
                            >
                                Ara
                            </Button>
                        </form>

                        {searchError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                {searchError}
                            </div>
                        )}

                        {searchResult && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between animate-fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                        {searchResult.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium text-lg">{searchResult.username}</h3>
                                        <p className="text-xs text-gray-500">Kullanıcı</p>
                                    </div>
                                </div>
                                <Button onClick={handleSendRequest}>
                                    İstek Gönder
                                </Button>
                            </div>
                        )}

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <h4 className="text-blue-400 font-medium mb-2 text-sm">Nasıl Çalışır?</h4>
                            <ul className="text-xs text-blue-300/80 space-y-2 list-disc list-inside">
                                <li>Arkadaşlarınızı ekleyerek birbirinizin alışkanlıklarını takip edebilirsiniz.</li>
                                <li>Rekabet veya puanlama yoktur, sadece motivasyon amaçlıdır.</li>
                                <li>Gizlilik ayarlarından ne kadar detay paylaşacağınızı seçebilirsiniz.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
