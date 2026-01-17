import Dexie, { Table } from 'dexie';
import PQueue from 'p-queue';
import { client } from './api';

// Define offline action types
export interface OfflineAction {
  id?: number;
  type: 'delivery_update' | 'signature_upload' | 'photo_upload';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

// IndexedDB database
class OfflineDatabase extends Dexie {
  actions!: Table<OfflineAction, number>;

  constructor() {
    super('LREHoldingsOffline');
    this.version(1).stores({
      actions: '++id, type, timestamp, status',
    });
  }
}

const db = new OfflineDatabase();

// Serial sync queue
const syncQueue = new PQueue({ concurrency: 1 });

// Sync status listeners
type SyncListener = (status: { syncing: boolean; pending: number; failed: number }) => void;
const syncListeners: SyncListener[] = [];

export function addSyncListener(listener: SyncListener) {
  syncListeners.push(listener);
}

export function removeSyncListener(listener: SyncListener) {
  const index = syncListeners.indexOf(listener);
  if (index > -1) {
    syncListeners.splice(index, 1);
  }
}

function notifySyncListeners() {
  db.actions.where('status').equals('pending').count().then(pending => {
    db.actions.where('status').equals('failed').count().then(failed => {
      const syncing = syncQueue.size > 0 || syncQueue.pending > 0;
      syncListeners.forEach(listener => listener({ syncing, pending, failed }));
    });
  });
}

// Queue an offline action
export async function queueOfflineAction(
  type: OfflineAction['type'],
  data: any
): Promise<void> {
  await db.actions.add({
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  });
  notifySyncListeners();
}

// Sync a single action
async function syncAction(action: OfflineAction): Promise<boolean> {
  try {
    await db.actions.update(action.id!, { status: 'syncing' });
    notifySyncListeners();

    switch (action.type) {
      case 'delivery_update':
        await client.entities.deliveries.update({
          id: action.data.id,
          data: action.data.updates,
        });
        break;

      case 'signature_upload': {
        // Upload signature to storage
        const sigResponse = await client.apiCall.invoke({
          url: '/api/v1/storage/upload-url',
          method: 'POST',
          data: {
            bucket_name: 'signatures',
            object_key: action.data.object_key,
          },
        });
        
        // Upload file
        await fetch(sigResponse.data.upload_url, {
          method: 'PUT',
          body: action.data.file,
          headers: { 'Content-Type': 'image/png' },
        });
        
        // Update delivery with signature URL
        await client.entities.deliveries.update({
          id: action.data.delivery_id,
          data: { signature_url: action.data.object_key },
        });
        break;
      }

      case 'photo_upload': {
        // Similar to signature upload
        const photoResponse = await client.apiCall.invoke({
          url: '/api/v1/storage/upload-url',
          method: 'POST',
          data: {
            bucket_name: 'damages',
            object_key: action.data.object_key,
          },
        });
        
        await fetch(photoResponse.data.upload_url, {
          method: 'PUT',
          body: action.data.file,
          headers: { 'Content-Type': 'image/jpeg' },
        });
        break;
      }
    }

    await db.actions.update(action.id!, { status: 'completed' });
    notifySyncListeners();
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    await db.actions.update(action.id!, {
      status: 'failed',
      retryCount: action.retryCount + 1,
    });
    notifySyncListeners();
    return false;
  }
}

// Start syncing all pending actions
export async function startSync(): Promise<void> {
  const pendingActions = await db.actions
    .where('status')
    .anyOf(['pending', 'failed'])
    .and(action => action.retryCount < 3)
    .sortBy('timestamp');

  for (const action of pendingActions) {
    syncQueue.add(() => syncAction(action));
  }

  notifySyncListeners();
}

// Clear completed actions (cleanup)
export async function clearCompletedActions(): Promise<void> {
  await db.actions.where('status').equals('completed').delete();
  notifySyncListeners();
}

// Check if online and auto-sync
export function setupAutoSync(): void {
  window.addEventListener('online', () => {
    console.log('Network restored, starting sync...');
    startSync();
  });

  // Initial sync if online
  if (navigator.onLine) {
    startSync();
  }
}

// Get sync statistics
export async function getSyncStats() {
  const pending = await db.actions.where('status').equals('pending').count();
  const failed = await db.actions.where('status').equals('failed').count();
  const completed = await db.actions.where('status').equals('completed').count();
  
  return { pending, failed, completed };
}