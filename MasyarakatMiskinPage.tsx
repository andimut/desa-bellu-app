'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { getDashboardStats, getRecentPengumuman, getRecentSurat, getPendudukStats } from '@/lib/store';
import type { Pengumuman, Surat } from '@/lib/types';
import type { AppView } from '@/lib/types';
import {
  Users, BookOpen, FileText, HandHeart, Plus, FileSignature,
  UserPlus, CreditCard, Building2, Settings, TrendingUp, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { LEVEL_MISKIN_LABELS } from '@/lib/types';

const COLORS = ['#10b981', '#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b', '#ec4899'];

const quickAccessItems: { view: AppView; icon: React.ReactNode; label: string; color: string }[] = [
  { view: 'surat', icon: <FileSignature className="w-5 h-5" />, label: 'Buat Surat', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
  { view: 'penduduk', icon: <UserPlus className="w-5 h-5" />, label: 'Tambah Penduduk', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
  { view: 'kk', icon: <BookOpen className="w-5 h-5" />, label: 'Data KK', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
  { view: 'masyarakat-miskin', icon: <HandHeart className="w-5 h-5" />, label: 'Data Miskin', color: 'bg-red-50 text-red-600 hover:bg-red-100' },
  { view: 'keuangan', icon: <CreditCard className="w-5 h-5" />, label: 'Keuangan', color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' },
  { view: 'perpajakan', icon: <TrendingUp className="w-5 h-5" />, label: 'Perpajakan', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
  { view: 'profil-desa', icon: <Building2 className="w-5 h-5" />, label: 'Profil Desa', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
  { view: 'pengaturan', icon: <Settings className="w-5 h-5" />, label: 'Pengaturan', color: 'bg-gray-50 text-gray-600 hover:bg-gray-100' },
];

const statusSuratColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  diproses: 'bg-yellow-100 text-yellow-700',
  selesai: 'bg-blue-100 text-blue-700',
  dicetak: 'bg-emerald-100 text-emerald-700',
};

export default function DashboardPage() {
  const { navigate, isOnline } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [recentPengumuman, setRecentPengumuman] = useState<Pengumuman[]>([]);
  const [recentSurat, setRecentSurat] = useState<Surat[]>([]);
  const [chartData, setChartData] = useState<{ byAgama: any[]; byPekerjaan: any[] }>({ byAgama: [], byPekerjaan: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, rp, rs, ps] = await Promise.all([
          getDashboardStats(),
          getRecentPengumuman(),
          getRecentSurat(),
          getPendudukStats(),
        ]);
        setStats(s);
        setRecentPengumuman(rp);
        setRecentSurat(rs);

        const byAgama = Object.entries(ps.byAgama).map(([name, value]) => ({ name, value }));
        const byPekerjaan = Object.entries(ps.byPekerjaan)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);
        setChartData({ byAgama, byPekerjaan });
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 overflow-hidden">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Selamat Datang!</h2>
                <p className="text-emerald-100 mt-1">
                  {isOnline ? 'Sistem berjalan online — semua data tersinkronisasi' : 'Mode offline aktif — data tersimpan lokal'}
                </p>
              </div>
              {!isOnline && (
                <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Offline Mode
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Penduduk', value: stats?.totalPenduduk || 0, icon: <Users className="w-6 h-6" />, sub: `L: ${stats?.pendudukL || 0} | P: ${stats?.pendudukP || 0}`, color: 'emerald' },
          { title: 'Total KK', value: stats?.totalKK || 0, icon: <BookOpen className="w-6 h-6" />, sub: 'Kepala Keluarga', color: 'blue' },
          { title: 'Surat Bulan Ini', value: stats?.suratBulanIni || 0, icon: <FileText className="w-6 h-6" />, sub: 'Dibuat April 2026', color: 'orange' },
          { title: 'Masyarakat Miskin', value: stats?.masyarakatMiskin || 0, icon: <HandHeart className="w-6 h-6" />, sub: stats?.miskinCounts?.map((m: any) => `Lv${m.level}:${m.count}`).join(' | ') || '-', color: 'red' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{item.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{item.value.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-${item.color}-50 text-${item.color}-600`}>
                    {item.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Penduduk Berdasarkan Agama</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.byAgama}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.byAgama.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Penduduk Berdasarkan Pekerjaan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.byPekerjaan} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Access */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Akses Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickAccessItems.map((item) => (
                <Button
                  key={item.view}
                  variant="ghost"
                  onClick={() => navigate(item.view)}
                  className={`flex flex-col items-center gap-2 h-auto py-4 rounded-xl border transition-all ${item.color} cursor-pointer`}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row: Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pengumuman */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Pengumuman Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPengumuman.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.judul}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.isi}</p>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                        {item.kategori}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDate(item.tanggalPublish)}</p>
                  </div>
                ))}
                {recentPengumuman.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Belum ada pengumuman</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Surat */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Surat Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSurat.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.jenisSurat}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.namaPenerima} — {item.nikPenerima}</p>
                      </div>
                      <Badge className={`text-xs whitespace-nowrap flex-shrink-0 ${statusSuratColor[item.status] || ''}`}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDate(item.tanggalSurat)}</p>
                  </div>
                ))}
                {recentSurat.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Belum ada surat</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
