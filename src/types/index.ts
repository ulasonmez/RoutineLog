import { Timestamp } from 'firebase/firestore';

export interface Item {
  id: string;
  name: string;
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
