'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Heart,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Activity,
  CalendarDays,
  Users,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DataKematian } from '@/lib/types';
import db from '@/lib/db';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

// ── Constants ──────────────────────────────────────────────────────────────
const SEBAB_KEMATIAN_OPTIONS = [
  'Sakit tua',
  'Penyakit jantung',
  'Penyakit ginjal',
  'Kanker',
  'Kecelakaan',
  'Lainnya',
] as const;

const HUBUNGAN_AHLI_WARIS_OPTIONS = [
  'Anak',
  'Istri',
  'Suami',
  'Orang Tua',
  'Saudara',
  'Lainnya',
] as const;

const ITEMS_PER_PAGE = 10;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const CHART_COLORS = [
  '#059669',
  '#10b981',
  '#34d399',
  '#6ee7b7',
  '#a7f3d0',
  '#d1fae5',
];

// ── Empty form template ───────────────────────────────────────────────────
const emptyForm = {
  namaMeninggal: '',
  nik: '',
  jenisKelamin: '' as '' | 'Laki-laki' | 'Perempuan',
  tempatLahir: '',
  tglLahir: '',
  tglMeninggal: '',
  sebabKematian: '',
  umur: '',
  namaAhliWaris: '',
  hubunganAhliWaris: '',
  alamat: '',
  rt: '',
  rw: '',
};

// ── Component ──────────────────────────────────────────────────────────────
export function KematianPage() {
  const [data, setData] = useState<DataKematian[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJk, setFilterJk] = useState<'' | 'Laki-laki' | 'Perempuan'>('');
  const [filterRt, setFilterRt] = useState('');
  const [filterRw, setFilterRw] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState(emptyForm);
  const [selectedData, setSelectedData] = useState<DataKematian | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const allData = await db.dataKematian.toArray();
      setData(allData.sort((a, b) => new Date(b.tglMeninggal).getTime() - new Date(a.tglMeninggal).getTime()));
    } catch {
      toast.error('Gagal memuat data kematian');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed values ────────────────────────────────────────────────────
  const uniqueRt = useMemo(() => {
    const set = new Set(data.map((d) => d.rt).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const uniqueRw = useMemo(() => {
    const set = new Set(data.map((d) => d.rw).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        item.namaMeninggal.toLowerCase().includes(q) ||
        item.nik.includes(q);
      const matchJk = !filterJk || item.jenisKelamin === filterJk;
      const matchRt = !filterRt || item.rt === filterRt;
      const matchRw = !filterRw || item.rw === filterRw;
      return matchSearch && matchJk && matchRt && matchRw;
    });
  }, [data, searchQuery, filterJk, filterRt, filterRw]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Stats
  const totalKematian = data.length;

  const kematianBulanIni = useMemo(() => {
    const now = new Date();
    return data.filter((d) => {
      const date = new Date(d.tglMeninggal);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [data]);

  const rataRataUmur = useMemo(() => {
    if (data.length === 0) return '0';
    const total = data.reduce((sum, d) => {
      const match = d.umur.match(/(\d+)/);
      return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0);
    return (total / data.length).toFixed(1);
  }, [data]);

  // Chart data
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((d) => {
      const cause = d.sebabKematian || 'Tidak diketahui';
      counts[cause] = (counts[cause] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setShowAddDialog(true);
  };

  const handleOpenEdit = (item: DataKematian) => {
    setSelectedData(item);
    setFormData({
      namaMeninggal: item.namaMeninggal,
      nik: item.nik,
      jenisKelamin: item.jenisKelamin,
      tempatLahir: item.tempatLahir,
      tglLahir: item.tglLahir,
      tglMeninggal: item.tglMeninggal,
      sebabKematian: item.sebabKematian,
      umur: item.umur,
      namaAhliWaris: item.namaAhliWaris,
      hubunganAhliWaris: item.hubunganAhliWaris,
      alamat: item.alamat,
      rt: item.rt,
      rw: item.rw,
    });
    setShowEditDialog(true);
  };

  const handleOpenView = (item: DataKematian) => {
    setSelectedData(item);
    setShowViewDialog(true);
  };

  const handleOpenDelete = (item: DataKematian) => {
    setSelectedData(item);
    setShowDeleteDialog(true);
  };

  const handleAdd = async () => {
    if (!formData.namaMeninggal || !formData.nik) {
      toast.error('Nama dan NIK wajib diisi');
      return;
    }
    if (formData.nik.length !== 16) {
      toast.error('NIK harus 16 digit');
      return;
    }
    if (!formData.tglMeninggal) {
      toast.error('Tanggal meninggal wajib diisi');
      return;
    }
    try {
      const now = new Date().toISOString();
      await db.dataKematian.add({
        ...formData,
        jenisKelamin: formData.jenisKelamin as 'Laki-laki' | 'Perempuan',
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Data kematian berhasil ditambahkan');
      setShowAddDialog(false);
      loadData();
    } catch {
      toast.error('Gagal menambahkan data kematian');
    }
  };

  const handleEdit = async () => {
    if (!selectedData) return;
    if (!formData.namaMeninggal || !formData.nik) {
      toast.error('Nama dan NIK wajib diisi');
      return;
    }
    if (formData.nik.length !== 16) {
      toast.error('NIK harus 16 digit');
      return;
    }
    try {
      await db.dataKematian.update(selectedData.id!, {
        ...formData,
        jenisKelamin: formData.jenisKelamin as 'Laki-laki' | 'Perempuan',
        updatedAt: new Date().toISOString(),
      });
      toast.success('Data kematian berhasil diperbarui');
      setShowEditDialog(false);
      setSelectedData(null);
      loadData();
    } catch {
      toast.error('Gagal memperbarui data kematian');
    }
  };

  const handleDelete = async () => {
    if (!selectedData) return;
    try {
      await db.dataKematian.delete(selectedData.id!);
      toast.success('Data kematian berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedData(null);
      loadData();
    } catch {
      toast.error('Gagal menghapus data kematian');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterJk('');
    setFilterRt('');
    setFilterRw('');
    setCurrentPage(1);
  };

  // ── Form helper ────────────────────────────────────────────────────────
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ── Form JSX ───────────────────────────────────────────────────────────
  const formContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label htmlFor="namaMeninggal">Nama Meninggal *</Label>
        <Input
          id="namaMeninggal"
          value={formData.namaMeninggal}
          onChange={(e) => updateField('namaMeninggal', e.target.value)}
          placeholder="Masukkan nama lengkap"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nik">NIK *</Label>
        <Input
          id="nik"
          value={formData.nik}
          onChange={(e) => updateField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
          placeholder="16 digit NIK"
          className="font-mono"
          maxLength={16}
        />
      </div>
      <div className="space-y-2">
        <Label>Jenis Kelamin *</Label>
        <Select
          value={formData.jenisKelamin}
          onValueChange={(v) => updateField('jenisKelamin', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih jenis kelamin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
            <SelectItem value="Perempuan">Perempuan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tempatLahir">Tempat Lahir</Label>
        <Input
          id="tempatLahir"
          value={formData.tempatLahir}
          onChange={(e) => updateField('tempatLahir', e.target.value)}
          placeholder="Contoh: Watampone"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tglLahir">Tanggal Lahir</Label>
        <Input
          id="tglLahir"
          type="date"
          value={formData.tglLahir}
          onChange={(e) => updateField('tglLahir', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tglMeninggal">Tanggal Meninggal *</Label>
        <Input
          id="tglMeninggal"
          type="date"
          value={formData.tglMeninggal}
          onChange={(e) => updateField('tglMeninggal', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Sebab Kematian</Label>
        <Select
          value={formData.sebabKematian}
          onValueChange={(v) => updateField('sebabKematian', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih sebab" />
          </SelectTrigger>
          <SelectContent>
            {SEBAB_KEMATIAN_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="umur">Umur</Label>
        <Input
          id="umur"
          value={formData.umur}
          onChange={(e) => updateField('umur', e.target.value)}
          placeholder="Contoh: 75 tahun"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="namaAhliWaris">Nama Ahli Waris</Label>
        <Input
          id="namaAhliWaris"
          value={formData.namaAhliWaris}
          onChange={(e) => updateField('namaAhliWaris', e.target.value)}
          placeholder="Masukkan nama ahli waris"
        />
      </div>
      <div className="space-y-2">
        <Label>Hubungan Ahli Waris</Label>
        <Select
          value={formData.hubunganAhliWaris}
          onValueChange={(v) => updateField('hubunganAhliWaris', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih hubungan" />
          </SelectTrigger>
          <SelectContent>
            {HUBUNGAN_AHLI_WARIS_OPTIONS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="alamat">Alamat</Label>
        <Textarea
          id="alamat"
          value={formData.alamat}
          onChange={(e) => updateField('alamat', e.target.value)}
          placeholder="Masukkan alamat lengkap"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rt">RT</Label>
        <Input
          id="rt"
          value={formData.rt}
          onChange={(e) => updateField('rt', e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="Contoh: 01"
          maxLength={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rw">RW</Label>
        <Input
          id="rw"
          value={formData.rw}
          onChange={(e) => updateField('rw', e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="Contoh: 03"
          maxLength={3}
        />
      </div>
    </div>
  );

  // ── View dialog detail ─────────────────────────────────────────────────
  const viewContent = selectedData && (
    <div className="space-y-4 text-sm">
      {/* Header */}
      <div className="text-center space-y-1 pb-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 mb-2">
          <Heart className="w-7 h-7 text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {selectedData.namaMeninggal}
        </h3>
        <p className="text-gray-500 font-mono text-xs">{selectedData.nik}</p>
      </div>

      <Separator className="bg-gray-200 dark:bg-gray-700" />

      {/* Detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailItem label="Jenis Kelamin" value={selectedData.jenisKelamin} />
        <DetailItem label="Tempat, Tgl Lahir" value={`${selectedData.tempatLahir}, ${selectedData.tglLahir ? formatDate(selectedData.tglLahir) : '-'}`} />
        <DetailItem label="Tanggal Meninggal" value={formatDate(selectedData.tglMeninggal)} highlight />
        <DetailItem label="Umur" value={selectedData.umur || '-'} />
        <DetailItem label="Sebab Kematian" value={selectedData.sebabKematian || '-'} highlight />
        <DetailItem label="Nama Ahli Waris" value={selectedData.namaAhliWaris || '-'} />
        <DetailItem label="Hubungan" value={selectedData.hubunganAhliWaris || '-'} />
        <DetailItem label="RT / RW" value={`${selectedData.rt || '-'}/${selectedData.rw || '-'}`} />
      </div>

      <div>
        <DetailItem label="Alamat" value={selectedData.alamat || '-'} />
      </div>

      <Separator className="bg-gray-200 dark:bg-gray-700" />

      <div className="text-center text-xs text-gray-400">
        Dicatat pada {formatDate(selectedData.createdAt)}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="h-7 w-7 text-emerald-600" />
            Data Kematian
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola data kematian warga desa
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Data
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Kematian</p>
              <p className="text-2xl font-bold text-emerald-700">{totalKematian}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kematian Bulan Ini</p>
              <p className="text-2xl font-bold text-emerald-700">{kematianBulanIni}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rata-rata Umur</p>
              <p className="text-2xl font-bold text-emerald-700">
                {rataRataUmur}
                <span className="text-sm font-normal text-emerald-600 ml-1">tahun</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Filters row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Kematian Berdasarkan Sebab
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value: number) => [`${value} orang`, 'Jumlah']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Belum ada data untuk ditampilkan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              Pencarian &amp; Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari nama atau NIK..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                value={filterJk}
                onValueChange={(v) => {
                  setFilterJk(v as '' | 'Laki-laki' | 'Perempuan');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Jenis Kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis Kelamin</SelectItem>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterRt}
                onValueChange={(v) => {
                  setFilterRt(v === 'all' ? '' : v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="RT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {uniqueRt.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      RT {rt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterRw}
                onValueChange={(v) => {
                  setFilterRw(v === 'all' ? '' : v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="RW" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RW</SelectItem>
                  {uniqueRw.map((rw) => (
                    <SelectItem key={rw} value={rw}>
                      RW {rw}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || filterJk || filterRt || filterRw) && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {filteredData.length} hasil ditemukan
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs h-6 px-2">
                  <X className="w-3 h-3 mr-1" />
                  Reset Filter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">No</TableHead>
                  <TableHead>Nama Meninggal</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Tgl Meninggal</TableHead>
                  <TableHead>Sebab</TableHead>
                  <TableHead>Ahli Waris</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p>Tidak ada data kematian</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{item.namaMeninggal}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {item.nik}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            item.jenisKelamin === 'Laki-laki'
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-50'
                              : 'bg-pink-50 text-pink-700 hover:bg-pink-50'
                          }
                        >
                          {item.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(item.tglMeninggal)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[140px] truncate">
                        {item.sebabKematian || '-'}
                      </TableCell>
                      <TableCell className="text-sm">{item.namaAhliWaris || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleOpenView(item)}
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleOpenDelete(item)}
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredData.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari{' '}
                {filteredData.length} data
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | string)[]>((acc, page, idx, arr) => {
                      if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      typeof item === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={currentPage === item ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 w-8 p-0 ${
                            currentPage === item
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : ''
                          }`}
                          onClick={() => setCurrentPage(item)}
                        >
                          {item}
                        </Button>
                      )
                    )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Plus className="w-5 h-5" />
              Tambah Data Kematian
            </DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Pencil className="w-5 h-5" />
              Edit Data Kematian
            </DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit} className="bg-amber-600 hover:bg-amber-700 text-white">
              Perbarui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-600">
              <Eye className="w-5 h-5" />
              Detail Data Kematian
            </DialogTitle>
          </DialogHeader>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-800">
            {viewContent}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Hapus Data Kematian
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data kematian atas nama{' '}
              <span className="font-semibold text-foreground">
                {selectedData?.namaMeninggal}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Sub-component for view detail ──────────────────────────────────────────
function DetailItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p
        className={`font-medium ${
          highlight
            ? 'text-gray-800 dark:text-gray-200'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
