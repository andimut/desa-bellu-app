'use client';

import { useEffect, useMemo, useState } from 'react';
import db from '@/lib/db';
import { JENIS_SURAT } from '@/lib/types';
import type { Surat, StatusSurat } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Eye,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Printer,
  QrCode,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  Check,
  ClipboardList,
  Save,
  ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const STATUS_FLOW: StatusSurat[] = ['draft', 'diproses', 'selesai', 'dicetak'];

const STATUS_CONFIG: Record<
  StatusSurat,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'Draft',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FileText className="size-3" />,
  },
  diproses: {
    label: 'Diproses',
    badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <Clock className="size-3" />,
  },
  selesai: {
    label: 'Selesai',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <CheckCircle2 className="size-3" />,
  },
  dicetak: {
    label: 'Dicetak',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <Printer className="size-3" />,
  },
};

/** Extract a short code from a letter-type name for QR data. */
function getShortCode(jenis: string): string {
  const map: Record<string, string> = {
    'Surat Pengantar KTP': 'KTP',
    'Surat Pengantar KK': 'KK',
    'Surat Keterangan Domisili': 'DOM',
    'Surat Keterangan Tidak Mampu (SKTM)': 'SKTM',
    'Surat Keterangan Usaha (SKU)': 'SKU',
    'Surat Keterangan Pindah': 'PNDH',
    'Surat Keterangan Lahir': 'LAHR',
    'Surat Keterangan Kematian': 'MNGG',
    'Surat Keterangan Belum Menikah': 'BMNK',
    'Surat Keterangan Penghasilan': 'PHSL',
    'Surat Pengantar SKCK': 'SKCK',
    'Surat Keterangan RT/RW': 'RTRW',
    'Surat Keterangan Bebas Narkoba': 'NARK',
    'Surat Keterangan Orang Tua': 'ORTU',
    'Surat Keterangan Waris': 'WRIS',
    'Surat Keterangan Tanah': 'TNH',
    'Surat Izin Keramaian': 'KRMN',
    'Surat Izin Usaha Mikro': 'IUMK',
    'Surat Keterangan Jamkesos': 'JMSO',
    'Surat Rekomendasi Bantuan': 'RKB',
  };
  return map[jenis] ?? jenis.slice(0, 4).toUpperCase();
}

/** Generate a nomor surat based on the village profile format. */
function generateNomorSurat(villageProfile: { formatNomorSurat: string }, counter: number): string {
  const now = new Date();
  const romawiMonths = [
    '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
  ];
  let nomor = villageProfile.formatNomorSurat;
  nomor = nomor.replace('MM', romawiMonths[now.getMonth() + 1]);
  nomor = nomor.replace('YYYY', String(now.getFullYear()));
  // Replace the leading number with the actual counter
  const padded = String(counter).padStart(3, '0');
  nomor = nomor.replace(/^\d+/, padded);
  return nomor;
}

/** Parse the sequence number from an existing nomor surat (first 3 digits). */
function parseSequenceFromNomor(nomor: string): number {
  const match = nomor.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Build the next nomor surat by querying the last one in the same month/year. */
async function buildNextNomorSurat(
  villageProfile: { formatNomorSurat: string },
  tanggalSurat?: string,
): Promise<string> {
  const refDate = tanggalSurat ? new Date(tanggalSurat) : new Date();
  const romawiMonths = [
    '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
  ];
  const bulanRomawi = romawiMonths[refDate.getMonth() + 1];
  const tahun = String(refDate.getFullYear());

  // Find surat with matching MM & YYYY in their nomorSurat
  const allSurat = await db.surat.toArray();
  let maxSeq = 0;
  for (const s of allSurat) {
    if (
      s.nomorSurat.includes(bulanRomawi) &&
      s.nomorSurat.includes(tahun)
    ) {
      const seq = parseSequenceFromNomor(s.nomorSurat);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextCounter = maxSeq + 1;
  let nomor = villageProfile.formatNomorSurat;
  nomor = nomor.replace('MM', bulanRomawi);
  nomor = nomor.replace('YYYY', tahun);
  const padded = String(nextCounter).padStart(3, '0');
  nomor = nomor.replace(/^\d+/, padded);
  return nomor;
}

/** NIK validation — must be exactly 16 digits. */
function isValidNik(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FormData {
  namaPenerima: string;
  nikPenerima: string;
  tanggalSurat: string;
  isiSurat: string;
}

const EMPTY_FORM: FormData = {
  namaPenerima: '',
  nikPenerima: '',
  tanggalSurat: new Date().toISOString().split('T')[0],
  isiSurat: '',
};

type CreateStep = 1 | 2 | 3;

export function SuratPage() {
  const villageProfile = useAppStore((s) => s.villageProfile);
  const navigate = useAppStore((s) => s.navigate);
  const setSuratToPrint = useAppStore((s) => s.setSuratToPrint);

  // ---- Data state ----
  const [suratList, setSuratList] = useState<Surat[]>([]);
  const [suratCounts, setSuratCounts] = useState<Record<string, number>>({});

  // ---- Create dialog ----
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>(2);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [generatedQr, setGeneratedQr] = useState('');
  const [previewNomorSurat, setPreviewNomorSurat] = useState('');
  const [isGeneratingNomor, setIsGeneratingNomor] = useState(false);

  // ---- View dialog ----
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSurat, setViewSurat] = useState<Surat | null>(null);

  // ---- Delete confirmation ----
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Surat | null>(null);

  // ---- Filters ----
  const [filterJenis, setFilterJenis] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Data loading ----
  const loadSuratData = async () => {
    try {
      const allSurat = await db.surat.toArray();
      setSuratList(allSurat);

      const counts: Record<string, number> = {};
      for (const jenis of JENIS_SURAT) {
        counts[jenis] = 0;
      }
      allSurat.forEach((s) => {
        counts[s.jenisSurat] = (counts[s.jenisSurat] || 0) + 1;
      });
      setSuratCounts(counts);
    } catch (err) {
      console.error('Failed to load surat data:', err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allSurat = await db.surat.toArray();
      if (cancelled) return;
      setSuratList(allSurat);

      const counts: Record<string, number> = {};
      for (const jenis of JENIS_SURAT) {
        counts[jenis] = 0;
      }
      allSurat.forEach((s) => {
        counts[s.jenisSurat] = (counts[s.jenisSurat] || 0) + 1;
      });
      setSuratCounts(counts);
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Filtered list ----
  const filteredSurat = useMemo(() => {
    let list = [...suratList].reverse();
    if (filterJenis !== 'all') {
      list = list.filter((s) => s.jenisSurat === filterJenis);
    }
    if (filterStatus !== 'all') {
      list = list.filter((s) => s.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.nomorSurat.toLowerCase().includes(q) ||
          s.namaPenerima.toLowerCase().includes(q) ||
          s.jenisSurat.toLowerCase().includes(q) ||
          s.nikPenerima.includes(q),
      );
    }
    return list;
  }, [suratList, filterJenis, filterStatus, searchQuery]);

  // ---- Form helpers ----
  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.namaPenerima.trim()) errors.namaPenerima = 'Nama penerima wajib diisi';
    if (!formData.nikPenerima.trim()) {
      errors.nikPenerima = 'NIK wajib diisi';
    } else if (!isValidNik(formData.nikPenerima.trim())) {
      errors.nikPenerima = 'NIK harus 16 digit angka';
    }
    if (!formData.tanggalSurat) errors.tanggalSurat = 'Tanggal surat wajib diisi';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---- Step navigation for create flow ----
  const handleSelectType = (jenis: string) => {
    setSelectedType(jenis);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setCreateStep(2);
    setCreateOpen(true);
  };

  const handleNextToPreview = async () => {
    if (!validateForm()) return;
    const qrData = `SUR-${Date.now()}-${getShortCode(selectedType)}`;
    setGeneratedQr(qrData);

    // Auto-generate nomor surat based on tanggal surat & last surat in DB
    setIsGeneratingNomor(true);
    try {
      let nomor = 'Memuat...';
      setPreviewNomorSurat(nomor);
      if (villageProfile) {
        nomor = await buildNextNomorSurat(villageProfile, formData.tanggalSurat);
      } else {
        const all = await db.surat.toArray();
        nomor = `070/DES/${String(all.length + 1).padStart(3, '0')}/${['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][new Date(formData.tanggalSurat).getMonth() + 1]}/${new Date(formData.tanggalSurat).getFullYear()}`;
      }
      setPreviewNomorSurat(nomor);
    } catch {
      setPreviewNomorSurat('Gagal generate nomor');
    } finally {
      setIsGeneratingNomor(false);
    }

    setCreateStep(3);
  };

  const handleBackToForm = () => setCreateStep(2);

  const handleSaveSurat = async () => {
    try {
      // Use the already-generated preview nomor surat, or regenerate as fallback
      let nomorSurat = previewNomorSurat;
      if (!nomorSurat || nomorSurat === 'Memuat...' || nomorSurat === 'Gagal generate nomor') {
        if (villageProfile) {
          nomorSurat = await buildNextNomorSurat(villageProfile, formData.tanggalSurat);
        } else {
          const counter = suratList.length + 1;
          nomorSurat = `070/DES/${String(counter).padStart(3, '0')}/IV/2026`;
        }
      }

      const newSurat: Omit<Surat, 'id'> = {
        jenisSurat: selectedType,
        nomorSurat,
        penerimaId: 0,
        namaPenerima: formData.namaPenerima.trim(),
        nikPenerima: formData.nikPenerima.trim(),
        tanggalSurat: formData.tanggalSurat,
        isiSurat: formData.isiSurat.trim() || `Surat ${selectedType} untuk ${formData.namaPenerima.trim()}`,
        status: 'draft',
        qrCodeData: generatedQr,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const id = await db.surat.add(newSurat as Surat);
      toast.success(`Surat berhasil dibuat — No. ${nomorSurat}`);
      setCreateOpen(false);
      setSelectedType('');
      setCreateStep(2);
      setFormData(EMPTY_FORM);
      setFormErrors({});
      setPreviewNomorSurat('');

      await loadSuratData();

      const created = await db.surat.get(id);
      if (created) {
        setViewSurat(created);
        setViewOpen(true);
      }
    } catch {
      toast.error('Gagal membuat surat');
    }
  };

  // ---- Status update ----
  const getNextStatus = (current: StatusSurat): StatusSurat | null => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const handleUpdateStatus = async (surat: Surat, newStatus: StatusSurat) => {
    try {
      await db.surat.update(surat.id!, { status: newStatus, updatedAt: new Date().toISOString() });
      toast.success(`Status surat diubah ke "${STATUS_CONFIG[newStatus].label}"`);
      await loadSuratData();
      if (viewSurat?.id === surat.id) {
        const updated = await db.surat.get(surat.id);
        if (updated) setViewSurat(updated);
      }
    } catch {
      toast.error('Gagal mengubah status surat');
    }
  };

  // ---- Delete ----
  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await db.surat.delete(deleteTarget.id);
      toast.success('Surat berhasil dihapus');
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadSuratData();
      if (viewSurat?.id === deleteTarget.id) {
        setViewOpen(false);
        setViewSurat(null);
      }
    } catch {
      toast.error('Gagal menghapus surat');
    }
  };

  // ---- Status step index helper ----
  const statusIndex = (s: StatusSurat) => STATUS_FLOW.indexOf(s);

  // ---- Print handler ----
  const handlePrintSurat = (surat: Surat) => {
    setSuratToPrint(surat);
    navigate('cetak-surat');
  };

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Section: Letter Type Grid                                         */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="size-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Jenis Surat</h2>
          <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            {JENIS_SURAT.length} jenis
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {JENIS_SURAT.map((jenis) => {
            const count = suratCounts[jenis] || 0;
            return (
              <Card
                key={jenis}
                className="group cursor-pointer border-gray-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-50 transition-all duration-200"
                onClick={() => handleSelectType(jenis)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className="rounded-lg bg-emerald-50 p-2.5 group-hover:bg-emerald-100 transition-colors">
                    <FileText className="size-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-800 leading-tight line-clamp-2">
                    {jenis}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-gray-500"
                  >
                    {count} surat
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Filters + Letter List Table                              */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Daftar Surat</h2>
            <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              {filteredSurat.length} surat
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari surat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 w-full sm:w-56 text-xs"
              />
            </div>

            {/* Filter: Jenis Surat */}
            <Select value={filterJenis} onValueChange={setFilterJenis}>
              <SelectTrigger className="h-8 w-full sm:w-52 text-xs">
                <Filter className="size-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Jenis Surat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis Surat</SelectItem>
                {JENIS_SURAT.map((j) => (
                  <SelectItem key={j} value={j} className="text-xs">
                    {j}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter: Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-full sm:w-36 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_FLOW.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card className="border-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="w-10 text-xs font-semibold">No</TableHead>
                    <TableHead className="text-xs font-semibold">No. Surat</TableHead>
                    <TableHead className="text-xs font-semibold">Jenis Surat</TableHead>
                    <TableHead className="text-xs font-semibold">Penerima</TableHead>
                    <TableHead className="text-xs font-semibold">Tanggal</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurat.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                        <FileText className="size-8 mx-auto mb-2 text-gray-300" />
                        Belum ada surat yang dibuat
                      </TableCell>
                    </TableRow>
                  )}

                  {filteredSurat.map((s, i) => {
                    const nextStatus = getNextStatus(s.status);
                    return (
                      <TableRow key={s.id} className="group">
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-xs font-mono font-medium">{s.nomorSurat}</TableCell>
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">{s.jenisSurat}</TableCell>
                        <TableCell>
                          <div className="text-xs font-medium">{s.namaPenerima}</div>
                          <div className="text-[10px] text-muted-foreground">{s.nikPenerima}</div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(s.tanggalSurat).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${STATUS_CONFIG[s.status].badgeClass}`}
                          >
                            {STATUS_CONFIG[s.status].icon}
                            {STATUS_CONFIG[s.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7">
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewSurat(s);
                                  setViewOpen(true);
                                }}
                              >
                                <Eye className="size-3.5 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handlePrintSurat(s)}
                              >
                                <Printer className="size-3.5 mr-2" />
                                Cetak Surat
                              </DropdownMenuItem>

                              {nextStatus && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(s, nextStatus)}
                                  >
                                    <ChevronRight className="size-3.5 mr-2" />
                                    Ubah ke &ldquo;{STATUS_CONFIG[nextStatus].label}&rdquo;
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  setDeleteTarget(s);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Scrollable container for long lists */}
            {filteredSurat.length > 10 && (
              <div className="border-t px-4 py-2 bg-gray-50/50">
                <p className="text-[10px] text-muted-foreground text-center">
                  Menampilkan {filteredSurat.length} dari {suratList.length} surat
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Dialog: Create Letter (multi-step)                               */}
      {/* ----------------------------------------------------------------- */}
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          if (!v) {
            setCreateOpen(false);
            setSelectedType('');
            setCreateStep(2);
            setFormData(EMPTY_FORM);
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1 pt-1 pb-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={`flex items-center justify-center size-7 rounded-full text-xs font-bold transition-colors ${
                    createStep >= step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {createStep > step ? <Check className="size-3.5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-10 h-0.5 transition-colors ${
                      createStep > step ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-emerald-600" />
              {createStep === 2 && 'Isi Data Surat'}
              {createStep === 3 && 'Preview Surat'}
            </DialogTitle>
            <DialogDescription>
              {createStep === 2 && (
                <>
                  <span className="font-medium text-emerald-700">{selectedType}</span> — Lengkapi formulir berikut
                </>
              )}
              {createStep === 3 && 'Periksa kembali data surat sebelum menyimpan'}
            </DialogDescription>
          </DialogHeader>

          {/* ---- Step 2: Form ---- */}
          {createStep === 2 && (
            <div className="space-y-4">
              {/* Selected type banner */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <FileText className="size-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">{selectedType}</p>
                  <p className="text-xs text-emerald-600">Isi formulir di bawah untuk melanjutkan</p>
                </div>
              </div>

              {/* Nama Penerima */}
              <div className="space-y-1.5">
                <Label htmlFor="namaPenerima" className="text-xs font-medium">
                  Nama Penerima <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="namaPenerima"
                  placeholder="Masukkan nama lengkap penerima"
                  value={formData.namaPenerima}
                  onChange={(e) => updateField('namaPenerima', e.target.value)}
                  className={`h-9 text-sm ${formErrors.namaPenerima ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                />
                {formErrors.namaPenerima && (
                  <p className="text-[11px] text-red-500">{formErrors.namaPenerima}</p>
                )}
              </div>

              {/* NIK Penerima */}
              <div className="space-y-1.5">
                <Label htmlFor="nikPenerima" className="text-xs font-medium">
                  NIK Penerima <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nikPenerima"
                  placeholder="Masukkan 16 digit NIK"
                  maxLength={16}
                  value={formData.nikPenerima}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    updateField('nikPenerima', val);
                  }}
                  className={`h-9 text-sm font-mono ${formErrors.nikPenerima ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                />
                {formErrors.nikPenerima ? (
                  <p className="text-[11px] text-red-500">{formErrors.nikPenerima}</p>
                ) : (
                  formData.nikPenerima.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {formData.nikPenerima.length}/16 digit
                    </p>
                  )
                )}
              </div>

              {/* Tanggal Surat */}
              <div className="space-y-1.5">
                <Label htmlFor="tanggalSurat" className="text-xs font-medium">
                  Tanggal Surat <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tanggalSurat"
                  type="date"
                  value={formData.tanggalSurat}
                  onChange={(e) => updateField('tanggalSurat', e.target.value)}
                  className={`h-9 text-sm ${formErrors.tanggalSurat ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                />
                {formErrors.tanggalSurat && (
                  <p className="text-[11px] text-red-500">{formErrors.tanggalSurat}</p>
                )}
              </div>

              {/* Isi Surat / Keterangan */}
              <div className="space-y-1.5">
                <Label htmlFor="isiSurat" className="text-xs font-medium">
                  Keterangan / Isi Surat
                </Label>
                <Textarea
                  id="isiSurat"
                  placeholder="Tuliskan keterangan atau isi surat..."
                  value={formData.isiSurat}
                  onChange={(e) => updateField('isiSurat', e.target.value)}
                  className="min-h-[100px] text-sm"
                />
              </div>
            </div>
          )}

          {/* ---- Step 3: Preview ---- */}
          {createStep === 3 && (
            <div className="space-y-4">
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-emerald-600 text-white p-2.5 mt-0.5">
                      <FileText className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{selectedType}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Nomor surat di-generate otomatis berdasarkan format di Pengaturan
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-emerald-100 pt-3 space-y-2.5">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-emerald-100/60 rounded-lg p-3 border border-emerald-200">
                        <p className="text-[11px] font-medium text-emerald-700 mb-1">Nomor Surat (Otomatis)</p>
                        {isGeneratingNomor ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-mono font-semibold text-emerald-800">Generate nomor...</span>
                          </div>
                        ) : (
                          <p className="text-sm font-mono font-bold text-emerald-900">{previewNomorSurat}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <PreviewField label="Nama Penerima" value={formData.namaPenerima} />
                      <PreviewField label="NIK Penerima" value={formData.nikPenerima} mono />
                    </div>
                    <PreviewField
                      label="Tanggal Surat"
                      value={new Date(formData.tanggalSurat).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    />
                    <PreviewField
                      label="Keterangan"
                      value={
                        formData.isiSurat.trim() ||
                        `Surat ${selectedType} untuk ${formData.namaPenerima.trim()}`
                      }
                    />
                    <PreviewField label="Status Awal" value="Draft" />
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center pt-2">
                    <div className="border-2 border-dashed border-emerald-200 rounded-xl p-3 bg-white">
                      <QRCodeSVG value={generatedQr} size={120} level="M" />
                      <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
                        {generatedQr}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            {createStep === 2 && (
              <>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Batal
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleNextToPreview}
                >
                  Preview <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </>
            )}

            {createStep === 3 && (
              <>
                <Button variant="outline" onClick={handleBackToForm}>
                  <ArrowLeft className="size-3.5 mr-1" /> Kembali
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSaveSurat}
                >
                  <Save className="size-3.5 mr-1" /> Simpan Surat
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Dialog: View Letter Detail                                        */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={viewOpen} onOpenChange={(v) => { if (!v) setViewOpen(false); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-5 text-emerald-600" />
              Detail Surat
            </DialogTitle>
            <DialogDescription>
              {viewSurat?.nomorSurat}
            </DialogDescription>
          </DialogHeader>

          {viewSurat && (
            <div className="space-y-5">
              {/* ---- Status Progress Bar ---- */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Progress Status</p>
                <div className="flex items-center gap-0 w-full">
                  {STATUS_FLOW.map((status, idx) => {
                    const isActive = statusIndex(viewSurat.status) >= idx;
                    const isCurrent = viewSurat.status === status;

                    return (
                      <div key={status} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className={`flex items-center justify-center size-8 rounded-full border-2 transition-all ${
                              isActive
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200'
                                : 'bg-white border-gray-200 text-gray-400'
                            } ${isCurrent ? 'ring-2 ring-emerald-300 ring-offset-2' : ''}`}
                          >
                            {isActive && !isCurrent ? (
                              <Check className="size-4" />
                            ) : (
                              STATUS_CONFIG[status].icon
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-medium whitespace-nowrap ${
                              isActive ? 'text-emerald-700' : 'text-gray-400'
                            }`}
                          >
                            {STATUS_CONFIG[status].label}
                          </span>
                        </div>
                        {idx < STATUS_FLOW.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-1 rounded transition-colors ${
                              statusIndex(viewSurat.status) > idx
                                ? 'bg-emerald-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ---- Letter Info Card ---- */}
              <Card className="border-gray-200">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label="Nomor Surat" value={viewSurat.nomorSurat} mono />
                    <InfoField
                      label="Tanggal Surat"
                      value={new Date(viewSurat.tanggalSurat).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    />
                    <InfoField label="Jenis Surat" value={viewSurat.jenisSurat} />
                    <InfoField label="Penerima" value={viewSurat.namaPenerima} />
                    <InfoField label="NIK Penerima" value={viewSurat.nikPenerima} mono />
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1">Status</p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${STATUS_CONFIG[viewSurat.status].badgeClass}`}
                      >
                        {STATUS_CONFIG[viewSurat.status].icon}
                        {STATUS_CONFIG[viewSurat.status].label}
                      </Badge>
                    </div>
                    <div className="sm:col-span-2">
                      <InfoField label="Keterangan / Isi Surat" value={viewSurat.isiSurat} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ---- QR Code ---- */}
              {viewSurat.qrCodeData && (
                <div className="flex justify-center">
                  <div className="border-2 border-gray-200 rounded-xl p-4 bg-white">
                    <QRCodeSVG value={viewSurat.qrCodeData} size={140} level="M" />
                    <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
                      {viewSurat.qrCodeData}
                    </p>
                    <p className="text-[10px] text-muted-foreground text-center">
                      QR Code Verifikasi
                    </p>
                  </div>
                </div>
              )}

              {/* ---- Action Buttons ---- */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handlePrintSurat(viewSurat)}
                >
                  <Printer className="size-3.5 mr-1" />
                  Cetak Surat
                </Button>

                {getNextStatus(viewSurat.status) && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleUpdateStatus(viewSurat, getNextStatus(viewSurat.status)!)}
                  >
                    <ArrowRight className="size-3.5 mr-1" />
                    Ubah ke &ldquo;{STATUS_CONFIG[getNextStatus(viewSurat.status)!].label}&rdquo;
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setDeleteTarget(viewSurat);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="size-3.5 mr-1" />
                  Hapus
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Dialog: Delete Confirmation                                       */}
      {/* ----------------------------------------------------------------- */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Surat?</AlertDialogTitle>
            <AlertDialogDescription>
              Surat <span className="font-semibold">{deleteTarget?.nomorSurat}</span> untuk{' '}
              <span className="font-semibold">{deleteTarget?.namaPenerima}</span> akan dihapus secara
              permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small sub-components
// ---------------------------------------------------------------------------

function PreviewField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function InfoField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
