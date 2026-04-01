'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '@/lib/db';
import type { Pengumuman } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Megaphone,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  FileCheck,
  FilePen,
  CalendarDays,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Send,
  Undo2,
  Newspaper,
  Lightbulb,
  PartyPopper,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 6;

const KATEGORI_OPTIONS: { value: Pengumuman['kategori']; label: string }[] = [
  { value: 'pengumuman', label: 'Pengumuman' },
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'berita', label: 'Berita' },
  { value: 'tips', label: 'Tips' },
];

const STATUS_OPTIONS: { value: Pengumuman['status']; label: string }[] = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const KATEGORI_STYLES: Record<
  Pengumuman['kategori'],
  { bg: string; text: string; border: string; icon: typeof Megaphone }
> = {
  pengumuman: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Megaphone,
  },
  kegiatan: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: PartyPopper,
  },
  berita: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Newspaper,
  },
  tips: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Lightbulb,
  },
};

const emptyForm = {
  judul: '',
  kategori: 'pengumuman' as Pengumuman['kategori'],
  isi: '',
  tanggalPublish: new Date().toISOString().split('T')[0],
  status: 'draft' as Pengumuman['status'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateIndo(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PengumumanPage() {
  // ─── State: Data ──────────────────────────────────────────────────────────
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── State: Filters ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');

  // ─── State: Pagination ───────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ─── State: Dialogs ──────────────────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ─── State: Selected / Forms ─────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<Pengumuman | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pengumuman | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  // ─── Data Loading ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const data = await db.pengumuman
        .orderBy('tanggalPublish')
        .reverse()
        .toArray();
      setPengumumanList(data);
    } catch (error) {
      console.error('Failed to load pengumuman data:', error);
      toast.error('Gagal memuat data pengumuman');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKategori, filterStatus]);

  // ─── Computed Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const total = pengumumanList.length;
    const published = pengumumanList.filter((p) => p.status === 'published').length;
    const draft = pengumumanList.filter((p) => p.status === 'draft').length;
    const thisMonth = pengumumanList.filter((p) => {
      const d = new Date(p.tanggalPublish);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    return { total, published, draft, thisMonth };
  }, [pengumumanList]);

  // ─── Filtered & Paginated Data ───────────────────────────────────────────
  const filteredList = useMemo(() => {
    return pengumumanList.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.judul.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKategori =
        filterKategori === 'semua' || item.kategori === filterKategori;
      const matchStatus =
        filterStatus === 'semua' || item.status === filterStatus;
      return matchSearch && matchKategori && matchStatus;
    });
  }, [pengumumanList, searchQuery, filterKategori, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  // ─── Stats Cards Data ────────────────────────────────────────────────────
  const statsCards = [
    {
      title: 'Total Pengumuman',
      value: stats.total,
      icon: <Megaphone className="w-5 h-5" />,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
    },
    {
      title: 'Published',
      value: stats.published,
      icon: <FileCheck className="w-5 h-5" />,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    {
      title: 'Draft',
      value: stats.draft,
      icon: <FilePen className="w-5 h-5" />,
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-200',
    },
    {
      title: 'Bulan Ini',
      value: stats.thisMonth,
      icon: <CalendarDays className="w-5 h-5" />,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
    },
  ];

  // ─── CRUD Handlers ───────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      ...emptyForm,
      tanggalPublish: new Date().toISOString().split('T')[0],
    });
    setShowAddDialog(true);
  };

  const handleOpenEdit = (item: Pengumuman) => {
    setIsEditing(true);
    setFormData({
      judul: item.judul,
      kategori: item.kategori,
      isi: item.isi,
      tanggalPublish: item.tanggalPublish,
      status: item.status,
    });
    setSelectedItem(item);
    setShowEditDialog(true);
  };

  const handleOpenView = (item: Pengumuman) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  const handleOpenDelete = (item: Pengumuman) => {
    setDeleteTarget(item);
    setShowDeleteDialog(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.judul.trim()) {
      toast.error('Judul tidak boleh kosong');
      return;
    }
    if (!formData.isi.trim()) {
      toast.error('Isi pengumuman tidak boleh kosong');
      return;
    }
    try {
      const item: Omit<Pengumuman, 'id'> = {
        judul: formData.judul.trim(),
        kategori: formData.kategori,
        isi: formData.isi.trim(),
        gambar: '',
        tanggalPublish: formData.tanggalPublish,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };
      await db.pengumuman.add(item as Pengumuman);
      toast.success('Pengumuman berhasil ditambahkan');
      setShowAddDialog(false);
      setFormData(emptyForm);
      loadData();
    } catch {
      toast.error('Gagal menambahkan pengumuman');
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedItem) return;
    if (!formData.judul.trim()) {
      toast.error('Judul tidak boleh kosong');
      return;
    }
    if (!formData.isi.trim()) {
      toast.error('Isi pengumuman tidak boleh kosong');
      return;
    }
    try {
      await db.pengumuman.update(selectedItem.id!, {
        judul: formData.judul.trim(),
        kategori: formData.kategori,
        isi: formData.isi.trim(),
        tanggalPublish: formData.tanggalPublish,
        status: formData.status,
      });
      toast.success('Pengumuman berhasil diperbarui');
      setShowEditDialog(false);
      setSelectedItem(null);
      setFormData(emptyForm);
      loadData();
    } catch {
      toast.error('Gagal memperbarui pengumuman');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await db.pengumuman.delete(deleteTarget.id!);
      toast.success('Pengumuman berhasil dihapus');
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error('Gagal menghapus pengumuman');
    }
  };

  const handleToggleStatus = async (item: Pengumuman) => {
    try {
      const newStatus = item.status === 'published' ? 'draft' : 'published';
      await db.pengumuman.update(item.id!, { status: newStatus });
      toast.success(
        newStatus === 'published'
          ? 'Pengumuman berhasil dipublikasikan'
          : 'Pengumuman diset ke draft'
      );
      loadData();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  // ─── Pagination Helpers ──────────────────────────────────────────────────
  const getPaginationNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat data pengumuman...</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-emerald-600" />
              Pengumuman & Berita
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola pengumuman, kegiatan, berita, dan tips untuk warga desa
            </p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengumuman
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 font-medium">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl ${card.bg} ${card.text} border ${card.border}`}
                  >
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari judul pengumuman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Filter Kategori */}
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kategori</SelectItem>
                  {KATEGORI_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Filter Status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Status</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pengumuman Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {paginatedList.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Megaphone className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600">
                  Belum Ada Pengumuman
                </h3>
                <p className="text-sm text-gray-400 mt-1 max-w-sm">
                  {searchQuery || filterKategori !== 'semua' || filterStatus !== 'semua'
                    ? 'Tidak ada pengumuman yang sesuai dengan filter. Coba ubah pencarian atau filter Anda.'
                    : 'Mulai buat pengumuman pertama untuk warga desa Anda.'}
                </p>
                {!searchQuery && filterKategori === 'semua' && filterStatus === 'semua' && (
                  <Button
                    onClick={handleOpenAdd}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Buat Pengumuman
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {paginatedList.map((item, idx) => {
                  const katStyle = KATEGORI_STYLES[item.kategori];
                  const KatIcon = katStyle.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-all duration-200 group border border-gray-100 hover:border-emerald-200">
                        <CardContent className="p-5 flex flex-col h-full">
                          {/* Top: Kategori Badge + Status */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <Badge
                              variant="outline"
                              className={`${katStyle.bg} ${katStyle.text} ${katStyle.border} text-xs flex items-center gap-1`}
                            >
                              <KatIcon className="w-3 h-3" />
                              {item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                item.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-gray-50 text-gray-500 border-gray-200'
                              }`}
                            >
                              {item.status === 'published' ? (
                                <>
                                  <FileCheck className="w-3 h-3 mr-0.5" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <FilePen className="w-3 h-3 mr-0.5" />
                                  Draft
                                </>
                              )}
                            </Badge>
                          </div>

                          {/* Judul */}
                          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                            {item.judul}
                          </h3>

                          {/* Preview Isi */}
                          <p className="text-sm text-gray-500 line-clamp-3 flex-1 mb-4 leading-relaxed">
                            {item.isi}
                          </p>

                          {/* Date */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{formatDateShort(item.tanggalPublish)}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleOpenView(item)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Lihat
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <div className="flex-1" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(item)}
                                >
                                  {item.status === 'published' ? (
                                    <>
                                      <Undo2 className="w-4 h-4 mr-2" />
                                      Set ke Draft
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Publikasikan
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => handleOpenDelete(item)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                        className={
                          currentPage === 1
                            ? 'pointer-events-none opacity-50'
                            : 'hover:bg-emerald-50 hover:text-emerald-700'
                        }
                      />
                    </PaginationItem>

                    {getPaginationNumbers().map((page, idx) =>
                      page === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <span className="flex w-9 h-9 items-center justify-center text-gray-400">
                            ...
                          </span>
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page as number);
                            }}
                            className={
                              currentPage === page
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white'
                                : 'hover:bg-emerald-50 hover:text-emerald-700'
                            }
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }}
                        className={
                          currentPage === totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'hover:bg-emerald-50 hover:text-emerald-700'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} dari{' '}
                  {filteredList.length} pengumuman
                </p>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          ADD DIALOG
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <Plus className="w-5 h-5" />
              Tambah Pengumuman Baru
            </DialogTitle>
            <DialogDescription>
              Isi form berikut untuk membuat pengumuman baru
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Judul */}
            <div className="space-y-2">
              <Label htmlFor="add-judul">Judul</Label>
              <Input
                id="add-judul"
                placeholder="Masukkan judul pengumuman"
                value={formData.judul}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, judul: e.target.value }))
                }
              />
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <Label htmlFor="add-kategori">Kategori</Label>
              <Select
                value={formData.kategori}
                onValueChange={(v) =>
                  setFormData((f) => ({
                    ...f,
                    kategori: v as Pengumuman['kategori'],
                  }))
                }
              >
                <SelectTrigger id="add-kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Isi */}
            <div className="space-y-2">
              <Label htmlFor="add-isi">Isi Pengumuman</Label>
              <Textarea
                id="add-isi"
                placeholder="Tulis isi pengumuman secara lengkap..."
                value={formData.isi}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, isi: e.target.value }))
                }
                rows={8}
                className="resize-y min-h-[160px]"
              />
            </div>

            {/* Tanggal Publish & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-tanggal">Tanggal Publish</Label>
                <Input
                  id="add-tanggal"
                  type="date"
                  value={formData.tanggalPublish}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      tanggalPublish: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((f) => ({
                      ...f,
                      status: v as Pengumuman['status'],
                    }))
                  }
                >
                  <SelectTrigger id="add-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setFormData(emptyForm);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          VIEW DIALOG
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      KATEGORI_STYLES[selectedItem.kategori].bg
                    } ${KATEGORI_STYLES[selectedItem.kategori].text} ${
                      KATEGORI_STYLES[selectedItem.kategori].border
                    }`}
                  >
                    {(() => {
                      const Icon = KATEGORI_STYLES[selectedItem.kategori].icon;
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg leading-snug">
                      {selectedItem.judul}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          KATEGORI_STYLES[selectedItem.kategori].bg
                        } ${KATEGORI_STYLES[selectedItem.kategori].text} ${
                          KATEGORI_STYLES[selectedItem.kategori].border
                        }`}
                      >
                        {selectedItem.kategori.charAt(0).toUpperCase() +
                          selectedItem.kategori.slice(1)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          selectedItem.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}
                      >
                        {selectedItem.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="w-4 h-4" />
                  <span>{formatDateIndo(selectedItem.tanggalPublish)}</span>
                </div>

                <div className="border-t" />

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedItem.isi}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenEdit(selectedItem)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleToggleStatus(selectedItem)}
                  className={
                    selectedItem.status === 'published'
                      ? 'bg-gray-500 hover:bg-gray-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }
                >
                  {selectedItem.status === 'published' ? (
                    <>
                      <Undo2 className="w-4 h-4 mr-1" />
                      Set ke Draft
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Publikasikan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          EDIT DIALOG
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <Pencil className="w-5 h-5" />
              Edit Pengumuman
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi pengumuman di bawah ini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Judul */}
            <div className="space-y-2">
              <Label htmlFor="edit-judul">Judul</Label>
              <Input
                id="edit-judul"
                placeholder="Masukkan judul pengumuman"
                value={formData.judul}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, judul: e.target.value }))
                }
              />
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <Label htmlFor="edit-kategori">Kategori</Label>
              <Select
                value={formData.kategori}
                onValueChange={(v) =>
                  setFormData((f) => ({
                    ...f,
                    kategori: v as Pengumuman['kategori'],
                  }))
                }
              >
                <SelectTrigger id="edit-kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Isi */}
            <div className="space-y-2">
              <Label htmlFor="edit-isi">Isi Pengumuman</Label>
              <Textarea
                id="edit-isi"
                placeholder="Tulis isi pengumuman secara lengkap..."
                value={formData.isi}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, isi: e.target.value }))
                }
                rows={8}
                className="resize-y min-h-[160px]"
              />
            </div>

            {/* Tanggal Publish & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tanggal">Tanggal Publish</Label>
                <Input
                  id="edit-tanggal"
                  type="date"
                  value={formData.tanggalPublish}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      tanggalPublish: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((f) => ({
                      ...f,
                      status: v as Pengumuman['status'],
                    }))
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedItem(null);
                setFormData(emptyForm);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitEdit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION
         ═══════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Hapus Pengumuman
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengumuman{' '}
              <span className="font-semibold text-gray-800">
                &ldquo;{deleteTarget?.judul}&rdquo;
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteTarget(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
