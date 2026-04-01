'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function OnlineStatus() {
  const { setOnlineStatus } = useAppStore();

  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      toast.success('Koneksi kembali tersedia', { description: 'Mode Online aktif' });
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      toast.warning('Anda sedang offline', { description: 'Data tersimpan secara lokal' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return null;
}
