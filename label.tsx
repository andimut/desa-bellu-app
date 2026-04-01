'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import db from '@/lib/db';
import type { Penduduk } from '@/lib/types';
import {
  AGAMA_OPTIONS,
  PENDIDIKAN_OPTIONS,
  PEKERJAAN_OPTIONS,
  STATUS_KAWIN_OPTIONS,
} from '@/lib/types';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  Users,
  User,
  UserCheck,
  MapPin,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  X,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Constants ───────────────────────────────────────────────────────────────

const JENIS_KELAMIN_OPTIONS = ['Laki-laki', 'Perempuan'] as const;
const ITEMS_PER_PAGE = 10;

const emptyFormData: Omit<Penduduk, 'id'> = {
  nik: '',
  nama: '',
  tempatLahir: '',
  tglLahir: '',
  jenisKelamin: 'Laki-laki',
  agama: AGAMA_OPTIONS[0],
  statusPerkawinan: STATUS_KAWIN_OPTIONS[0],
  pekerjaan: PEKERJAAN_OPTIONS[0],
  pendidikan: PENDIDIKAN_OPTIONS[0],
  alamat: '',
  rt: '',
  rw: '',
  foto: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Types ───────────────────────────────────────────────────────────────────

type DialogMode = 'add' | 'edit' | 'view' | null;

// ─── Component ───────────────────────────────────────────────────────────────

export function PendudukPage() {

  // ── Data State ──
  const [data, setData] = useState<Penduduk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRT, setFilterRT] = useState<string>('');
  const [filterRW, setFilterRW] = useState<string>('');
  const [filterJK, setFilterJK] = useState<string>('');

  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);

  // ── Dialog State ──
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedPenduduk, setSelectedPenduduk] = useState<Penduduk | null>(null);
  const [formData, setFormData] = useState<Omit<Penduduk, 'id'>>(emptyFormData);

  // ── Delete State ──
  const [deleteTarget, setDeleteTarget] = useState<Penduduk | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Calendar Open State ──
  const [calendarOpen, setCalendarOpen] = useState(false);

  // ── NIK Duplicate Check State ──
  const [nikDuplicate, setNikDuplicate] = useState<{ nama: string } | null>(null);
  const [isCheckingNik, setIsCheckingNik] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── File Input Ref ──
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Data Loading ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const all = await db.penduduk.toArray();
      setData(all);
    } catch (error) {
      console.error('Failed to load penduduk data:', error);
      toast.error('Gagal memuat data penduduk');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const all = await db.penduduk.toArray();
      if (!cancelled) {
        setData(all);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRT, filterRW, filterJK]);

  // ─── Derived Data ────────────────────────────────────────────────────────

  const rtOptions = useMemo(() => {
    const rts = new Set(data.map(p => p.rt).filter(Boolean));
    return Array.from(rts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data]);

  const rwOptions = useMemo(() => {
    const rws = new Set(data.map(p => p.rw).filter(Boolean));
    return Array.from(rws).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.nik.toLowerCase().includes(query) ||
          p.nama.toLowerCase().includes(query)
      );
    }

    if (filterRT) {
      filtered = filtered.filter(p => p.rt === filterRT);
    }

    if (filterRW) {
      filtered = filtered.filter(p => p.rw === filterRW);
    }

    if (filterJK) {
      filtered = filtered.filter(p => p.jenisKelamin === filterJK);
    }

    return filtered;
  }, [data, searchQuery, filterRT, filterRW, filterJK]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageData = filteredData.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  // ─── Statistics ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = data.length;
    const lakiLakiCount = data.filter(p => p.jenisKelamin === 'Laki-laki').length;
    const perempuanCount = data.filter(p => p.jenisKelamin === 'Perempuan').length;

    // Find RT with most residents
    const rtCounts = new Map<string, number>();
    data.forEach(p => {
      if (p.rt) {
        rtCounts.set(p.rt, (rtCounts.get(p.rt) || 0) + 1);
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

    return { total, lakiLakiCount, perempuanCount, rtTerbanyak, rtTerbanyakCount };
  }, [data]);

  // ─── Form Handlers ───────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData(emptyFormData);
    setSelectedPenduduk(null);
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setDialogMode('add');
    setNikDuplicate(null);
  }, [resetForm]);

  const openEditDialog = useCallback((penduduk: Penduduk) => {
    setSelectedPenduduk(penduduk);
    setNikDuplicate(null);
    setFormData({
      nik: penduduk.nik,
      nama: penduduk.nama,
      tempatLahir: penduduk.tempatLahir,
      tglLahir: penduduk.tglLahir,
      jenisKelamin: penduduk.jenisKelamin,
      agama: penduduk.agama,
      statusPerkawinan: penduduk.statusPerkawinan,
      pekerjaan: penduduk.pekerjaan,
      pendidikan: penduduk.pendidikan,
      alamat: penduduk.alamat,
      rt: penduduk.rt,
      rw: penduduk.rw,
      foto: penduduk.foto,
      createdAt: penduduk.createdAt,
      updatedAt: penduduk.updatedAt,
    });
    setDialogMode('edit');
  }, []);

  const openViewDialog = useCallback((penduduk: Penduduk) => {
    setSelectedPenduduk(penduduk);
    setDialogMode('view');
  }, []);

  const closeDialog = useCallback(() => {
    setDialogMode(null);
    setSelectedPenduduk(null);
    setCalendarOpen(false);
  }, []);

  const handleFormChange = useCallback(
    <K extends keyof Omit<Penduduk, 'id'>>(
      field: K,
      value: Omit<Penduduk, 'id'>[K]
    ) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Real-time NIK duplicate check
      if (field === 'nik') {
        setNikDuplicate(null);
        const nikVal = String(value).trim();
        if (nikVal.length === 16 && /^\d+$/.test(nikVal)) {
          setIsCheckingNik(true);
          (async () => {
            try {
              const existing = await db.penduduk.where('nik').equals(nikVal).first();
              if (existing && existing.id !== selectedPenduduk?.id) {
                setNikDuplicate({ nama: existing.nama });
              } else {
                setNikDuplicate(null);
              }
            } catch {
              setNikDuplicate(null);
            } finally {
              setIsCheckingNik(false);
            }
          })();
        }
      }
    },
    [selectedPenduduk]
  );

  const handleFotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar (JPG, PNG, dll.)');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        handleFormChange('foto', base64);
      };
      reader.onerror = () => {
        toast.error('Gagal membaca file');
      };
      reader.readAsDataURL(file);

      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [handleFormChange]
  );

  const removeFoto = useCallback(() => {
    handleFormChange('foto', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFormChange]);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        handleFormChange('tglLahir', format(date, 'yyyy-MM-dd'));
      }
      setCalendarOpen(false);
    },
    [handleFormChange]
  );

  const handleSubmit = useCallback(async () => {
    // Validate required fields
    if (!formData.nik.trim()) {
      toast.error('NIK wajib diisi');
      return;
    }
    if (formData.nik.length !== 16 || !/^\d+$/.test(formData.nik)) {
      toast.error('NIK harus berupa 16 digit angka');
      return;
    }

    // Check NIK duplicate
    const existingNik = await db.penduduk.where('nik').equals(formData.nik.trim()).first();
    if (existingNik && existingNik.id !== selectedPenduduk?.id) {
      toast.error(`NIK ${formData.nik} sudah terdaftar atas nama ${existingNik.nama}`);
      return;
    }

    if (!formData.nama.trim()) {
      toast.error('Nama wajib diisi');
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

    setIsSubmitting(true);
    try {
      if (dialogMode === 'edit' && selectedPenduduk?.id) {
        await db.penduduk.update(selectedPenduduk.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Data penduduk berhasil diperbarui');
      } else {
        await db.penduduk.add({
          ...formData,
          id: undefined as unknown as number,
        } as Penduduk);
        toast.success('Data penduduk berhasil ditambahkan');
      }
      closeDialog();
      loadData();
    } catch (error) {
      console.error('Failed to save penduduk:', error);
      toast.error('Gagal menyimpan data penduduk');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, dialogMode, selectedPenduduk, closeDialog, loadData]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      await db.penduduk.delete(deleteTarget.id);
      toast.success(`Data ${deleteTarget.nama} berhasil dihapus`);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete penduduk:', error);
      toast.error('Gagal menghapus data penduduk');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, loadData]);

  // ─── Date formatting helper ──────────────────────────────────────────────

  const formatTanggalLahir = (tgl: string) => {
    if (!tgl) return '-';
    try {
      return format(new Date(tgl), 'd MMMM yyyy', { locale: idLocale });
    } catch {
      return tgl;
    }
  };

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

  // ─── Penduduk Form ───────────────────────────────────────────────────────

  const renderForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
      {renderFormField('NIK', true, (
        <div className="space-y-1">
          <div className="relative">
            <Input
              value={formData.nik}
              onChange={e => handleFormChange('nik', e.target.value)}
              placeholder="16 digit NIK"
              maxLength={16}
              className={`h-9 pr-8 ${nikDuplicate ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
            />
            {isCheckingNik && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!isCheckingNik && formData.nik.length === 16 && !nikDuplicate && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            {!isCheckingNik && nikDuplicate && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            )}
          </div>
          {formData.nik.length > 0 && formData.nik.length < 16 && (
            <p className="text-[10px] text-muted-foreground">{formData.nik.length}/16 digit</p>
          )}
          {nikDuplicate && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              NIK sudah digunakan oleh <span className="font-semibold">{nikDuplicate.nama}</span>
            </p>
          )}
        </div>
      ))}

      {renderFormField('Nama Lengkap', true, (
        <Input
          value={formData.nama}
          onChange={e => handleFormChange('nama', e.target.value)}
          placeholder="Nama lengkap sesuai KTP"
          className="h-9"
        />
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
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 w-full justify-start text-left font-normal text-muted-foreground"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.tglLahir
                ? formatTanggalLahir(formData.tglLahir)
                : 'Pilih tanggal lahir'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                formData.tglLahir ? new Date(formData.tglLahir) : undefined
              }
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              fromYear={1930}
              toYear={new Date().getFullYear()}
              defaultMonth={
                formData.tglLahir ? new Date(formData.tglLahir) : undefined
              }
            />
          </PopoverContent>
        </Popover>
      ))}

      {renderFormField('Jenis Kelamin', false, (
        <Select
          value={formData.jenisKelamin}
          onValueChange={v =>
            handleFormChange(
              'jenisKelamin',
              v as 'Laki-laki' | 'Perempuan'
            )
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

      {renderFormField('Agama', false, (
        <Select
          value={formData.agama}
          onValueChange={v => handleFormChange('agama', v)}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGAMA_OPTIONS.map(a => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {renderFormField('Status Perkawinan', false, (
        <Select
          value={formData.statusPerkawinan}
          onValueChange={v => handleFormChange('statusPerkawinan', v)}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_KAWIN_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {renderFormField('Pekerjaan', false, (
        <Select
          value={formData.pekerjaan}
          onValueChange={v => handleFormChange('pekerjaan', v)}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PEKERJAAN_OPTIONS.map(p => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {renderFormField('Pendidikan Terakhir', false, (
        <Select
          value={formData.pendidikan}
          onValueChange={v => handleFormChange('pendidikan', v)}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PENDIDIKAN_OPTIONS.map(p => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

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

      {renderFormField('Alamat Lengkap', false, (
        <Textarea
          value={formData.alamat}
          onChange={e => handleFormChange('alamat', e.target.value)}
          placeholder="Alamat lengkap tempat tinggal"
          className="min-h-[60px] resize-none"
        />
      ), 2)}

      {renderFormField('Foto Penduduk', false, (
        <div className="flex items-start gap-3">
          {formData.foto ? (
            <div className="relative inline-block">
              <img
                src={formData.foto}
                alt="Foto penduduk"
                className="h-20 w-20 rounded-lg object-cover border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 size-5 rounded-full"
                onClick={removeFoto}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <div className="h-20 w-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
              <ImageIcon className="size-5 mb-1" />
              <span className="text-[10px]">Maks 2MB</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3 mr-1" />
              Pilih Foto
            </Button>
            <p className="text-[10px] text-muted-foreground">
              JPG, PNG. Maks 2MB
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  // ─── Detail View for Dialog ──────────────────────────────────────────────

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
          Data Penduduk
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola data kependudukan warga desa
        </p>
      </div>

      {/* ── Statistics Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Users className="size-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-emerald-700">
                  {isLoading ? '-' : stats.total}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Total Penduduk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <User className="size-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-blue-700">
                  {isLoading ? '-' : stats.lakiLakiCount}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Laki-laki
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                <UserCheck className="size-5 text-pink-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-pink-700">
                  {isLoading ? '-' : stats.perempuanCount}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Perempuan
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
                    <span className="ml-1">({stats.rtTerbanyakCount} orang)</span>
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
                placeholder="Cari NIK atau nama..."
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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={openAddDialog}
            >
              <Plus className="size-3.5 mr-1" />
              Tambah Penduduk
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled
                >
                  <FileSpreadsheet className="size-3.5 mr-1" />
                  Import Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent>Segera Hadir</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled
                >
                  <Download className="size-3.5 mr-1" />
                  Export Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent>Segera Hadir</TooltipContent>
            </Tooltip>

            {(searchQuery || filterRT || filterRW || filterJK) && (
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
                      <TableHead className="text-xs font-semibold min-w-[160px]">
                        NIK
                      </TableHead>
                      <TableHead className="text-xs font-semibold min-w-[180px]">
                        Nama
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center">
                        L/P
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center">
                        RT/RW
                      </TableHead>
                      <TableHead className="text-xs font-semibold min-w-[140px]">
                        Pekerjaan
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right sticky right-0 bg-muted/40">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.length > 0 ? (
                      pageData.map((penduduk, index) => (
                        <TableRow key={penduduk.id} className="group">
                          <TableCell className="text-xs text-center text-muted-foreground">
                            {(safeCurrentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {penduduk.nik}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {penduduk.nama}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold px-2 py-0.5 ${
                                penduduk.jenisKelamin === 'Laki-laki'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                  : 'bg-pink-100 text-pink-700 hover:bg-pink-100'
                              }`}
                            >
                              {penduduk.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {penduduk.rt && penduduk.rw
                              ? `${penduduk.rt}/${penduduk.rw}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {penduduk.pekerjaan || '-'}
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-background group-hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-emerald-600"
                                onClick={() => openViewDialog(penduduk)}
                                title="Lihat detail"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-blue-600"
                                onClick={() => openEditDialog(penduduk)}
                                title="Edit"
                              >
                                <Edit className="size-3.5" />
                              </Button>
                              <AlertDialog
                                open={deleteTarget?.id === penduduk.id}
                                onOpenChange={open => {
                                  if (!open) setDeleteTarget(null);
                                  else setDeleteTarget(penduduk);
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
                                          penduduk berikut?
                                        </p>
                                        <div className="rounded-md bg-muted p-3 space-y-1">
                                          <p className="text-sm font-semibold">
                                            {penduduk.nama}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            NIK: {penduduk.nik}
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
                        <TableCell colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Users className="size-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium">
                              Tidak ada data yang ditemukan
                            </p>
                            <p className="text-xs mt-1">
                              {searchQuery || filterRT || filterRW || filterJK
                                ? 'Coba ubah filter pencarian Anda'
                                : 'Belum ada data penduduk yang terdaftar'}
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
                          // Show first, last, and pages around current
                          if (totalPages <= 5) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (
                            Math.abs(page - safeCurrentPage) <= 1
                          )
                            return true;
                          return false;
                        })
                        .map((page, idx, arr) => {
                          const prev = arr[idx - 1];
                          const showEllipsis = prev && page - prev > 1;

                          return (
                            <span key={page} className="contents">
                              {showEllipsis && (
                                <span className="text-xs text-muted-foreground px-1">
                                  ...
                                </span>
                              )}
                              <Button
                                key={page}
                                variant={
                                  safeCurrentPage === page ? 'default' : 'outline'
                                }
                                size="sm"
                                className={`h-7 w-7 p-0 text-xs ${
                                  safeCurrentPage === page
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : ''
                                }`}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </span>
                          );
                        })}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add'
                ? 'Tambah Penduduk Baru'
                : 'Edit Data Penduduk'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'add'
                ? 'Isi data penduduk baru dengan lengkap dan benar.'
                : 'Perbarui data penduduk yang sudah terdaftar.'}
            </DialogDescription>
          </DialogHeader>

          {renderForm()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Menyimpan...
                </>
              ) : dialogMode === 'add' ? (
                <>
                  <Plus className="size-4 mr-1" />
                  Simpan
                </>
              ) : (
                <>
                  <Edit className="size-4 mr-1" />
                  Simpan Perubahan
                </>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Penduduk</DialogTitle>
            <DialogDescription>
              Informasi lengkap data kependudukan
            </DialogDescription>
          </DialogHeader>

          {selectedPenduduk && (
            <div className="space-y-4">
              {/* Photo & Identity Section */}
              <Card className="border shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {selectedPenduduk.foto ? (
                      <img
                        src={selectedPenduduk.foto}
                        alt={selectedPenduduk.nama}
                        className="w-20 h-24 rounded-lg object-cover border shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-24 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0">
                        <User className="size-8 text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground mt-1">
                          No Photo
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">NIK</p>
                        <p className="text-sm font-mono font-semibold">
                          {selectedPenduduk.nik}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nama</p>
                        <p className="text-base font-bold">
                          {selectedPenduduk.nama}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card className="border shadow-none">
                <CardHeader className="py-3 px-4 pb-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Data Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Tempat, Tanggal Lahir
                      </p>
                      <p className="text-sm font-medium">
                        {selectedPenduduk.tempatLahir},{' '}
                        {formatTanggalLahir(selectedPenduduk.tglLahir)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Jenis Kelamin
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold mt-0.5 ${
                          selectedPenduduk.jenisKelamin === 'Laki-laki'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {selectedPenduduk.jenisKelamin}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Agama
                      </p>
                      <p className="text-sm font-medium">
                        {selectedPenduduk.agama}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Status Perkawinan
                      </p>
                      <p className="text-sm font-medium">
                        {selectedPenduduk.statusPerkawinan}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Education & Employment */}
              <Card className="border shadow-none">
                <CardHeader className="py-3 px-4 pb-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pendidikan & Pekerjaan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Pendidikan Terakhir
                      </p>
                      <p className="text-sm font-medium">
                        {selectedPenduduk.pendidikan || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Pekerjaan
                      </p>
                      <p className="text-sm font-medium">
                        {selectedPenduduk.pekerjaan || '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card className="border shadow-none">
                <CardHeader className="py-3 px-4 pb-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Alamat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm font-medium">
                    {selectedPenduduk.alamat || '-'}
                  </p>
                  {(selectedPenduduk.rt || selectedPenduduk.rw) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      RT {selectedPenduduk.rt || '-'}/RW{' '}
                      {selectedPenduduk.rw || '-'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Tutup
            </Button>
            {selectedPenduduk && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  const p = selectedPenduduk;
                  closeDialog();
                  // Small delay to prevent dialog overlap
                  setTimeout(() => openEditDialog(p), 100);
                }}
              >
                <Edit className="size-4 mr-1" />
                Edit Data
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
