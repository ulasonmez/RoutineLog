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
    getCountFromServer,
} from 'firebase/firestore';
import { db } from './firebase';
import { Item, Log, Preset, Group } from '@/types';

// ==================== GROUPS ====================

/**
 * Get reference to user's groups collection
 */
function getGroupsRef(userId: string) {
    return collection(db, 'users', userId, 'groups');
}

/**
 * Add a new group
 */
export async function addGroup(userId: string, name: string, color: string): Promise<string> {
    const docRef = await addDoc(getGroupsRef(userId), {
        name: name.trim(),
        color,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Update a group
 */
export async function updateGroup(userId: string, groupId: string, updates: { name?: string; color?: string }): Promise<void> {
    const docRef = doc(db, 'users', userId, 'groups', groupId);
    await updateDoc(docRef, updates);
}

/**
 * Delete a group
 */
export async function deleteGroup(userId: string, groupId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'groups', groupId);
    await deleteDoc(docRef);
}

/**
 * Get all groups
 */
export async function getGroups(userId: string): Promise<Group[]> {
    const q = query(getGroupsRef(userId), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Group));
}

/**
 * Subscribe to groups
 */
export function subscribeToGroups(
    userId: string,
    callback: (groups: Group[]) => void
): () => void {
    const q = query(getGroupsRef(userId), orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Group));
        callback(groups);
    });
}

/**
 * Ensure default group exists
 */
export async function ensureDefaultGroup(userId: string): Promise<string> {
    // First check if "Genel" specifically exists
    const q = query(getGroupsRef(userId), where('name', '==', 'Genel'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    // Then check if ANY group exists
    const groups = await getGroups(userId);
    if (groups.length > 0) {
        return groups[0].id;
    }

    // Create default group
    return await addGroup(userId, 'Genel', '#8b5cf6'); // Violet-500
}

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
export async function addItem(
    userId: string,
    name: string,
    groupId: string,
    groupNameSnapshot?: string,
    groupColorSnapshot?: string
): Promise<string> {
    const docRef = await addDoc(getItemsRef(userId), {
        name: name.trim(),
        groupId,
        groupNameSnapshot,
        groupColorSnapshot,
        createdAt: serverTimestamp(),
        isArchived: false,
    });
    return docRef.id;
}

/**
 * Update an item's name and cascade changes to all logs
 */
/**
 * Update an item's name and/or group, and cascade changes to all logs
 */
export async function updateItem(
    userId: string,
    itemId: string,
    updates: {
        name?: string;
        groupId?: string;
        groupNameSnapshot?: string;
        groupColorSnapshot?: string;
    }
): Promise<void> {
    const itemUpdates: any = {};
    if (updates.name) itemUpdates.name = updates.name.trim();
    if (updates.groupId) itemUpdates.groupId = updates.groupId;
    if (updates.groupNameSnapshot) itemUpdates.groupNameSnapshot = updates.groupNameSnapshot;
    if (updates.groupColorSnapshot) itemUpdates.groupColorSnapshot = updates.groupColorSnapshot;

    // 1. Update the item itself
    const docRef = doc(db, 'users', userId, 'items', itemId);
    await updateDoc(docRef, itemUpdates);

    // 2. Find all logs with this itemId
    const logsRef = collection(db, 'users', userId, 'logs');
    const q = query(logsRef, where('itemId', '==', itemId));
    const snapshot = await getDocs(q);

    // 3. Update all logs in batches
    const batches = [];
    let batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((doc) => {
        const logUpdates: any = {};
        if (updates.name) logUpdates.itemNameSnapshot = updates.name.trim();
        if (updates.groupId) logUpdates.groupId = updates.groupId;
        if (updates.groupColorSnapshot) logUpdates.groupColor = updates.groupColorSnapshot;

        if (Object.keys(logUpdates).length > 0) {
            batch.update(doc.ref, logUpdates);
            count++;

            if (count >= 490) { // Safety margin
                batches.push(batch.commit());
                batch = writeBatch(db);
                count = 0;
            }
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
    const defaultGroupId = await ensureDefaultGroup(userId);
    const demoItems = ['Spor', 'Yemek', 'Meditasyon', 'Kahve'];

    for (const itemName of demoItems) {
        await addItem(userId, itemName, defaultGroupId);
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
    note?: string,
    groupId?: string,
    groupColor?: string
): Promise<string> {
    const docRef = await addDoc(getLogsRef(userId), {
        date,
        time,
        timestamp: serverTimestamp(),
        itemId,
        itemNameSnapshot,
        note: note || null,
        groupId: groupId || null,
        groupColor: groupColor || null,
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
        // Note: Presets don't currently store group info, so we might miss it here.
        // For now, we'll skip passing group info for presets until we update presets structure.
        // Ideally, we should fetch item details to get the group.
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

// ==================== ITEM-SPECIFIC CALENDAR ====================

/**
 * Get log counts for a specific item by date (for item calendar badges)
 * Optimized to avoid composite index requirement by filtering in memory
 */
export async function getLogCountsByItemId(
    userId: string,
    itemId: string,
    startDate: string,
    endDate: string
): Promise<Record<string, number>> {
    // Query only by date range (uses existing single-field index)
    const q = query(
        getLogsRef(userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    const counts: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Filter by itemId in memory
        if (data.itemId === itemId) {
            const date = data.date;
            counts[date] = (counts[date] || 0) + 1;
        }
    });

    return counts;
}

/**
 * Get total usage count for a specific item (all time)
 */
export async function getTotalItemUsageCount(
    userId: string,
    itemId: string
): Promise<number> {
    const q = query(
        getLogsRef(userId),
        where('itemId', '==', itemId)
    );

    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
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
