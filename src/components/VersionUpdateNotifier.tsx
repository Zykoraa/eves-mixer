import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles, X, ArrowUpCircle } from 'lucide-react';

interface VersionInfo {
  version: string;
  buildTime: number;
  builtAt?: string;
}

export const VersionUpdateNotifier: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [latestInfo, setLatestInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const currentBuildTime = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 0;
  const currentAppVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.1.0';

  const checkForUpdate = useCallback(async (isInitialLoad = false) => {
    try {
      // Cache-busted fetch to bypass any browser or CDN disk cache
      const res = await fetch(`./version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!res.ok) return;
      const data: VersionInfo = await res.json();

      if (data.buildTime && currentBuildTime && data.buildTime > currentBuildTime) {
        setLatestInfo(data);
        setUpdateAvailable(true);

        // If newly opened/searched and no audio or recording has started, auto-reload cleanly
        if (isInitialLoad && !sessionStorage.getItem('eves_mixer_reloaded_for_update')) {
          sessionStorage.setItem('eves_mixer_reloaded_for_update', 'true');
          window.location.reload();
        }
      }
    } catch {
      // Network offline or local file protocol
    }
  }, [currentBuildTime]);

  useEffect(() => {
    // Check immediately on mount
    checkForUpdate(true);

    // Periodically check every 45 seconds
    const interval = window.setInterval(() => {
      checkForUpdate(false);
    }, 45000);

    // Check whenever tab comes into view (e.g. after searching or opening tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  const handleApplyUpdate = async () => {
    try {
      // Clear any service worker caches
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
    } catch {}

    // Hard reload with cache buster
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(Date.now()));
    window.location.href = url.toString();
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-3 duration-200">
      <div className="flex items-center gap-3 bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-slate-900/95 text-white px-4 py-2.5 rounded-full border border-purple-500/50 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400 animate-spin" />
          <span className="text-xs font-bold">
            New Eve's Mixer version available {latestInfo?.version ? `(v${latestInfo.version})` : ''}!
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleApplyUpdate}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Update Now</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
