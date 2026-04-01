'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import db from '@/lib/db';
import type { User, VillageProfile, UserRole } from '@/lib/types';
import { Save, Upload, Download, ShieldCheck, UserPlus, Trash2, Building2, Landmark, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PengaturanPage() {
  const { villageProfile, setVillageProfile, user } = useAppStore();
  const [profile, setProfile] = useState<VillageProfile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', namaLengkap: '', role: 'operator' as UserRole });

  // ── Ganti Password State ──
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShowCurrent, setPwShowCurrent] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwShowConfirm, setPwShowConfirm] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    if (villageProfile) {
      setProfile({ ...villageProfile });
    }
    loadUsers();
  }, [villageProfile]);

  const loadUsers = async () => {
    const allUsers = await db.users.toArray();
    setUsers(allUsers);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await setVillageProfile(profile);
      toast.success('Profil desa berhasil disimpan!');
    } catch {
      toast.error('Gagal menyimpan profil desa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (field: 'logoDesa' | 'logoKabupaten') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!profile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfile({ ...profile, [field]: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.namaLengkap) {
      toast.error('Semua field harus diisi');
      return;
    }
    try {
      await db.users.add({
        ...newUser,
        createdAt: new Date().toISOString(),
      });
      toast.success('User berhasil ditambahkan');
      setShowAddUser(false);
      setNewUser({ username: '', password: '', namaLengkap: '', role: 'operator' });
      loadUsers();
    } catch {
      toast.error('Gagal menambahkan user');
    }
  };

  const handleDeleteUser = async (id?: number) => {
    if (!id) return;
    try {
      await db.users.delete(id);
      toast.success('User berhasil dihapus');
      loadUsers();
    } catch {
      toast.error('Gagal menghapus user');
    }
  };

  const handleChangePassword = async () => {
    if (!user?.id) {
      toast.error('Sesi login tidak valid, silakan login ulang');
      return;
    }
    if (!pwCurrent.trim()) {
      toast.error('Password lama wajib diisi');
      return;
    }
    if (!pwNew.trim()) {
      toast.error('Password baru wajib diisi');
      return;
    }
    if (pwNew.trim().length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }
    if (pwCurrent === pwNew) {
      toast.error('Password baru tidak boleh sama dengan password lama');
      return;
    }

    setIsChangingPw(true);
    try {
      // Verify current password
      const dbUser = await db.users.get(user.id);
      if (!dbUser) {
        toast.error('Akun tidak ditemukan di database');
        return;
      }
      if (dbUser.password !== pwCurrent) {
        toast.error('Password lama salah');
        return;
      }

      // Update password
      await db.users.update(user.id, { password: pwNew.trim() });
      toast.success('Password berhasil diubah');
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } catch {
      toast.error('Gagal mengubah password');
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleBackup = async () => {
    try {
      const data: Record<string, any> = {
        penduduk: await db.penduduk.toArray(),
        kartuKeluarga: await db.kartuKeluarga.toArray(),
        surat: await db.surat.toArray(),
        masyarakatMiskin: await db.masyarakatMiskin.toArray(),
        pengumuman: await db.pengumuman.toArray(),
        pajakPBB: await db.pajakPBB.toArray(),
        users: await db.users.toArray(),
        villageProfile: await db.villageProfile.toArray(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-desa-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup berhasil diunduh');
    } catch {
      toast.error('Gagal membuat backup');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.penduduk) await db.penduduk.clear().then(() => db.penduduk.bulkAdd(data.penduduk));
        if (data.kartuKeluarga) await db.kartuKeluarga.clear().then(() => db.kartuKeluarga.bulkAdd(data.kartuKeluarga));
        if (data.surat) await db.surat.clear().then(() => db.surat.bulkAdd(data.surat));
        if (data.masyarakatMiskin) await db.masyarakatMiskin.clear().then(() => db.masyarakatMiskin.bulkAdd(data.masyarakatMiskin));
        if (data.pengumuman) await db.pengumuman.clear().then(() => db.pengumuman.bulkAdd(data.pengumuman));
        if (data.pajakPBB) await db.pajakPBB.clear().then(() => db.pajakPBB.bulkAdd(data.pajakPBB));
        if (data.users) await db.users.clear().then(() => db.users.bulkAdd(data.users));
        if (data.villageProfile) await db.villageProfile.clear().then(() => db.villageProfile.bulkAdd(data.villageProfile));
        toast.success('Data berhasil dipulihkan');
        loadUsers();
        if (data.villageProfile?.[0]) {
          setProfile(data.villageProfile[0]);
        }
      } catch {
        toast.error('Gagal memulihkan data. Pastikan format file benar.');
      }
    };
    reader.readAsText(file);
  };

  if (!profile) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Memuat pengaturan...</p></div>;
  }

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700',
    sekretaris: 'bg-blue-100 text-blue-700',
    operator: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      {/* Identitas Desa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Identitas Desa
          </CardTitle>
          <CardDescription>Atur informasi identitas desa yang akan tampil di kop surat dan halaman login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="namaDesa">Nama Desa</Label>
              <Input id="namaDesa" value={profile.namaDesa} onChange={(e) => setProfile({ ...profile, namaDesa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaKecamatan">Kecamatan</Label>
              <Input id="namaKecamatan" value={profile.namaKecamatan} onChange={(e) => setProfile({ ...profile, namaKecamatan: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaKabupaten">Kabupaten/Kota</Label>
              <Input id="namaKabupaten" value={profile.namaKabupaten} onChange={(e) => setProfile({ ...profile, namaKabupaten: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaProvinsi">Provinsi</Label>
              <Input id="namaProvinsi" value={profile.namaProvinsi} onChange={(e) => setProfile({ ...profile, namaProvinsi: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat Lengkap</Label>
            <Textarea id="alamat" value={profile.alamat} onChange={(e) => setProfile({ ...profile, alamat: e.target.value })} rows={2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telepon">Telepon</Label>
              <Input id="telepon" value={profile.telepon} onChange={(e) => setProfile({ ...profile, telepon: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kodePos">Kode Pos</Label>
              <Input id="kodePos" value={profile.kodePos} onChange={(e) => setProfile({ ...profile, kodePos: e.target.value })} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="namaKepalaDesa">Nama Kepala Desa</Label>
              <Input id="namaKepalaDesa" value={profile.namaKepalaDesa} onChange={(e) => setProfile({ ...profile, namaKepalaDesa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nipKepalaDesa">NIP Kepala Desa</Label>
              <Input id="nipKepalaDesa" value={profile.nipKepalaDesa} onChange={(e) => setProfile({ ...profile, nipKepalaDesa: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Format Nomor Surat</Label>
            <Input value={profile.formatNomorSurat} onChange={(e) => setProfile({ ...profile, formatNomorSurat: e.target.value })} placeholder="070/DES/SMJ/MM/YYYY" />
            <p className="text-xs text-gray-400">Gunakan MM untuk bulan dan YYYY untuk tahun</p>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Menyimpan...' : 'Simpan Identitas Desa'}
          </Button>
        </CardContent>
      </Card>

      {/* Logo Desa & Kabupaten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600" />
            Logo
          </CardTitle>
          <CardDescription>Upload logo desa dan logo kabupaten untuk kop surat dan halaman login.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Logo Kabupaten (Kiri Kop Surat)</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors">
                {profile.logoKabupaten ? (
                  <div className="space-y-3">
                    <img src={profile.logoKabupaten} alt="Logo Kabupaten" className="w-24 h-24 mx-auto rounded-lg object-contain border" />
                    <p className="text-xs text-gray-500">Logo kabupaten sudah diupload</p>
                    <Button variant="outline" size="sm" asChild className="cursor-pointer">
                      <label className="cursor-pointer">
                        <Upload className="w-3 h-3 mr-1" />
                        Ganti Logo
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload('logoKabupaten')} />
                      </label>
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500">Klik untuk upload</p>
                    <p className="text-xs text-gray-400">PNG, JPG, max 2MB</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload('logoKabupaten')} />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Logo Desa (Kanan Kop Surat)</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors">
                {profile.logoDesa ? (
                  <div className="space-y-3">
                    <img src={profile.logoDesa} alt="Logo Desa" className="w-24 h-24 mx-auto rounded-lg object-contain border" />
                    <p className="text-xs text-gray-500">Logo desa sudah diupload</p>
                    <Button variant="outline" size="sm" asChild className="cursor-pointer">
                      <label className="cursor-pointer">
                        <Upload className="w-3 h-3 mr-1" />
                        Ganti Logo
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload('logoDesa')} />
                      </label>
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500">Klik untuk upload</p>
                    <p className="text-xs text-gray-400">PNG, JPG, max 2MB</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload('logoDesa')} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manajemen User */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Akun Pengguna
              </CardTitle>
              <CardDescription>Kelola akun pengguna sistem informasi desa.</CardDescription>
            </div>
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Tambah User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                  <DialogDescription>Isi data pengguna baru untuk mengakses sistem.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="username" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input value={newUser.namaLengkap} onChange={(e) => setNewUser({ ...newUser, namaLengkap: e.target.value })} placeholder="Nama Lengkap" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="sekretaris">Sekretaris</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>Batal</Button>
                  <Button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.namaLengkap}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.username !== 'admin' && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ganti Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Ganti Password
          </CardTitle>
          <CardDescription>
            Ubah password akun <span className="font-semibold text-gray-700">{user?.namaLengkap || user?.username || '-'}</span> ({user?.role || '-'}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-4">
            {/* Password Lama */}
            <div className="space-y-1.5">
              <Label htmlFor="pw-current" className="text-xs font-medium">Password Lama <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="pw-current"
                  type={pwShowCurrent ? 'text' : 'password'}
                  value={pwCurrent}
                  onChange={e => setPwCurrent(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="h-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setPwShowCurrent(!pwShowCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {pwShowCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div className="space-y-1.5">
              <Label htmlFor="pw-new" className="text-xs font-medium">Password Baru <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="pw-new"
                  type={pwShowNew ? 'text' : 'password'}
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="h-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setPwShowNew(!pwShowNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {pwShowNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {pwNew && pwNew.length < 6 && (
                <p className="text-[10px] text-amber-600">Password terlalu pendek (minimal 6 karakter)</p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1.5">
              <Label htmlFor="pw-confirm" className="text-xs font-medium">Konfirmasi Password Baru <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="pw-confirm"
                  type={pwShowConfirm ? 'text' : 'password'}
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Ulangi password baru"
                  className={`h-9 pr-9 ${pwConfirm && pwConfirm !== pwNew ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setPwShowConfirm(!pwShowConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {pwShowConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {pwConfirm && pwConfirm !== pwNew && (
                <p className="text-[10px] text-red-500">Password tidak cocok</p>
              )}
              {pwConfirm && pwConfirm === pwNew && pwConfirm.length >= 6 && (
                <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Password cocok
                </p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isChangingPw || !pwCurrent || !pwNew || !pwConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {isChangingPw ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengubah...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Ubah Password
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore Data</CardTitle>
          <CardDescription>Backup seluruh data desa ke file JSON atau restore dari backup sebelumnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleBackup} variant="outline" className="cursor-pointer">
              <Download className="w-4 h-4 mr-2" />
              Download Backup
            </Button>
            <Button variant="outline" asChild className="cursor-pointer">
              <label>
                <Upload className="w-4 h-4 mr-2" />
                Restore dari Backup
                <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
