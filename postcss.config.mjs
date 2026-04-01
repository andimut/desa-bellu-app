'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user previously dismissed
      const wasDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!wasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }
  }, []);

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-white border border-emerald-200 rounded-xl shadow-lg shadow-emerald-100/50 p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <img src="/icon-192.png" alt="App Icon" className="w-8 h-8 rounded" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Install Aplikasi</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Tambahkan SID Desa ke home screen untuk akses lebih cepat.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
