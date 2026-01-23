import { Timestamp } from 'firebase/firestore';

export interface Group {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Timestamp;
}

export interface Item {
  id: string;
  name: string;
  groupId: string;
  groupNameSnapshot?: string; // Optional for display
  groupColorSnapshot?: string; // Optional for display
  createdAt: Timestamp;
  isArchived: boolean;
}

export interface Log {
  id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  timestamp: Timestamp;
  itemId: string;
  itemNameSnapshot: string;
  groupId?: string; // Optional for backward compatibility
  groupColor?: string; // Optional for backward compatibility
  note?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Preset {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: Timestamp;
}

export interface User {
  uid: string;
  email: string | null;
}

export interface UserProfile {
  uid: string;
  username: string; // searchable
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromUsername: string;
  toId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export interface Friendship {
  uid: string; // Friend's UID
  username: string;
  since: Timestamp;
  permissions: {
    viewCalendar: boolean;
    viewDetails: boolean;
    hideTimes: boolean;
  };
}
