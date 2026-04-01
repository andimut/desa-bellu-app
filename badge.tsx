'use client';

import { useAppStore } from '@/lib/store';
import { VIEW_LABELS } from '@/lib/store';
import type { AppView } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Users, BookOpen, Baby, Heart, ArrowLeftRight,
  HandHeart, FileText, Wallet, Receipt, Building2, Megaphone,
  BarChart3, Settings, LogOut, ShieldCheck, ChevronDown, ChevronRight, Database
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface MenuGroup {
  label?: string;
  items: {
    view: AppView;
    icon: React.ReactNode;
    label: string;
  }[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Menu Utama',
    items: [
      { view: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    ],
  },
  {
    label: 'Kependudukan',
    items: [
      { view: 'penduduk', icon: <Users className="w-5 h-5" />, label: 'Data Penduduk' },
      { view: 'kk', icon: <BookOpen className="w-5 h-5" />, label: 'Kartu Keluarga' },
      { view: 'kelahiran', icon: <Baby className="w-5 h-5" />, label: 'Data Kelahiran' },
      { view: 'kematian', icon: <Heart className="w-5 h-5" />, label: 'Data Kematian' },
      { view: 'migrasi', icon: <ArrowLeftRight className="w-5 h-5" />, label: 'Migrasi' },
    ],
  },
  {
    label: 'Kesejahteraan',
    items: [
      { view: 'masyarakat-miskin', icon: <HandHeart className="w-5 h-5" />, label: 'Data Masyarakat Miskin' },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { view: 'surat', icon: <FileText className="w-5 h-5" />, label: 'Administrasi Surat' },
      { view: 'keuangan', icon: <Wallet className="w-5 h-5" />, label: 'Keuangan Desa' },
      { view: 'perpajakan', icon: <Receipt className="w-5 h-5" />, label: 'Perpajakan Desa' },
    ],
  },
  {
    label: 'Informasi',
    items: [
      { view: 'profil-desa', icon: <Building2 className="w-5 h-5" />, label: 'Profil Desa' },
      { view: 'pengumuman', icon: <Megaphone className="w-5 h-5" />, label: 'Pengumuman & Berita' },
      { view: 'laporan', icon: <BarChart3 className="w-5 h-5" />, label: 'Laporan & Statistik' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { view: 'pengaturan', icon: <Settings className="w-5 h-5" />, label: 'Pengaturan' },
    ],
  },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { currentView, navigate, logout, user, villageProfile, isOnline, syncStatus } = useAppStore();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigate = (view: AppView) => {
    navigate(view);
    onClose();
  };

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar');
  };

  const desaName = villageProfile?.namaDesa || 'Desa Bellu';

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
            {villageProfile?.logoDesa ? (
              <img src={villageProfile.logoDesa} alt="Logo" className="w-full h-full rounded-full object-cover" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">{desaName}</h2>
            <p className="text-xs text-gray-500 truncate">Sistem Informasi Desa</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <div className="px-3 space-y-1">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {group.label && group.items.length > 1 && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                >
                  {group.label}
                  {collapsedGroups[group.label] ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}

              {(!group.label || !collapsedGroups[group.label] || group.items.length === 1) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                      <button
                        key={item.view}
                        onClick={() => handleNavigate(item.view)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                        }`}
                      >
                        <span className={isActive ? 'text-emerald-600' : 'text-gray-400'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Sync Status */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs">
          <Database className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">
            {isOnline ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Tersinkronisasi
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                Mode Lokal
              </span>
            )}
          </span>
        </div>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.namaLengkap?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.namaLengkap || 'Admin'}</p>
            <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 mt-0.5">
              {user?.role || 'admin'}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
