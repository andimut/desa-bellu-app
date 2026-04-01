'use client';

import { useAppStore, VIEW_LABELS } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Bell, Menu, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export default function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { currentView, isOnline } = useAppStore();
  const title = VIEW_LABELS[currentView] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between">
      {/* Left: Mobile Menu + Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-500 hover:text-gray-900 cursor-pointer"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        </div>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-2">
        {/* Online Status */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isOnline 
            ? 'bg-emerald-50 text-emerald-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 relative cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}
