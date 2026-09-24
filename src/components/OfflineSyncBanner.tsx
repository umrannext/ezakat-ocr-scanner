"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { 
  WifiOff, RefreshCw, CheckCircle2, CloudUpload, 
  AlertTriangle, X, ShieldAlert 
} from 'lucide-react';
import { getOfflineCount, syncOfflineReceipts } from '@/lib/offline-storage';

export default function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const updateStatus = useCallback(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    setOfflineCount(getOfflineCount());
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing || getOfflineCount() === 0) return;
    setIsSyncing(true);
    try {
      const result = await syncOfflineReceipts();
      setOfflineCount(getOfflineCount());
      if (result.synced > 0) {
        setSyncSuccessMsg(`${result.synced} rekod luar talian berjaya diselaraskan ke pangkalan data!`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.warn('Ralat sync automatik:', e);
    }
    setIsSyncing(false);
  }, [isSyncing]);

  useEffect(() => {
    updateStatus();

    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
      // Auto-sync apabila talian pulih
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      updateStatus();
    };

    const handleQueueUpdated = () => {
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueUpdated);

    // Semak juga jika online dan terdapat rekod tertunggak pada permulaan
    if (typeof navigator !== 'undefined' && navigator.onLine && getOfflineCount() > 0) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdated);
    };
  }, [updateStatus, triggerSync]);

  // Sekiranya online dan tiada rekod luar talian, jangan paparkan apa-apa
  if ((isOnline && offlineCount === 0 && !syncSuccessMsg) || isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full px-3 pt-2 pb-1 transition-all">
      {/* 1. Mesej Kejayaan Sync */}
      {syncSuccessMsg && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-200 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSyncSuccessMsg(null)}
            className="text-emerald-200 hover:text-white p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Status Luar Talian / Rekod Tertunggak */}
      {(!isOnline || offlineCount > 0) && (
        <div className={`text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-lg border backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300 ${
          !isOnline 
            ? 'bg-amber-600 text-white border-amber-500/80 shadow-amber-900/20' 
            : 'bg-slate-900/90 text-white border-white/20 shadow-slate-950/30'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {!isOnline ? (
              <WifiOff size={16} className="text-amber-200 shrink-0 animate-pulse" />
            ) : (
              <CloudUpload size={16} className="text-teal-400 shrink-0" />
            )}
            <div className="truncate">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-[11px] uppercase tracking-wider">
                  {!isOnline ? 'Tiada Internet' : 'Rekod Luar Talian'}
                </span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full font-bold">
                  Beta
                </span>
              </div>
              <p className="text-[10px] opacity-90 truncate mt-0.5">
                {!isOnline 
                  ? (offlineCount > 0 
                      ? `${offlineCount} resit disimpan di peranti (akan auto-sync)` 
                      : 'Imbas seperti biasa, resit disimpan di peranti') 
                  : `${offlineCount} resit belum diselaraskan ke database`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOnline && offlineCount > 0 && (
              <button
                type="button"
                onClick={triggerSync}
                disabled={isSyncing}
                className="bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Sync...' : 'Sync'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-white/70 hover:text-white p-1"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
