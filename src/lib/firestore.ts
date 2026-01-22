import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Item, Log, Preset } from '@/types';

// ==================== ITEMS ====================

/**
 * Get reference to user's items collection
 */
function getItemsRef(userId: string) {
    return collection(db, 'users', userId, 'items');
}

/**
 * Add a new item to user's catalog
 */
export async function addItem(userId: string, name: string): Promise<string> {
    const docRef = await addDoc(getItemsRef(userId), {
        name: name.trim(),
        createdAt: serverTimestamp(),
        isArchived: false,
    });
    return docRef.id;
}

/**
 * Update an item's name and cascade changes to all logs
 */
export async function updateItem(userId: string, itemId: string, name: string): Promise<void> {
    const newName = name.trim();

    // 1. Update the item itself
    const docRef = doc(db, 'users', userId, 'items', itemId);
    await updateDoc(docRef, { name: newName });

    // 2. Find all logs with this itemId
    // Note: This might be expensive if there are thousands of logs. 
    // In a production app, this should be done via a Cloud Function.
    // For this personal app, client-side batching is acceptable.
    const logsRef = collection(db, 'users', userId, 'logs');
    const q = query(logsRef, where('itemId', '==', itemId));
    const snapshot = await getDocs(q);

    // 3. Update all logs in batches
    // Firestore batch limit is 500
    const batches = [];
    let batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { itemNameSnapshot: newName });
        count++;

        if (count >= 490) { // Safety margin
            batches.push(batch.commit());
            batch = writeBatch(db);
            count = 0;
        }
    });

    if (count > 0) {
        batches.push(batch.commit());
    }

    await Promise.all(batches);
}

/**
 * Archive (soft delete) an item
 */
export async function archiveItem(userId: string, itemId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'items', itemId);
    await updateDoc(docRef, { isArchived: true });
}

/**
 * Delete an item permanently
 */
export async function deleteItem(userId: string, itemId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'items', itemId);
    await deleteDoc(docRef);
}

/**
 * Get all active (non-archived) items
 */
export async function getItems(userId: string): Promise<Item[]> {
    const q = query(
        getItemsRef(userId),
        where('isArchived', '==', false)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Item));

    // Client-side sort
    return items.sort((a, b) => {
        const t1 = a.createdAt?.seconds || 0;
        const t2 = b.createdAt?.seconds || 0;
        return t1 - t2;
    });
}

/**
 * Get items (One-time fetch)
 */
export async function getItemsOnce(userId: string): Promise<Item[]> {
    console.time('getItemsOnce');
    const q = query(
        getItemsRef(userId),
        where('isArchived', '==', false)
    );

    try {
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Item));

        // Client-side sort
        const sorted = items.sort((a, b) => {
            const t1 = a.createdAt?.seconds || 0;
            const t2 = b.createdAt?.seconds || 0;
            return t1 - t2;
        });
        console.timeEnd('getItemsOnce');
        return sorted;
    } catch (error) {
        console.error('Error fetching items:', error);
        return [];
    }
}

/**
 * Subscribe to items changes
 */
export function subscribeToItems(
    userId: string,
    callback: (items: Item[]) => void
): () => void {
    const q = query(
        getItemsRef(userId),
        where('isArchived', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Item));

        // Client-side sort
        const sortedItems = items.sort((a, b) => {
            const t1 = a.createdAt?.seconds || 0;
            const t2 = b.createdAt?.seconds || 0;
            return t1 - t2;
        });

        callback(sortedItems);
    });
}

/**
 * Add demo items for new users
 */
export async function addDemoItems(userId: string): Promise<void> {
    const demoItems = ['Biotin', 'Minoxil', 'TTO', 'Konazol', 'Dercos', 'Vichy', 'Dermaroller'];

    for (const itemName of demoItems) {
        await addItem(userId, itemName);
    }
}

// ==================== LOGS ====================

/**
 * Get reference to user's logs collection
 */
function getLogsRef(userId: string) {
    return collection(db, 'users', userId, 'logs');
}

/**
 * Add a new log entry
 */
export async function addLog(
    userId: string,
    date: string,
    time: string,
    itemId: string,
    itemNameSnapshot: string,
    note?: string
): Promise<string> {
    const docRef = await addDoc(getLogsRef(userId), {
        date,
        time,
        timestamp: serverTimestamp(),
        itemId,
        itemNameSnapshot,
        note: note || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Add multiple log entries (for presets)
 */
export async function addMultipleLogs(
    userId: string,
    date: string,
    time: string,
    items: { itemId: string; itemNameSnapshot: string }[],
    note?: string
): Promise<string[]> {
    const ids: string[] = [];

    for (const item of items) {
        const id = await addLog(userId, date, time, item.itemId, item.itemNameSnapshot, note);
        ids.push(id);
    }

    return ids;
}

/**
 * Update a log entry
 */
export async function updateLog(
    userId: string,
    logId: string,
    updates: { date?: string; time?: string; note?: string }
): Promise<void> {
    const docRef = doc(db, 'users', userId, 'logs', logId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete a log entry
 */
export async function deleteLog(userId: string, logId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'logs', logId);
    await deleteDoc(docRef);
}

/**
 * Get logs for a specific date
 */
export async function getLogsByDate(userId: string, date: string): Promise<Log[]> {
    const q = query(
        getLogsRef(userId),
        where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Log));

    // Client-side sort
    return logs.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Get logs for a specific date (One-time fetch)
 */
export async function getLogsByDateOnce(userId: string, date: string): Promise<Log[]> {
    console.time(`getLogsByDateOnce:${date}`);
    const q = query(
        getLogsRef(userId),
        where('date', '==', date)
    );

    try {
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Log));

        // Client-side sort
        const sorted = logs.sort((a, b) => a.time.localeCompare(b.time));
        console.timeEnd(`getLogsByDateOnce:${date}`);
        return sorted;
    } catch (error) {
        console.error('Error fetching logs:', error);
        return [];
    }
}

/**
 * Subscribe to logs for a specific date
 */
export function subscribeToLogsByDate(
    userId: string,
    date: string,
    callback: (logs: Log[]) => void
): () => void {
    const q = query(
        getLogsRef(userId),
        where('date', '==', date)
    );

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Log));

        // Client-side sort
        const sortedLogs = logs.sort((a, b) => a.time.localeCompare(b.time));

        callback(sortedLogs);
    });
}

/**
 * Get logs for a date range (for calendar view)
 */
export async function getLogsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
): Promise<Log[]> {
    const q = query(
        getLogsRef(userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Log));
}

/**
 * Subscribe to logs for a date range
 */
export function subscribeToLogsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    callback: (logs: Log[]) => void
): () => void {
    const q = query(
        getLogsRef(userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Log));
        callback(logs);
    });
}

/**
 * Get log counts by date (for calendar badges)
 */
export function getLogCountsByDate(logs: Log[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const log of logs) {
        counts[log.date] = (counts[log.date] || 0) + 1;
    }

    return counts;
}

// ==================== PRESETS ====================

/**
 * Get reference to user's presets collection
 */
function getPresetsRef(userId: string) {
    return collection(db, 'users', userId, 'presets');
}

/**
 * Add a new preset
 */
export async function addPreset(
    userId: string,
    name: string,
    itemIds: string[]
): Promise<string> {
    const docRef = await addDoc(getPresetsRef(userId), {
        name: name.trim(),
        itemIds,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Update a preset
 */
export async function updatePreset(
    userId: string,
    presetId: string,
    updates: { name?: string; itemIds?: string[] }
): Promise<void> {
    const docRef = doc(db, 'users', userId, 'presets', presetId);
    await updateDoc(docRef, updates);
}

/**
 * Delete a preset
 */
export async function deletePreset(userId: string, presetId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'presets', presetId);
    await deleteDoc(docRef);
}

/**
 * Get all presets
 */
export async function getPresets(userId: string): Promise<Preset[]> {
    const q = query(getPresetsRef(userId), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Preset));
}

/**
 * Subscribe to presets changes
 */
export function subscribeToPresets(
    userId: string,
    callback: (presets: Preset[]) => void
): () => void {
    const q = query(getPresetsRef(userId), orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const presets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Preset));
        callback(presets);
    });
}

// ==================== STATISTICS ====================

/**
 * Get usage statistics for last N days
 */
export async function getUsageStats(
    userId: string,
    days: number
): Promise<Record<string, number>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const formatDate = (d: Date) => {
        return d.toISOString().split('T')[0];
    };

    const logs = await getLogsByDateRange(userId, formatDate(startDate), formatDate(endDate));

    const stats: Record<string, number> = {};

    for (const log of logs) {
        stats[log.itemNameSnapshot] = (stats[log.itemNameSnapshot] || 0) + 1;
    }

    return stats;
}
