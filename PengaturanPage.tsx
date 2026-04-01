export interface VillageProfile {
  id?: number;
  namaDesa: string;
  namaKecamatan: string;
  namaKabupaten: string;
  namaProvinsi: string;
  alamat: string;
  telepon: string;
  email: string;
  kodePos: string;
  namaKepalaDesa: string;
  nipKepalaDesa: string;
  logoDesa: string;
  logoKabupaten: string;
  formatNomorSurat: string;
}

export interface Penduduk {
  id?: number;
  nik: string;
  nama: string;
  tempatLahir: string;
  tglLahir: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  agama: string;
  statusPerkawinan: string;
  pekerjaan: string;
  pendidikan: string;
  alamat: string;
  rt: string;
  rw: string;
  foto: string;
  createdAt: string;
  updatedAt: string;
}

export interface KartuKeluarga {
  id?: number;
  nomorKK: string;
  kepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataKelahiran {
  id?: number;
  namaBayi: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tglLahir: string;
  beratBadan: number;
  panjangBadan: number;
  namaAyah: string;
  namaIbu: string;
  nikAyah: string;
  nikIbu: string;
  alamat: string;
  rt: string;
  rw: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataKematian {
  id?: number;
  namaMeninggal: string;
  nik: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tglLahir: string;
  tglMeninggal: string;
  sebabKematian: string;
  umur: string;
  namaAhliWaris: string;
  hubunganAhliWaris: string;
  alamat: string;
  rt: string;
  rw: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataMigrasi {
  id?: number;
  jenis: 'pindah_masuk' | 'pindah_keluar';
  nama: string;
  nik: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  alamatAsal: string;
  alamatTujuan: string;
  tanggal: string;
  alasan: string;
  createdAt: string;
  updatedAt: string;
}

export type StatusSurat = 'draft' | 'diproses' | 'selesai' | 'dicetak';

export interface Surat {
  id?: number;
  jenisSurat: string;
  nomorSurat: string;
  penerimaId: number;
  namaPenerima: string;
  nikPenerima: string;
  tanggalSurat: string;
  isiSurat: string;
  status: StatusSurat;
  qrCodeData: string;
  createdAt: string;
  updatedAt: string;
}

export type LevelMiskin = 1 | 2 | 3 | 4;

export interface MasyarakatMiskin {
  id?: number;
  kkId: number;
  namaKK: string;
  level: LevelMiskin;
  penghasilan: number;
  jumlahTanggungan: number;
  kondisiRumah: 'layak' | 'semi-tidak layak' | 'tidak layak';
  aksesKesehatan: 'baik' | 'kurang' | 'tidak ada';
  aksesPendidikan: 'semua' | 'sampai SMP' | 'sampai SD' | 'tidak ada';
  catatan: string;
  createdAt: string;
  updatedAt: string;
}

export interface Keuangan {
  id?: number;
  jenis: 'pemasukan' | 'pengeluaran';
  kategori: string;
  sumber: string;
  jumlah: number;
  tanggal: string;
  keterangan: string;
  tahun: number;
  bulan: number;
  createdAt: string;
  updatedAt: string;
}

export interface APBDes {
  id?: number;
  tahun: number;
  bidang: 'Pembangunan' | 'Pemberdayaan' | 'Penyelenggaraan' | 'Pembinaan';
  namaKegiatan: string;
  anggaran: number;
  realisasi: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pengumuman {
  id?: number;
  judul: string;
  isi: string;
  kategori: 'pengumuman' | 'kegiatan' | 'berita' | 'tips';
  gambar: string;
  tanggalPublish: string;
  status: 'draft' | 'published';
  createdAt: string;
}

export interface PajakPBB {
  id?: number;
  nop: string;
  pemilikId: number;
  namaPemilik: string;
  luasTanah: number;
  luasBangunan: number;
  njop: number;
  pbbTerutang: number;
  statusBayar: 'lunas' | 'belum_bayar' | 'cicilan' | 'tunggakan';
  tahun: number;
  tanggalBayar: string;
  buktiBayar: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'sekretaris' | 'operator';

export interface User {
  id?: number;
  username: string;
  password: string;
  namaLengkap: string;
  role: UserRole;
  createdAt: string;
}

export interface ActivityLog {
  id?: number;
  userId: number;
  userName: string;
  action: string;
  detail: string;
  timestamp: string;
}

export type AppView =
  | 'dashboard'
  | 'penduduk'
  | 'kk'
  | 'kelahiran'
  | 'kematian'
  | 'migrasi'
  | 'masyarakat-miskin'
  | 'surat'
  | 'cetak-surat'
  | 'keuangan'
  | 'perpajakan'
  | 'profil-desa'
  | 'pengumuman'
  | 'laporan'
  | 'pengaturan';

export const JENIS_SURAT = [
  'Surat Pengantar KTP',
  'Surat Pengantar KK',
  'Surat Keterangan Domisili',
  'Surat Keterangan Tidak Mampu (SKTM)',
  'Surat Keterangan Usaha (SKU)',
  'Surat Keterangan Pindah',
  'Surat Keterangan Lahir',
  'Surat Keterangan Kematian',
  'Surat Keterangan Belum Menikah',
  'Surat Keterangan Penghasilan',
  'Surat Pengantar SKCK',
  'Surat Keterangan RT/RW',
  'Surat Keterangan Bebas Narkoba',
  'Surat Keterangan Orang Tua',
  'Surat Keterangan Waris',
  'Surat Keterangan Tanah',
  'Surat Izin Keramaian',
  'Surat Izin Usaha Mikro',
  'Surat Keterangan Jamkesos',
  'Surat Rekomendasi Bantuan',
] as const;

export const LEVEL_MISKIN_LABELS: Record<LevelMiskin, { label: string; color: string; bgColor: string; borderColor: string }> = {
  1: { label: 'Sangat Miskin', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
  2: { label: 'Miskin', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
  3: { label: 'Hampir Miskin', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
  4: { label: 'Rentan Miskin', color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-300' },
};

export const AGAMA_OPTIONS = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
export const PENDIDIKAN_OPTIONS = ['Tidak Sekolah', 'SD/Sederajat', 'SMP/Sederajat', 'SMA/Sederajat', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'];
export const PEKERJAAN_OPTIONS = ['Petani', 'Nelayan', 'Pedagang', 'PNS', 'Pegawai Swasta', 'Wiraswasta', 'Buruh Harian', 'Tidak Bekerja', 'Pelajar/Mahasiswa', 'Lainnya'];
export const STATUS_KAWIN_OPTIONS = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];
