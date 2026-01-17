import { useEffect, useState } from 'react';
import { addSyncListener, removeSyncListener } from '@/lib/offline-sync';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ syncing: false, pending: 0, failed: 0 });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const syncListener = (status: { syncing: boolean; pending: number; failed: number }) => {
      setSyncStatus(status);
    };

    addSyncListener(syncListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      removeSyncListener(syncListener);
    };
  }, []);

  if (isOnline && !syncStatus.syncing && syncStatus.pending === 0 && syncStatus.failed === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
        !isOnline ? 'bg-red-600' :
        syncStatus.syncing ? 'bg-amber-500' :
        syncStatus.failed > 0 ? 'bg-red-500' :
        'bg-emerald-500'
      } text-white`}>
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-semibold">Offline Mode</span>
          </>
        ) : syncStatus.syncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-semibold">Syncing... ({syncStatus.pending} pending)</span>
          </>
        ) : syncStatus.pending > 0 ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-semibold">{syncStatus.pending} items to sync</span>
          </>
        ) : syncStatus.failed > 0 ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-semibold">{syncStatus.failed} failed syncs</span>
          </>
        ) : null}
      </div>
    </div>
  );
}