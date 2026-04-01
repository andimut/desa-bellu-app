'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import db from '@/lib/db';
import type { KartuKeluarga, Penduduk } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Search,
  Edit,
  Trash2,
  Eye,
  Home,
  Users,
  UserCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  IdCard,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const emptyFormData: Omit<KartuKeluarga, 'id'> = {
  nomorKK: '',
  kepalaKeluarga: '',
  alamat: '',
  rt: '',
  rw: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Types ───────────────────────────────────────────────────────────────────

type DialogMode = 'add' | 'edit' | 'view' | null;

// ─── Component ───────────────────────────────────────────────────────────────

export function KKPage() {

  // ── Data State ──
  const [data, setData] = useState<KartuKeluarga[]>([]);
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRT, setFilterRT] = useState<string>('');
  const [filterRW, setFilterRW] = useState<string>('');

  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);

  // ── Dialog State ──
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedKK, setSelectedKK] = useState<KartuKeluarga | null>(null);
  const [formData, setFormData] = useState<Omit<KartuKeluarga, 'id'>>(emptyFormData);

  // ── View Dialog: Related penduduk ──
  const [relatedPenduduk, setRelatedPenduduk] = useState<Penduduk[]>([]);

  // ── Delete State ──
  const [deleteTarget, setDeleteTarget] = useState<KartuKeluarga | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Form Submit State ──
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Select penduduk dropdown ──
  const [kepalaKeluargaOpen, setKepalaKeluargaOpen] = useState(false);
  const [kepalaKeluargaSearch, setKepalaKeluargaSearch] = useState('');

  // ─── Data Loading ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [allKK, allPenduduk] = await Promise.all([
        db.kartuKeluarga.toArray(),
        db.penduduk.toArray(),
      ]);
      setData(allKK);
      setPendudukList(allPenduduk);
    } catch (error) {
      console.error('Failed to load KK data:', error);
      toast.error('Gagal memuat data Kartu Keluarga');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const [allKK, allPenduduk] = await Promise.all([
        db.kartuKeluarga.toArray(),
        db.penduduk.toArray(),
      ]);
      if (!cancelled) {
        setData(allKK);
        setPendudukList(allPenduduk);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRT, filterRW]);

  // ─── Derived Data ────────────────────────────────────────────────────────

  // Collect RT/RW options from both KK and penduduk
  const rtOptions = useMemo(() => {
    const rts = new Set<string>();
    data.forEach(kk => { if (kk.rt) rts.add(kk.rt); });
    pendudukList.forEach(p => { if (p.rt) rts.add(p.rt); });
    return Array.from(rts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data, pendudukList]);

  const rwOptions = useMemo(() => {
    const rws = new Set<string>();
    data.forEach(kk => { if (kk.rw) rws.add(kk.rw); });
    pendudukList.forEach(p => { if (p.rw) rws.add(p.rw); });
    return Array.from(rws).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data, pendudukList]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        kk =>
          kk.nomorKK.toLowerCase().includes(query) ||
          kk.kepalaKeluarga.toLowerCase().includes(query)
      );
    }

    if (filterRT) {
      filtered = filtered.filter(kk => kk.rt === filterRT);
    }

    if (filterRW) {
      filtered = filtered.filter(kk => kk.rw === filterRW);
    }

    return filtered;
  }, [data, searchQuery, filterRT, filterRW]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageData = filteredData.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  // ─── Statistics ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalKK = data.length;

    // Count total penduduk (from penduduk table)
    const totalAnggota = pendudukList.length;

    // Find RT with most KK
    const rtCounts = new Map<string, number>();
    data.forEach(kk => {
      if (kk.rt) {
        rtCounts.set(kk.rt, (rtCounts.get(kk.rt) || 0) + 1);
      }
    });
    let rtTerbanyak = '-';
    let rtTerbanyakCount = 0;
    rtCounts.forEach((count, rt) => {
      if (count > rtTerbanyakCount) {
        rtTerbanyakCount = count;
        rtTerbanyak = `RT ${rt}`;
      }
    });

    return { totalKK, totalAnggota, rtTerbanyak, rtTerbanyakCount };
  }, [data, pendudukList]);

  // ─── Form Handlers ───────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData(emptyFormData);
    setSelectedKK(null);
    setKepalaKeluargaSearch('');
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setDialogMode('add');
  }, [resetForm]);

  const openEditDialog = useCallback((kk: KartuKeluarga) => {
    setSelectedKK(kk);
    setFormData({
      nomorKK: kk.nomorKK,
      kepalaKeluarga: kk.kepalaKeluarga,
      alamat: kk.alamat,
      rt: kk.rt,
      rw: kk.rw,
      createdAt: kk.createdAt,
      updatedAt: kk.updatedAt,
    });
    setKepalaKeluargaSearch(kk.kepalaKeluarga);
    setDialogMode('edit');
  }, []);

  const openViewDialog = useCallback(async (kk: KartuKeluarga) => {
    setSelectedKK(kk);
    setDialogMode('view');

    // Load penduduk with same RT/RW
    try {
      const related = await db.penduduk
        .where('rt')
        .equals(kk.rt)
        .toArray();
      // Further filter by RW in memory (Dexie compound query limitation)
      const filtered = related.filter(p => p.rw === kk.rw);
      setRelatedPenduduk(filtered);
    } catch (error) {
      console.error('Failed to load related penduduk:', error);
      setRelatedPenduduk([]);
    }
  }, []);

  const closeDialog = useCallback(() => {
    setDialogMode(null);
    setSelectedKK(null);
    setRelatedPenduduk([]);
    setKepalaKeluargaSearch('');
    setKepalaKeluargaOpen(false);
  }, []);

  const handleFormChange = useCallback(
    <K extends keyof Omit<KartuKeluarga, 'id'>>(
      field: K,
      value: Omit<KartuKeluarga, 'id'>[K]
    ) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleKepalaKeluargaSelect = useCallback((nama: string) => {
    handleFormChange('kepalaKeluarga', nama);
    setKepalaKeluargaSearch(nama);
    setKepalaKeluargaOpen(false);
  }, [handleFormChange]);

  const handleSubmit = useCallback(async () => {
    // Validate required fields
    if (!formData.nomorKK.trim()) {
      toast.error('Nomor KK wajib diisi');
      return;
    }
    if (formData.nomorKK.length !== 16 || !/^\d+$/.test(formData.nomorKK)) {
      toast.error('Nomor KK harus berupa 16 digit angka');
      return;
    }
    if (!formData.kepalaKeluarga.trim()) {
      toast.error('Kepala Keluarga wajib diisi');
      return;
    }
    if (!formData.alamat.trim()) {
      toast.error('Alamat wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      if (dialogMode === 'edit' && selectedKK?.id) {
        await db.kartuKeluarga.update(selectedKK.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Data Kartu Keluarga berhasil diperbarui');
      } else {
        await db.kartuKeluarga.add({
          ...formData,
          id: undefined as unknown as number,
        } as KartuKeluarga);
        toast.success('Data Kartu Keluarga berhasil ditambahkan');
      }
      closeDialog();
      loadData();
    } catch (error) {
      console.error('Failed to save KK:', error);
      toast.error('Gagal menyimpan data Kartu Keluarga');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, dialogMode, selectedKK, closeDialog, loadData]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      await db.kartuKeluarga.delete(deleteTarget.id);
      toast.success(`KK ${deleteTarget.nomorKK} berhasil dihapus`);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete KK:', error);
      toast.error('Gagal menghapus data Kartu Keluarga');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, loadData]);

  // ─── Kepala Keluarga dropdown filtered list ──────────────────────────────

  const filteredPendudukDropdown = useMemo(() => {
    if (!kepalaKeluargaSearch.trim()) {
      return pendudukList.slice(0, 20);
    }
    const q = kepalaKeluargaSearch.toLowerCase();
    return pendudukList
      .filter(p => p.nama.toLowerCase().includes(q) || p.nik.includes(q))
      .slice(0, 20);
  }, [kepalaKeluargaSearch, pendudukList]);

  // ─── Form Field Component ────────────────────────────────────────────────

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

  // ─── Detail Item Component ───────────────────────────────────────────────

  const renderDetailItem = (label: string, value: string) => (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
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
        <h1 className="text-2xl font-bold tracking-tight">
          Kartu Keluarga
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola data Kartu Keluarga warga desa
        </p>
      </div>

      {/* ── Statistics Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <FileText className="size-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-emerald-700">
                  {isLoading ? '-' : stats.totalKK}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Total KK
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                <Users className="size-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-teal-700">
                  {isLoading ? '-' : stats.totalAnggota}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Total Anggota KK
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <MapPin className="size-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-amber-700">
                  {isLoading ? '-' : stats.rtTerbanyak}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  RT Terbanyak
                  {stats.rtTerbanyakCount > 0 && (
                    <span className="ml-1">({stats.rtTerbanyakCount} KK)</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search, Filter & Action Bar ── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor KK atau kepala keluarga..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <Select
              value={filterRT || '__all__'}
              onValueChange={v => setFilterRT(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[130px]">
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
              <SelectTrigger className="h-9 w-full sm:w-[130px]">
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
              Tambah KK
            </Button>

            {(searchQuery || filterRT || filterRW) && (
              <Badge
                variant="secondary"
                className="ml-auto text-xs"
              >
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
                      <TableHead className="text-xs font-semibold min-w-[170px]">
                        Nomor KK
                      </TableHead>
                      <TableHead className="text-xs font-semibold min-w-[180px]">
                        Kepala Keluarga
                      </TableHead>
                      <TableHead className="text-xs font-semibold min-w-[200px]">
                        Alamat
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center min-w-[80px]">
                        RT/RW
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right sticky right-0 bg-muted/40">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.length > 0 ? (
                      pageData.map((kk, index) => (
                        <TableRow key={kk.id} className="group">
                          <TableCell className="text-xs text-center text-muted-foreground">
                            {(safeCurrentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-medium">
                            {kk.nomorKK}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <UserCheck className="size-3 text-emerald-700" />
                              </div>
                              {kk.kepalaKeluarga}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                            {kk.alamat || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                            >
                              {kk.rt && kk.rw ? `${kk.rt}/${kk.rw}` : '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-background group-hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-emerald-600"
                                onClick={() => openViewDialog(kk)}
                                title="Lihat detail"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-blue-600"
                                onClick={() => openEditDialog(kk)}
                                title="Edit"
                              >
                                <Edit className="size-3.5" />
                              </Button>
                              <AlertDialog
                                open={deleteTarget?.id === kk.id}
                                onOpenChange={open => {
                                  if (!open) setDeleteTarget(null);
                                  else setDeleteTarget(kk);
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
                                          Kartu Keluarga berikut?
                                        </p>
                                        <div className="rounded-md bg-muted p-3 space-y-1">
                                          <p className="text-sm font-semibold">
                                            {kk.kepalaKeluarga}
                                          </p>
                                          <p className="text-xs text-muted-foreground font-mono">
                                            No. KK: {kk.nomorKK}
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
                        <TableCell colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileText className="size-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium">
                              Tidak ada data yang ditemukan
                            </p>
                            <p className="text-xs mt-1">
                              {searchQuery || filterRT || filterRW
                                ? 'Coba ubah filter pencarian Anda'
                                : 'Belum ada data Kartu Keluarga yang terdaftar'}
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
                        .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                          if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                            acc.push('ellipsis');
                          }
                          acc.push(page);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === 'ellipsis' ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="text-xs text-muted-foreground px-1"
                            >
                              ...
                            </span>
                          ) : (
                            <Button
                              key={item}
                              variant={item === safeCurrentPage ? 'default' : 'outline'}
                              size="sm"
                              className={`h-7 w-7 p-0 text-xs ${
                                item === safeCurrentPage
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
                      className="h-7 px-2 text-xs"
                      disabled={safeCurrentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      <span className="hidden sm:inline mr-1">Berikutnya</span>
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={dialogMode === 'add' || dialogMode === 'edit'}
        onOpenChange={open => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="size-4 text-emerald-700" />
              </div>
              {dialogMode === 'edit' ? 'Edit Kartu Keluarga' : 'Tambah Kartu Keluarga'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'edit'
                ? 'Perbarui data Kartu Keluarga yang sudah terdaftar.'
                : 'Masukkan data Kartu Keluarga yang baru.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1 py-1">
            {renderFormField('Nomor KK', true, (
              <Input
                value={formData.nomorKK}
                onChange={e => handleFormChange('nomorKK', e.target.value)}
                placeholder="16 digit nomor KK"
                maxLength={16}
                className="h-9 font-mono"
              />
            ))}

            {renderFormField('Kepala Keluarga', true, (
              <div className="relative">
                <Input
                  value={kepalaKeluargaSearch}
                  onChange={e => {
                    setKepalaKeluargaSearch(e.target.value);
                    handleFormChange('kepalaKeluarga', e.target.value);
                    setKepalaKeluargaOpen(true);
                  }}
                  onFocus={() => setKepalaKeluargaOpen(true)}
                  placeholder="Ketik nama atau pilih dari data penduduk"
                  className="h-9"
                />
                {kepalaKeluargaOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredPendudukDropdown.length > 0 ? (
                      filteredPendudukDropdown.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted/60 flex items-center gap-2 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleKepalaKeluargaSelect(p.nama);
                          }}
                        >
                          <Users className="size-3 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{p.nama}</span>
                          <span className="text-muted-foreground font-mono text-[10px] ml-auto shrink-0">
                            {p.nik}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                        Tidak ditemukan
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {renderFormField('Alamat', true, (
              <Textarea
                value={formData.alamat}
                onChange={e => handleFormChange('alamat', e.target.value)}
                placeholder="Alamat lengkap tempat tinggal"
                className="min-h-[60px] resize-none"
              />
            ), 2)}

            {renderFormField('RT', true, (
              <Input
                value={formData.rt}
                onChange={e => handleFormChange('rt', e.target.value)}
                placeholder="Contoh: 01"
                maxLength={3}
                className="h-9"
              />
            ))}

            {renderFormField('RW', true, (
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
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Menyimpan...
                </>
              ) : dialogMode === 'edit' ? (
                'Simpan Perubahan'
              ) : (
                'Tambah KK'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW DETAIL DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={dialogMode === 'view'}
        onOpenChange={open => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <IdCard className="size-4 text-emerald-700" />
              </div>
              Detail Kartu Keluarga
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap Kartu Keluarga dan anggota keluarga
            </DialogDescription>
          </DialogHeader>

          {selectedKK && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* KK Header Card */}
              <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-teal-50 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center">
                    <Home className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      {selectedKK.kepalaKeluarga}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-mono">
                      {selectedKK.nomorKK}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {renderDetailItem('Alamat', selectedKK.alamat)}
                  {renderDetailItem(
                    'RT / RW',
                    selectedKK.rt && selectedKK.rw
                      ? `${selectedKK.rt} / ${selectedKK.rw}`
                      : '-'
                  )}
                  {renderDetailItem(
                    'Terdaftar Sejak',
                    selectedKK.createdAt
                      ? new Date(selectedKK.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'
                  )}
                  {renderDetailItem(
                    'Terakhir Diperbarui',
                    selectedKK.updatedAt
                      ? new Date(selectedKK.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'
                  )}
                </div>
              </div>

              {/* Related Penduduk */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Penduduk di RT {selectedKK.rt}/RW {selectedKK.rw}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold bg-emerald-100 text-emerald-700"
                  >
                    {relatedPenduduk.length} orang
                  </Badge>
                </div>

                {relatedPenduduk.length > 0 ? (
                  <ScrollArea className="max-h-[280px] rounded-md border">
                    <div className="divide-y">
                      {relatedPenduduk.map(p => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Users className="size-3.5 text-emerald-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {p.nama}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              NIK: {p.nik}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold px-2 py-0 ${
                                p.jenisKelamin === 'Laki-laki'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-pink-100 text-pink-700'
                              }`}
                            >
                              {p.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="rounded-md border border-dashed py-8 flex flex-col items-center text-muted-foreground">
                    <Users className="size-8 mb-2 opacity-30" />
                    <p className="text-xs">Tidak ada data penduduk untuk wilayah ini</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={closeDialog}
            >
              Tutup
            </Button>
            {selectedKK && (
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => {
                  closeDialog();
                  setTimeout(() => openEditDialog(selectedKK), 100);
                }}
              >
                <Edit className="size-3.5 mr-1" />
                Edit Data
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
