'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import db from '@/lib/db';
import type { MasyarakatMiskin, LevelMiskin } from '@/lib/types';
import { LEVEL_MISKIN_LABELS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Search,
  PieChart as PieChartIcon,
  HeartPulse,
  Home,
  GraduationCap,
  Calculator,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────────────────────

const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#14b8a6'];

const LEVEL_BADGE_STYLES: Record<LevelMiskin, string> = {
  1: 'bg-red-100 text-red-700 border border-red-200',
  2: 'bg-orange-100 text-orange-700 border border-orange-200',
  3: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  4: 'bg-teal-100 text-teal-700 border border-teal-200',
};

const LEVEL_CARD_CONFIG: Record<
  LevelMiskin,
  { label: string; bgClass: string; textClass: string; iconBgClass: string }
> = {
  1: {
    label: 'Sangat Miskin',
    bgClass: 'bg-red-500',
    textClass: 'text-white',
    iconBgClass: 'bg-red-400',
  },
  2: {
    label: 'Miskin',
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
    iconBgClass: 'bg-orange-400',
  },
  3: {
    label: 'Hampir Miskin',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-950',
    iconBgClass: 'bg-yellow-400',
  },
  4: {
    label: 'Rentan Miskin',
    bgClass: 'bg-teal-500',
    textClass: 'text-white',
    iconBgClass: 'bg-teal-400',
  },
};

const KONDISI_RUMAH_OPTIONS = [
  { value: 'layak', label: 'Layak' },
  { value: 'semi-tidak layak', label: 'Semi Tidak Layak' },
  { value: 'tidak layak', label: 'Tidak Layak' },
] as const;

const AKSES_KESEHATAN_OPTIONS = [
  { value: 'baik', label: 'Baik' },
  { value: 'kurang', label: 'Kurang' },
  { value: 'tidak ada', label: 'Tidak Ada' },
] as const;

const AKSES_PENDIDIKAN_OPTIONS = [
  { value: 'semua', label: 'Semua' },
  { value: 'sampai SMP', label: 'Sampai SMP' },
  { value: 'sampai SD', label: 'Sampai SD' },
  { value: 'tidak ada', label: 'Tidak Ada' },
] as const;

const LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: 'Level 1 — Sangat Miskin' },
  { value: '2', label: 'Level 2 — Miskin' },
  { value: '3', label: 'Level 3 — Hampir Miskin' },
  { value: '4', label: 'Level 4 — Rentan Miskin' },
];

interface FormData {
  namaKK: string;
  level: LevelMiskin;
  penghasilan: number;
  jumlahTanggungan: number;
  kondisiRumah: 'layak' | 'semi-tidak layak' | 'tidak layak';
  aksesKesehatan: 'baik' | 'kurang' | 'tidak ada';
  aksesPendidikan: 'semua' | 'sampai SMP' | 'sampai SD' | 'tidak ada';
  catatan: string;
}

const createEmptyFormData = (): FormData => ({
  namaKK: '',
  level: 4,
  penghasilan: 0,
  jumlahTanggungan: 0,
  kondisiRumah: 'layak',
  aksesKesehatan: 'baik',
  aksesPendidikan: 'semua',
  catatan: '',
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

function calculateLevel(formData: Omit<FormData, 'level' | 'catatan'>): LevelMiskin {
  let score = 0;

  // Penghasilan scoring
  if (formData.penghasilan < 300_000) score += 3;
  else if (formData.penghasilan <= 700_000) score += 2;
  else if (formData.penghasilan <= 1_200_000) score += 1;

  // Kondisi rumah scoring
  if (formData.kondisiRumah === 'tidak layak') score += 2;
  else if (formData.kondisiRumah === 'semi-tidak layak') score += 1;

  // Akses kesehatan scoring
  if (formData.aksesKesehatan === 'tidak ada') score += 2;
  else if (formData.aksesKesehatan === 'kurang') score += 1;

  // Akses pendidikan scoring
  if (formData.aksesPendidikan === 'tidak ada') score += 2;
  else if (formData.aksesPendidikan === 'sampai SD') score += 1;

  // Tanggungan scoring
  if (formData.jumlahTanggungan > 4) score += 1;

  // Determine level from score
  if (score >= 8) return 1;
  if (score >= 6) return 2;
  if (score >= 4) return 3;
  return 4;
}

// ─── Custom Tooltip for Chart ──────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function ChartTooltipContent({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold" style={{ color: item.payload.fill }}>
        {item.name}
      </p>
      <p className="text-gray-600 mt-1">
        {item.value} {item.value === 1 ? 'KK' : 'KK'}
      </p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MasyarakatMiskinPage() {
  // ─── State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<MasyarakatMiskin[]>([]);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);

  // Form & selection
  const [formData, setFormData] = useState<FormData>(createEmptyFormData());
  const [selectedItem, setSelectedItem] = useState<MasyarakatMiskin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MasyarakatMiskin | null>(null);

  // Auto-calc toggle
  const [autoCalcLevel, setAutoCalcLevel] = useState(true);

  // ─── Data Loading ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const masyarakat = await db.masyarakatMiskin.toArray();
      setData(masyarakat);
    } catch {
      toast.error('Gagal memuat data masyarakat miskin');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 100));
      if (!cancelled) await loadData();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  // ─── Computed ──────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = [...data];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((m) => m.namaKK.toLowerCase().includes(q));
    }
    if (filterLevel !== 'all') {
      result = result.filter((m) => m.level === Number(filterLevel));
    }
    return result;
  }, [data, search, filterLevel]);

  const levelStats = useMemo(() => {
    const total = data.length;
    return ([1, 2, 3, 4] as LevelMiskin[]).map((level) => {
      const count = data.filter((m) => m.level === level).length;
      return {
        level,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  }, [data]);

  const chartData = useMemo(
    () =>
      levelStats.map((s) => ({
        name: LEVEL_MISKIN_LABELS[s.level].label,
        value: s.count,
        fill: CHART_COLORS[s.level - 1],
      })),
    [levelStats]
  );

  // ─── Auto Level Calculation ────────────────────────────────────────────
  useEffect(() => {
    if (!autoCalcLevel) return;
    const level = calculateLevel({
      penghasilan: formData.penghasilan,
      jumlahTanggungan: formData.jumlahTanggungan,
      kondisiRumah: formData.kondisiRumah,
      aksesKesehatan: formData.aksesKesehatan,
      aksesPendidikan: formData.aksesPendidikan,
    });
    setFormData((prev) => ({ ...prev, level }));
  }, [
    autoCalcLevel,
    formData.penghasilan,
    formData.jumlahTanggungan,
    formData.kondisiRumah,
    formData.aksesKesehatan,
    formData.aksesPendidikan,
  ]);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setFormData(createEmptyFormData());
    setAutoCalcLevel(true);
    setOpenAdd(true);
  };

  const handleOpenEdit = (item: MasyarakatMiskin) => {
    setSelectedItem(item);
    setFormData({
      namaKK: item.namaKK,
      level: item.level,
      penghasilan: item.penghasilan,
      jumlahTanggungan: item.jumlahTanggungan,
      kondisiRumah: item.kondisiRumah,
      aksesKesehatan: item.aksesKesehatan,
      aksesPendidikan: item.aksesPendidikan,
      catatan: item.catatan,
    });
    setAutoCalcLevel(true);
    setOpenEdit(true);
  };

  const handleOpenView = (item: MasyarakatMiskin) => {
    setSelectedItem(item);
    setOpenView(true);
  };

  const handleConfirmDelete = (item: MasyarakatMiskin) => {
    setDeleteTarget(item);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await db.masyarakatMiskin.delete(deleteTarget.id);
      toast.success(`Data "${deleteTarget.namaKK}" berhasil dihapus`);
      setDeleteTarget(null);
      await loadData();
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  const handleSave = async () => {
    if (!formData.namaKK.trim()) {
      toast.error('Nama KK wajib diisi');
      return;
    }

    const now = new Date().toISOString();

    try {
      if (selectedItem?.id) {
        // Update
        await db.masyarakatMiskin.update(selectedItem.id, {
          kkId: selectedItem.kkId,
          namaKK: formData.namaKK.trim(),
          level: formData.level,
          penghasilan: formData.penghasilan,
          jumlahTanggungan: formData.jumlahTanggungan,
          kondisiRumah: formData.kondisiRumah,
          aksesKesehatan: formData.aksesKesehatan,
          aksesPendidikan: formData.aksesPendidikan,
          catatan: formData.catatan.trim(),
          updatedAt: now,
        });
        toast.success(`Data "${formData.namaKK}" berhasil diperbarui`);
        setOpenEdit(false);
      } else {
        // Add
        await db.masyarakatMiskin.add({
          kkId: 0,
          namaKK: formData.namaKK.trim(),
          level: formData.level,
          penghasilan: formData.penghasilan,
          jumlahTanggungan: formData.jumlahTanggungan,
          kondisiRumah: formData.kondisiRumah,
          aksesKesehatan: formData.aksesKesehatan,
          aksesPendidikan: formData.aksesPendidikan,
          catatan: formData.catatan.trim(),
          createdAt: now,
          updatedAt: now,
        });
        toast.success(`Data "${formData.namaKK}" berhasil ditambahkan`);
        setOpenAdd(false);
      }

      setSelectedItem(null);
      setFormData(createEmptyFormData());
      await loadData();
    } catch {
      toast.error('Gagal menyimpan data');
    }
  };

  const updateFormField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Render: Form ──────────────────────────────────────────────────────
  const renderForm = (isEditing: boolean) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
      {/* Nama KK */}
      <div className="space-y-1.5">
        <Label htmlFor="namaKK" className="text-xs font-medium">
          Nama Kepala Keluarga <span className="text-red-500">*</span>
        </Label>
        <Input
          id="namaKK"
          value={formData.namaKK}
          onChange={(e) => updateFormField('namaKK', e.target.value)}
          placeholder="Masukkan nama kepala keluarga..."
          className="h-9"
        />
      </div>

      {/* Level */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Level Kemiskinan</Label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoCalcLevel(!autoCalcLevel)}
              className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Calculator className="size-3" />
              {autoCalcLevel ? 'Otomatis' : 'Manual'}
            </button>
          </div>
        </div>
        <Select
          value={String(formData.level)}
          onValueChange={(v) => updateFormField('level', Number(v) as LevelMiskin)}
          disabled={autoCalcLevel}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {autoCalcLevel && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Info className="size-3" />
            Level dihitung otomatis berdasarkan skor kriteria
          </p>
        )}
      </div>

      {/* Penghasilan & Tanggungan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="penghasilan" className="text-xs font-medium">
            Penghasilan / Bulan
          </Label>
          <Input
            id="penghasilan"
            type="number"
            min={0}
            value={formData.penghasilan}
            onChange={(e) => updateFormField('penghasilan', Number(e.target.value))}
            placeholder="0"
            className="h-9"
          />
          {formData.penghasilan > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {formatRupiah(formData.penghasilan)}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tanggungan" className="text-xs font-medium">
            Jumlah Tanggungan
          </Label>
          <Input
            id="tanggungan"
            type="number"
            min={0}
            value={formData.jumlahTanggungan}
            onChange={(e) => updateFormField('jumlahTanggungan', Number(e.target.value))}
            placeholder="0"
            className="h-9"
          />
        </div>
      </div>

      {/* Kondisi Rumah */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Home className="size-3" /> Kondisi Rumah
        </Label>
        <Select
          value={formData.kondisiRumah}
          onValueChange={(v) =>
            updateFormField('kondisiRumah', v as FormData['kondisiRumah'])
          }
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KONDISI_RUMAH_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Akses Kesehatan */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <HeartPulse className="size-3" /> Akses Kesehatan
        </Label>
        <Select
          value={formData.aksesKesehatan}
          onValueChange={(v) =>
            updateFormField('aksesKesehatan', v as FormData['aksesKesehatan'])
          }
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AKSES_KESEHATAN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Akses Pendidikan */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <GraduationCap className="size-3" /> Akses Pendidikan
        </Label>
        <Select
          value={formData.aksesPendidikan}
          onValueChange={(v) =>
            updateFormField('aksesPendidikan', v as FormData['aksesPendidikan'])
          }
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AKSES_PENDIDIKAN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Catatan */}
      <div className="space-y-1.5">
        <Label htmlFor="catatan" className="text-xs font-medium">
          Catatan
        </Label>
        <Textarea
          id="catatan"
          value={formData.catatan}
          onChange={(e) => updateFormField('catatan', e.target.value)}
          placeholder="Catatan tambahan (opsional)..."
          className="min-h-[60px] resize-none"
        />
      </div>
    </div>
  );

  // ─── Render: View Detail ───────────────────────────────────────────────
  const renderViewDetail = () => {
    if (!selectedItem) return null;
    const item = selectedItem;
    const config = LEVEL_CARD_CONFIG[item.level];
    const labelConfig = LEVEL_MISKIN_LABELS[item.level];

    return (
      <div className="space-y-4">
        {/* Level Indicator */}
        <div
          className={`${config.bgClass} ${config.textClass} rounded-lg p-4 flex items-center gap-3`}
        >
          <div className={`${config.iconBgClass} rounded-full p-2`}>
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs opacity-80">Level {item.level}</p>
            <p className="text-lg font-bold">{config.label}</p>
          </div>
        </div>

        {/* Detail Card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Nama Kepala Keluarga
            </p>
            <p className="text-sm font-semibold">{item.namaKK}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Penghasilan / Bulan
            </p>
            <p className="text-sm font-semibold">{formatRupiah(item.penghasilan)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Jumlah Tanggungan
            </p>
            <p className="text-sm font-semibold">{item.jumlahTanggungan} orang</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Level Kemiskinan
            </p>
            <Badge className={`${LEVEL_BADGE_STYLES[item.level]} text-[11px]`}>
              Level {item.level} — {labelConfig.label}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-3 grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Kondisi Rumah
            </p>
            <Badge variant="outline" className="text-[11px] capitalize">
              {item.kondisiRumah}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Akses Kesehatan
            </p>
            <Badge variant="outline" className="text-[11px] capitalize">
              {item.aksesKesehatan}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Akses Pendidikan
            </p>
            <Badge variant="outline" className="text-[11px] capitalize">
              {item.aksesPendidikan}
            </Badge>
          </div>
        </div>

        {item.catatan && (
          <div className="border-t pt-3 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Catatan
            </p>
            <p className="text-sm text-gray-700">{item.catatan}</p>
          </div>
        )}

        <div className="border-t pt-3">
          <p className="text-[10px] text-muted-foreground">
            Dibuat: {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Data Masyarakat Miskin</h2>
          <p className="text-sm text-muted-foreground">
            Kelola data kemiskinan warga desa dengan sistem klasifikasi 4 level
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <Plus className="size-4 mr-2" />
          Tambah Data
        </Button>
      </div>

      {/* ─── Stats Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {levelStats.map((stat) => {
          const config = LEVEL_CARD_CONFIG[stat.level];
          const isActive = filterLevel === String(stat.level);
          return (
            <Card
              key={stat.level}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden border-0 shadow-sm ${
                isActive ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
              }`}
              onClick={() =>
                setFilterLevel(isActive ? 'all' : String(stat.level))
              }
            >
              <div className={`${config.bgClass} px-4 pt-3 pb-2`}>
                <div className="flex items-center justify-between">
                  <div className={`${config.iconBgClass} rounded-lg p-1.5`}>
                    <AlertTriangle className="size-4 text-white" />
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/30 text-white'
                        : 'bg-white/20 text-white/80'
                    }`}
                  >
                    {isActive ? 'Aktif' : `${stat.percentage}%`}
                  </span>
                </div>
              </div>
              <CardContent className="px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {config.label}
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.count}
                  </p>
                  <span className="text-xs text-muted-foreground pb-0.5">
                    dari {data.length} KK
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Chart & Table Section ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Doughnut Chart */}
        <Card className="lg:col-span-4 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
              <PieChartIcon className="size-4 text-emerald-600" />
              Distribusi Level Kemiskinan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <PieChartIcon className="size-10 opacity-20 mb-2" />
                <p className="text-xs">Belum ada data</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Chart Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {chartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-[11px] text-muted-foreground truncate">
                    {entry.name}
                  </span>
                  <span className="text-[11px] font-semibold ml-auto">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="lg:col-span-8 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                <Users className="size-4 text-emerald-600" />
                Daftar Masyarakat Miskin
                <Badge variant="outline" className="text-[10px] font-normal">
                  {filteredData.length} data
                </Badge>
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama KK..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X className="size-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Level Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <Button
                variant={filterLevel === 'all' ? 'default' : 'outline'}
                size="sm"
                className={`h-7 text-[11px] px-3 ${
                  filterLevel === 'all'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'text-gray-600'
                }`}
                onClick={() => setFilterLevel('all')}
              >
                Semua ({data.length})
              </Button>
              {levelStats.map((stat) => {
                const config = LEVEL_CARD_CONFIG[stat.level];
                const isActive = filterLevel === String(stat.level);
                return (
                  <Button
                    key={stat.level}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={`h-7 text-[11px] px-3 ${
                      isActive
                        ? `${config.bgClass} ${config.textClass} hover:opacity-90`
                        : 'text-gray-600'
                    }`}
                    onClick={() =>
                      setFilterLevel(isActive ? 'all' : String(stat.level))
                    }
                  >
                    {config.label} ({stat.count})
                  </Button>
                );
              })}
            </div>

            {/* Table */}
            <div className="max-h-[420px] overflow-auto rounded-lg border custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold w-10 text-center">
                      No
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Nama KK
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center">
                      Level
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Penghasilan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center">
                      Tanggungan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center w-28">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <div className="size-5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                          <p className="text-xs">Memuat data...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Users className="size-8 opacity-20" />
                          <p className="text-xs">
                            {search || filterLevel !== 'all'
                              ? 'Tidak ada data yang cocok'
                              : 'Belum ada data masyarakat miskin'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-emerald-50/30 transition-colors"
                      >
                        <TableCell className="text-xs text-center text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-900">
                          {item.namaKK}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`${LEVEL_BADGE_STYLES[item.level]} text-[10px]`}
                          >
                            L{item.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-gray-700">
                          {formatRupiah(item.penghasilan)}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {item.jumlahTanggungan} orang
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenView(item)}
                              title="Lihat Detail"
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleConfirmDelete(item)}
                                  title="Hapus"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <Trash2 className="size-4 text-red-500" />
                                    Konfirmasi Hapus
                                  </AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div className="space-y-2">
                                      <p>
                                        Apakah Anda yakin ingin menghapus data
                                        berikut?
                                      </p>
                                      <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-2">
                                        <p className="text-sm font-semibold text-red-800">
                                          {item.namaKK}
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">
                                          Level {item.level} —{' '}
                                          {LEVEL_MISKIN_LABELS[item.level].label}
                                        </p>
                                      </div>
                                      <p className="text-xs text-muted-foreground pt-1">
                                        Tindakan ini tidak dapat dibatalkan.
                                      </p>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Ya, Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Add Dialog ──────────────────────────────────────────────── */}
      <Dialog open={openAdd} onOpenChange={(open) => { setOpenAdd(open); if (!open) setFormData(createEmptyFormData()); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-emerald-100 rounded-lg p-1.5">
                <Plus className="size-4 text-emerald-600" />
              </div>
              Tambah Data Masyarakat Miskin
            </DialogTitle>
            <DialogDescription>
              Isi data kemiskinan untuk kepala keluarga. Level akan dihitung otomatis
              berdasarkan kriteria.
            </DialogDescription>
          </DialogHeader>
          {renderForm(false)}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setOpenAdd(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) {
            setSelectedItem(null);
            setFormData(createEmptyFormData());
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-blue-100 rounded-lg p-1.5">
                <Edit className="size-4 text-blue-600" />
              </div>
              Edit Data Masyarakat Miskin
            </DialogTitle>
            <DialogDescription>
              Perbarui data kemiskinan untuk{' '}
              <span className="font-semibold text-gray-700">
                {selectedItem?.namaKK}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          {renderForm(true)}
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setOpenEdit(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={openView}
        onOpenChange={(open) => {
          setOpenView(open);
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-emerald-100 rounded-lg p-1.5">
                <Eye className="size-4 text-emerald-600" />
              </div>
              Detail Data Masyarakat Miskin
            </DialogTitle>
            <DialogDescription>
              Lihat informasi lengkap data kemiskinan.
            </DialogDescription>
          </DialogHeader>
          {renderViewDetail()}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setOpenView(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
