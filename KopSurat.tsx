import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppView, User, VillageProfile, Penduduk, KartuKeluarga, Surat, MasyarakatMiskin, Pengumuman } from './types';
import db from './db';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;

  // Navigation
  currentView: AppView;
  previousView: AppView | null;

  // Village Profile
  villageProfile: VillageProfile | null;

  // Print surat
  suratToPrint: Surat | null;

  // Online status
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
  pendingItems: number;

  // Actions - Auth
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Actions - Navigation
  navigate: (view: AppView) => void;
  goBack: () => void;

  // Actions - Village Profile
  loadVillageProfile: () => Promise<void>;
  setVillageProfile: (profile: VillageProfile) => Promise<void>;

  // Actions - Print Surat
  setSuratToPrint: (surat: Surat | null) => void;

  // Actions - Online Status
  setOnlineStatus: (status: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error') => void;
  updatePendingItems: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      currentView: 'dashboard',
      previousView: null,
      villageProfile: null,
      suratToPrint: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      syncStatus: 'idle',
      lastSyncTime: null,
      pendingItems: 0,

      // Auth
      login: async (username: string, password: string) => {
        try {
          const user = await db.users.where('username').equals(username).first();
          if (user && user.password === password) {
            set({ isAuthenticated: true, user });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, currentView: 'dashboard' });
      },

      // Navigation
      navigate: (view: AppView) => {
        const { currentView } = get();
        set({ previousView: currentView, currentView: view });
      },

      goBack: () => {
        const { previousView } = get();
        if (previousView) {
          set({ currentView: previousView, previousView: null });
        }
      },

      // Village Profile
      loadVillageProfile: async () => {
        try {
          const profile = await db.villageProfile.toCollection().first();
          if (profile) {
            set({ villageProfile: profile });
          }
        } catch (error) {
          console.error('Failed to load village profile:', error);
        }
      },

      setVillageProfile: async (profile: VillageProfile) => {
        try {
          if (profile.id) {
            await db.villageProfile.put(profile);
          } else {
            await db.villageProfile.add(profile);
          }
          set({ villageProfile: profile });
        } catch (error) {
          console.error('Failed to save village profile:', error);
        }
      },

      // Print Surat
      setSuratToPrint: (surat: Surat | null) => {
        set({ suratToPrint: surat });
      },

      // Online Status
      setOnlineStatus: (status: boolean) => {
        set({ isOnline: status });
      },

      setSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error') => {
        set({ syncStatus: status, lastSyncTime: new Date().toISOString() });
      },

      updatePendingItems: async () => {
        // Count items that need sync (placeholder for future online sync)
        set({ pendingItems: 0 });
      },
    }),
    {
      name: 'desa-app-storage',
      partialize: (state) => ({
        currentView: state.currentView,
      }),
    }
  )
);

// View labels for display
export const VIEW_LABELS: Record<AppView, string> = {
  dashboard: 'Dashboard',
  penduduk: 'Data Penduduk',
  kk: 'Kartu Keluarga',
  kelahiran: 'Data Kelahiran',
  kematian: 'Data Kematian',
  migrasi: 'Migrasi',
  'masyarakat-miskin': 'Data Masyarakat Miskin',
  surat: 'Administrasi Surat',
  'cetak-surat': 'Cetak Surat',
  keuangan: 'Keuangan Desa',
  perpajakan: 'Perpajakan Desa',
  'profil-desa': 'Profil Desa',
  pengumuman: 'Pengumuman & Berita',
  laporan: 'Laporan & Statistik',
  pengaturan: 'Pengaturan',
};

// Helper to get dashboard data
export async function getDashboardStats() {
  const [totalPenduduk, totalKK, suratBulanIni, masyarakatMiskin] = await Promise.all([
    db.penduduk.count(),
    db.kartuKeluarga.count(),
    db.surat.where('tanggalSurat').startsWith('2026-04').count(),
    db.masyarakatMiskin.count(),
  ]);

  const pendudukL = await db.penduduk.where('jenisKelamin').equals('Laki-laki').count();
  const pendudukP = await db.penduduk.where('jenisKelamin').equals('Perempuan').count();

  const miskinByLevel = [1, 2, 3, 4] as const;
  const miskinCounts = await Promise.all(
    miskinByLevel.map(async (level) => ({
      level,
      count: await db.masyarakatMiskin.where('level').equals(level).count(),
    }))
  );

  return { totalPenduduk, totalKK, suratBulanIni, masyarakatMiskin, pendudukL, pendudukP, miskinCounts };
}

export async function getRecentPengumuman(): Promise<Pengumuman[]> {
  return await db.pengumuman.orderBy('tanggalPublish').reverse().limit(3).toArray();
}

export async function getRecentSurat(): Promise<Surat[]> {
  return await db.surat.orderBy('createdAt').reverse().limit(5).toArray();
}

export async function getPendudukStats() {
  const all = await db.penduduk.toArray();
  const byAgama: Record<string, number> = {};
  const byPekerjaan: Record<string, number> = {};
  const byPendidikan: Record<string, number> = {};

  all.forEach((p) => {
    byAgama[p.agama] = (byAgama[p.agama] || 0) + 1;
    byPekerjaan[p.pekerjaan] = (byPekerjaan[p.pekerjaan] || 0) + 1;
    byPendidikan[p.pendidikan] = (byPendidikan[p.pendidikan] || 0) + 1;
  });

  return { byAgama, byPekerjaan, byPendidikan };
}
