'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import db from '@/lib/db';
import type { DataKelahiran } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import {
  Baby,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarDays,
  Ruler,
  Weight,
  Users,
  UserRound,
  MapPin,
  FileText,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Constants ───────────────────────────────────────────────────────────────

const JENIS_KELAMIN_OPTIONS = ['Laki-laki', 'Perempuan'] as const;
const ITEMS_PER_PAGE = 10;
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const emptyFormData: Omit<DataKelahiran, 'id'> = {
  namaBayi: '',
  jenisKelamin: 'Laki-laki',
  tempatLahir: '',
  tglLahir: '',
  beratBadan: 0,
  panjangBadan: 0,
  namaAyah: '',
  namaIbu: '',
  nikAyah: '',
  nikIbu: '',
  alamat: '',
  rt: '',
  rw: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Types ───────────────────────────────────────────────────────────────────

type DialogMode = 'add' | 'edit' | 'view' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTanggal = (tgl: string) => {
  if (!tgl) return '-';
  try {
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return tgl;
  }
};

const toInputDate = (tgl: string) => {
  if (!tgl) return '';
  try {
    const d = new Date(tgl);
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

export function KelahiranPage() {

  // ── Data State ──
  const [data, setData] = useState<DataKelahiran[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJK, setFilterJK] = useState<string>('');
  const [filterRT, setFilterRT] = useState<string>('');
  const [filterRW, setFilterRW] = useState<string>('');

  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);

  // ── Dialog State ──
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedItem, setSelectedItem] = useState<DataKelahiran | null>(null);
  const [formData, setFormData] = useState<Omit<DataKelahiran, 'id'>>(emptyFormData);

  // ── Delete State ──
  const [deleteTarget, setDeleteTarget] = useState<DataKelahiran | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Submit State ──
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Data Loading ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const all = await db.dataKelahiran.toArray();
      all.sort((a, b) => new Date(b.tglLahir).getTime() - new Date(a.tglLahir).getTime());
      setData(all);
    } catch (error) {
      console.error('Failed to load kelahiran data:', error);
      toast.error('Gagal memuat data kelahiran');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const all = await db.dataKelahiran.toArray();
        all.sort((a, b) => new Date(b.tglLahir).getTime() - new Date(a.tglLahir).getTime());
        if (!cancelled) {
          setData(all);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterJK, filterRT, filterRW]);

  // ─── Derived Data ────────────────────────────────────────────────────────

  const rtOptions = useMemo(() => {
    const rts = new Set(data.map(d => d.rt).filter(Boolean));
    return Array.from(rts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data]);

  const rwOptions = useMemo(() => {
    const rws = new Set(data.map(d => d.rw).filter(Boolean));
    return Array.from(rws).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => d.namaBayi.toLowerCase().includes(query));
    }

    if (filterJK) {
      filtered = filtered.filter(d => d.jenisKelamin === filterJK);
    }

    if (filterRT) {
      filtered = filtered.filter(d => d.rt === filterRT);
    }

    if (filterRW) {
      filtered = filtered.filter(d => d.rw === filterRW);
    }

    return filtered;
  }, [data, searchQuery, filterJK, filterRT, filterRW]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageData = filteredData.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  // ─── Statistics (this year) ─────────────────────────────────────────────

  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const thisYearData = data.filter(d => {
      try {
        return new Date(d.tglLahir).getFullYear() === currentYear;
      } catch {
        return false;
      }
    });
    const total = thisYearData.length;
    const lakiLaki = thisYearData.filter(d => d.jenisKelamin === 'Laki-laki').length;
    const perempuan = thisYearData.filter(d => d.jenisKelamin === 'Perempuan').length;
    return { total, lakiLaki, perempuan };
  }, [data]);

  // ─── Chart Data (births per month this year) ────────────────────────────

  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthlyCounts = new Array(12).fill(0);

    data.forEach(d => {
      try {
        const date = new Date(d.tglLahir);
        if (date.getFullYear() === currentYear) {
          monthlyCounts[date.getMonth()]++;
        }
      } catch {
        // ignore
      }
    });

    return MONTH_NAMES.map((name, idx) => ({
      name,
      kelahiran: monthlyCounts[idx],
    }));
  }, [data]);

  // ─── Form Handlers ───────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData(emptyFormData);
    setSelectedItem(null);
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setDialogMode('add');
  }, [resetForm]);

  const openEditDialog = useCallback((item: DataKelahiran) => {
    setSelectedItem(item);
    setFormData({
      namaBayi: item.namaBayi,
      jenisKelamin: item.jenisKelamin,
      tempatLahir: item.tempatLahir,
      tglLahir: item.tglLahir,
      beratBadan: item.beratBadan,
      panjangBadan: item.panjangBadan,
      namaAyah: item.namaAyah,
      namaIbu: item.namaIbu,
      nikAyah: item.nikAyah,
      nikIbu: item.nikIbu,
      alamat: item.alamat,
      rt: item.rt,
      rw: item.rw,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
    setDialogMode('edit');
  }, []);

  const openViewDialog = useCallback((item: DataKelahiran) => {
    setSelectedItem(item);
    setDialogMode('view');
  }, []);

  const closeDialog = useCallback(() => {
    setDialogMode(null);
    setSelectedItem(null);
  }, []);

  const handleFormChange = useCallback(
    <K extends keyof Omit<DataKelahiran, 'id'>>(
      field: K,
      value: Omit<DataKelahiran, 'id'>[K]
    ) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.namaBayi.trim()) {
      toast.error('Nama bayi wajib diisi');
      return;
    }
    if (!formData.tempatLahir.trim()) {
      toast.error('Tempat lahir wajib diisi');
      return;
    }
    if (!formData.tglLahir) {
      toast.error('Tanggal lahir wajib diisi');
      return;
    }
    if (!formData.namaAyah.trim()) {
      toast.error('Nama ayah wajib diisi');
      return;
    }
    if (!formData.namaIbu.trim()) {
      toast.error('Nama ibu wajib diisi');
      return;
    }
    if (formData.beratBadan <= 0) {
      toast.error('Berat badan harus lebih dari 0');
      return;
    }
    if (formData.panjangBadan <= 0) {
      toast.error('Panjang badan harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (dialogMode === 'edit' && selectedItem?.id) {
        await db.dataKelahiran.update(selectedItem.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Data kelahiran berhasil diperbarui');
      } else {
        await db.dataKelahiran.add({
          ...formData,
          id: undefined as unknown as number,
        } as DataKelahiran);
        toast.success('Data kelahiran berhasil ditambahkan');
      }
      closeDialog();
      loadData();
    } catch (error) {
      console.error('Failed to save kelahiran:', error);
      toast.error('Gagal menyimpan data kelahiran');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, dialogMode, selectedItem, closeDialog, loadData]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      await db.dataKelahiran.delete(deleteTarget.id);
      toast.success(`Data ${deleteTarget.namaBayi} berhasil dihapus`);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete kelahiran:', error);
      toast.error('Gagal menghapus data kelahiran');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, loadData]);

  // ─── Form Field Helper ──────────────────────────────────────────────────

  const renderFormField = (
    label: string,
    required?: boolean,
    children: React.ReactNode,
    colSpan?: 1 | 2
  ) => (
    <div className={colSpan === 2 ? 'col-span-1 md:col-span-2' : ''}>
      <Label className="text-xs font-medium mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );

  // ─── Detail View Item Helper ────────────────────────────────────────────

  const renderDetailItem = (label: string, value: string | number, icon?: React.ReactNode) => (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value || '-'}</p>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Kelahiran</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola data kelahiran bayi warga desa
        </p>
      </div>

      {/* ── Statistics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Baby className="size-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-emerald-700">
                  {isLoading ? '-' : stats.total}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Total Kelahiran Tahun Ini
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="size-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-blue-700">
                  {isLoading ? '-' : stats.lakiLaki}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Lahir Laki-laki
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                <UserRound className="size-5 text-pink-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-pink-700">
                  {isLoading ? '-' : stats.perempuan}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Lahir Perempuan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Chart: Births Per Month ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="size-4 text-emerald-600" />
            Kelahiran per Bulan — {new Date().getFullYear()}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} bayi`, 'Kelahiran']}
                  labelFormatter={(label: string) => `Bulan ${label}`}
                />
                <Bar dataKey="kelahiran" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.kelahiran > 0 ? '#059669' : '#d1d5db'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Search, Filter & Action Bar ── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama bayi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <Select
              value={filterJK || '__all__'}
              onValueChange={v => setFilterJK(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[150px]">
                <SelectValue placeholder="Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua</SelectItem>
                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                <SelectItem value="Perempuan">Perempuan</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterRT || '__all__'}
              onValueChange={v => setFilterRT(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[120px]">
                <SelectValue placeholder="Semua RT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua RT</SelectItem>
                {rtOptions.map(rt => (
                  <SelectItem key={rt} value={rt}>
                    RT {rt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterRW || '__all__'}
              onValueChange={v => setFilterRW(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[120px]">
                <SelectValue placeholder="Semua RW" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua RW</SelectItem>
                {rwOptions.map(rw => (
                  <SelectItem key={rw} value={rw}>
                    RW {rw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={openAddDialog}
            >
              <Plus className="size-3.5 mr-1" />
              Tambah Kelahiran
            </Button>

            {(searchQuery || filterJK || filterRT || filterRW) && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {filteredData.length} dari {data.length} data
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Data Table ── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Memuat data...
              </span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0 z-10">
                      <TableHead className="w-12 text-xs font-semibold text-center">
                        No
                      </TableHead>
                      <TableHead className="text-xs font-semibold min-w-[160px]">
                        Nama Bayi
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center">
                        L/P
                      </TableHead>
                      <TableHead className="text-xs font-semibold min-w-[150px]">
                        Tgl Lahir
                      </TableHead>
                      <TableHead className="text-xs font-semibold min-w-[150px]">
                        Nama Ayah
                      </TableHead>
                      <TableHead className="text-xs font-semibold min-w-[150px]">
                        Nama Ibu
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center">
                        RT/RW
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right sticky right-0 bg-muted/40">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.length > 0 ? (
                      pageData.map((item, index) => (
                        <TableRow key={item.id} className="group">
                          <TableCell className="text-xs text-center text-muted-foreground">
                            {(safeCurrentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {item.namaBayi}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold px-2 py-0.5 ${
                                item.jenisKelamin === 'Laki-laki'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                  : 'bg-pink-100 text-pink-700 hover:bg-pink-100'
                              }`}
                            >
                              {item.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatTanggal(item.tglLahir)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.namaAyah || '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.namaIbu || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {item.rt && item.rw
                              ? `${item.rt}/${item.rw}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-background group-hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-emerald-600"
                                onClick={() => openViewDialog(item)}
                                title="Lihat detail"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-blue-600"
                                onClick={() => openEditDialog(item)}
                                title="Edit"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <AlertDialog
                                open={deleteTarget?.id === item.id}
                                onOpenChange={open => {
                                  if (!open) setDeleteTarget(null);
                                  else setDeleteTarget(item);
                                }}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-muted-foreground hover:text-red-600"
                                    title="Hapus"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Konfirmasi Hapus Data
                                    </AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                      <div className="space-y-2">
                                        <p>
                                          Apakah Anda yakin ingin menghapus data
                                          kelahiran berikut?
                                        </p>
                                        <div className="rounded-md bg-muted p-3 space-y-1">
                                          <p className="text-sm font-semibold">
                                            {item.namaBayi}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Anak dari {item.namaAyah} & {item.namaIbu}
                                          </p>
                                        </div>
                                        <p className="text-xs text-destructive font-medium">
                                          Tindakan ini tidak dapat dibatalkan.
                                        </p>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>
                                      Batal
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDelete}
                                      disabled={isDeleting}
                                      className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-600"
                                    >
                                      {isDeleting ? (
                                        <>
                                          <Loader2 className="size-4 mr-1 animate-spin" />
                                          Menghapus...
                                        </>
                                      ) : (
                                        'Hapus'
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Baby className="size-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium">
                              Tidak ada data yang ditemukan
                            </p>
                            <p className="text-xs mt-1">
                              {searchQuery || filterJK || filterRT || filterRW
                                ? 'Coba ubah filter pencarian Anda'
                                : 'Belum ada data kelahiran yang terdaftar'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Menampilkan{' '}
                    {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}-
                    {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredData.length)}{' '}
                    dari {filteredData.length} data
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={safeCurrentPage <= 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      <ChevronLeft className="size-3.5" />
                      <span className="hidden sm:inline ml-1">Sebelumnya</span>
                    </Button>

                    <div className="flex items-center gap-0.5 mx-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - safeCurrentPage) <= 1) return true;
                          return false;
                        })
                        .reduce<(number | string)[]>((acc, page, idx, arr) => {
                          if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                            acc.push('...');
                          }
                          acc.push(page);
                          return acc;
                        }, [])
                        .map((page, idx) =>
                          page === '...' ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1 text-xs text-muted-foreground"
                            >
                              ...
                            </span>
                          ) : (
                            <Button
                              key={page}
                              variant={safeCurrentPage === page ? 'default' : 'outline'}
                              size="sm"
                              className={`h-7 w-7 p-0 text-xs ${
                                safeCurrentPage === page
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : ''
                              }`}
                              onClick={() => setCurrentPage(page as number)}
                            >
                              {page}
                            </Button>
                          )
                        )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={safeCurrentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      <span className="hidden sm:inline mr-1">Selanjutnya</span>
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Add/Edit Dialog ── */}
      <Dialog
        open={dialogMode === 'add' || dialogMode === 'edit'}
        onOpenChange={open => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="size-5 text-emerald-600" />
              {dialogMode === 'edit' ? 'Edit Data Kelahiran' : 'Tambah Data Kelahiran'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'edit'
                ? 'Perbarui informasi data kelahiran bayi.'
                : 'Isi formulir berikut untuk menambahkan data kelahiran baru.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* ── Data Bayi Section ── */}
            <div className="col-span-1 md:col-span-2">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Baby className="size-3.5" />
                Data Bayi
              </p>
            </div>

            {renderFormField('Nama Bayi', true, (
              <Input
                value={formData.namaBayi}
                onChange={e => handleFormChange('namaBayi', e.target.value)}
                placeholder="Nama lengkap bayi"
                className="h-9"
              />
            ))}

            {renderFormField('Jenis Kelamin', true, (
              <Select
                value={formData.jenisKelamin}
                onValueChange={v =>
                  handleFormChange('jenisKelamin', v as 'Laki-laki' | 'Perempuan')
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_KELAMIN_OPTIONS.map(jk => (
                    <SelectItem key={jk} value={jk}>
                      {jk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {renderFormField('Tempat Lahir', true, (
              <Input
                value={formData.tempatLahir}
                onChange={e => handleFormChange('tempatLahir', e.target.value)}
                placeholder="Kota/Kabupaten"
                className="h-9"
              />
            ))}

            {renderFormField('Tanggal Lahir', true, (
              <Input
                type="date"
                value={toInputDate(formData.tglLahir)}
                onChange={e => handleFormChange('tglLahir', e.target.value)}
                className="h-9"
              />
            ))}

            {renderFormField('Berat Badan (kg)', true, (
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.beratBadan || ''}
                onChange={e =>
                  handleFormChange('beratBadan', parseFloat(e.target.value) || 0)
                }
                placeholder="Contoh: 3.2"
                className="h-9"
              />
            ))}

            {renderFormField('Panjang Badan (cm)', true, (
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.panjangBadan || ''}
                onChange={e =>
                  handleFormChange('panjangBadan', parseFloat(e.target.value) || 0)
                }
                placeholder="Contoh: 50"
                className="h-9"
              />
            ))}

            {/* ── Data Orang Tua Section ── */}
            <div className="col-span-1 md:col-span-2 pt-2">
              <Separator className="mb-3" />
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Users className="size-3.5" />
                Data Orang Tua
              </p>
            </div>

            {renderFormField('Nama Ayah', true, (
              <Input
                value={formData.namaAyah}
                onChange={e => handleFormChange('namaAyah', e.target.value)}
                placeholder="Nama lengkap ayah"
                className="h-9"
              />
            ))}

            {renderFormField('Nama Ibu', true, (
              <Input
                value={formData.namaIbu}
                onChange={e => handleFormChange('namaIbu', e.target.value)}
                placeholder="Nama lengkap ibu"
                className="h-9"
              />
            ))}

            {renderFormField('NIK Ayah', false, (
              <Input
                value={formData.nikAyah}
                onChange={e => handleFormChange('nikAyah', e.target.value)}
                placeholder="16 digit NIK ayah"
                maxLength={16}
                className="h-9"
              />
            ))}

            {renderFormField('NIK Ibu', false, (
              <Input
                value={formData.nikIbu}
                onChange={e => handleFormChange('nikIbu', e.target.value)}
                placeholder="16 digit NIK ibu"
                maxLength={16}
                className="h-9"
              />
            ))}

            {/* ── Alamat Section ── */}
            <div className="col-span-1 md:col-span-2 pt-2">
              <Separator className="mb-3" />
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                Alamat
              </p>
            </div>

            {renderFormField('Alamat', false, (
              <Textarea
                value={formData.alamat}
                onChange={e => handleFormChange('alamat', e.target.value)}
                placeholder="Alamat lengkap"
                className="min-h-[60px] resize-none"
              />
            ), 2)}

            {renderFormField('RT', false, (
              <Input
                value={formData.rt}
                onChange={e => handleFormChange('rt', e.target.value)}
                placeholder="Contoh: 01"
                maxLength={3}
                className="h-9"
              />
            ))}

            {renderFormField('RW', false, (
              <Input
                value={formData.rw}
                onChange={e => handleFormChange('rw', e.target.value)}
                placeholder="Contoh: 03"
                maxLength={3}
                className="h-9"
              />
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={closeDialog}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 mr-1 animate-spin" />
                  Menyimpan...
                </>
              ) : dialogMode === 'edit' ? (
                'Perbarui'
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Detail Dialog ── */}
      <Dialog
        open={dialogMode === 'view'}
        onOpenChange={open => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-5 text-emerald-600" />
              Detail Data Kelahiran
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap data kelahiran bayi
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
              {/* Bayi Identity Header */}
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Baby className="size-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-emerald-800 truncate">
                      {selectedItem.namaBayi}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        className={`text-[10px] font-semibold px-2 py-0 ${
                          selectedItem.jenisKelamin === 'Laki-laki'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200'
                            : 'bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200'
                        }`}
                      >
                        {selectedItem.jenisKelamin}
                      </Badge>
                      <span className="text-xs text-emerald-700">
                        {formatTanggal(selectedItem.tglLahir)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Bayi */}
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Baby className="size-3.5" />
                  Data Bayi
                </p>
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                  {renderDetailItem('Tempat Lahir', selectedItem.tempatLahir, <MapPin className="size-3" />)}
                  {renderDetailItem('Tanggal Lahir', formatTanggal(selectedItem.tglLahir), <CalendarDays className="size-3" />)}
                  {renderDetailItem('Berat Badan', `${selectedItem.beratBadan} kg`, <Weight className="size-3" />)}
                  {renderDetailItem('Panjang Badan', `${selectedItem.panjangBadan} cm`, <Ruler className="size-3" />)}
                </div>
              </div>

              {/* Data Orang Tua */}
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  Data Orang Tua
                </p>
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                  {renderDetailItem('Nama Ayah', selectedItem.namaAyah, <Users className="size-3" />)}
                  {renderDetailItem('Nama Ibu', selectedItem.namaIbu, <UserRound className="size-3" />)}
                  {renderDetailItem('NIK Ayah', selectedItem.nikAyah || '-', <FileText className="size-3" />)}
                  {renderDetailItem('NIK Ibu', selectedItem.nikIbu || '-', <FileText className="size-3" />)}
                </div>
              </div>

              {/* Alamat */}
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  Alamat
                </p>
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                  {renderDetailItem('Alamat', selectedItem.alamat, <MapPin className="size-3" />)}
                  {renderDetailItem('RT/RW', selectedItem.rt && selectedItem.rw ? `${selectedItem.rt}/${selectedItem.rw}` : '-', <MapPin className="size-3" />)}
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-2">
                <Separator className="mb-3" />
                <p className="text-[10px] text-muted-foreground text-right">
                  Dibuat: {formatTanggal(selectedItem.createdAt)} &middot; Diperbarui:{' '}
                  {formatTanggal(selectedItem.updatedAt)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={closeDialog}>
              Tutup
            </Button>
            {selectedItem && (
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => {
                  closeDialog();
                  setTimeout(() => openEditDialog(selectedItem), 100);
                }}
              >
                <Pencil className="size-3.5 mr-1" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
