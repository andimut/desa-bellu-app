'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { seedDatabase } from '@/lib/db';
import OnlineStatus from '@/components/layout/OnlineStatus';
import LoginPage from '@/components/auth/LoginPage';
import PublicPage from '@/components/public/PublicPage';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import { ViewRouter } from '@/components/ViewRouter';
import { Sheet, SheetContent } from '@/components/ui/sheet';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Memuat Sistem Informasi Desa...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const loadVillageProfile = useAppStore((s) => s.loadVillageProfile);
  const isOnline = useAppStore((s) => s.isOnline);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await seedDatabase();
        await loadVillageProfile();
      } catch (e) {
        console.error('Init error:', e);
      }
      setIsInitialized(true);
    };
    init();
  }, [loadVillageProfile]);

  // Reset to public page when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLogin(false);
    }
  }, [isAuthenticated]);

  // Always render OnlineStatus (mounted globally)
  return (
    <>
      <div className="hidden">
        <OnlineStatus />
      </div>

      {!isInitialized ? (
        <LoadingScreen />
      ) : !isAuthenticated ? (
        showLogin ? (
          <LoginPage onBack={() => setShowLogin(false)} />
        ) : (
          <PublicPage onLoginClick={() => setShowLogin(true)} />
        )
      ) : (
        <div className="min-h-screen bg-gray-50/50 flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:z-40">
            <AppSidebar isOpen={false} onClose={() => setSidebarOpen(false)} />
          </div>

          {/* Mobile Sidebar (Sheet) */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-72">
              <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div className="flex-1 lg:pl-64">
            <AppHeader onMenuToggle={() => setSidebarOpen(true)} />
            <main className="p-4 lg:p-6">
              <ViewRouter />
            </main>
          </div>
        </div>
      )}
    </>
  );
}
