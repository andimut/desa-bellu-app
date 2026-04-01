import Dexie, { type EntityTable } from 'dexie';
import type { Penduduk, KartuKeluarga, DataKelahiran, DataKematian, DataMigrasi, Keuangan, APBDes, Surat, MasyarakatMiskin, Pengumuman, PajakPBB, User, ActivityLog, VillageProfile } from './types';

const db = new Dexie('DesaDatabase') as Dexie & {
  penduduk: EntityTable<Penduduk, 'id'>;
  kartuKeluarga: EntityTable<KartuKeluarga, 'id'>;
  dataKelahiran: EntityTable<DataKelahiran, 'id'>;
  dataKematian: EntityTable<DataKematian, 'id'>;
  keuangan: EntityTable<Keuangan, 'id'>;
  apbdes: EntityTable<APBDes, 'id'>;
  surat: EntityTable<Surat, 'id'>;
  masyarakatMiskin: EntityTable<MasyarakatMiskin, 'id'>;
  pengumuman: EntityTable<Pengumuman, 'id'>;
  pajakPBB: EntityTable<PajakPBB, 'id'>;
  users: EntityTable<User, 'id'>;
  activityLog: EntityTable<ActivityLog, 'id'>;
  villageProfile: EntityTable<VillageProfile, 'id'>;
  dataMigrasi: EntityTable<DataMigrasi, 'id'>;
};

db.version(1).stores({
  penduduk: '++id, nik, nama, jenisKelamin, rt, rw, agama, pekerjaan',
  kartuKeluarga: '++id, nomorKK, kepalaKeluarga, rt, rw',
  dataKelahiran: '++id, namaBayi, tglLahir, jenisKelamin, rt, rw',
  dataKematian: '++id, namaMeninggal, nik, tglMeninggal, rt, rw',
  keuangan: '++id, jenis, kategori, sumber, tahun, bulan',
  apbdes: '++id, tahun, bidang, namaKegiatan',
  surat: '++id, jenisSurat, nomorSurat, penerimaId, status, tanggalSurat',
  masyarakatMiskin: '++id, kkId, namaKK, level',
  pengumuman: '++id, kategori, status, tanggalPublish',
  pajakPBB: '++id, nop, pemilikId, statusBayar, tahun',
  users: '++id, username, role',
  activityLog: '++id, userId, timestamp',
  villageProfile: '++id',
});

db.version(2).stores({
  dataMigrasi: '++id, jenis, nama, tanggal',
});

// Seed data
export async function seedDatabase() {
  const userCount = await db.users.count();
  
  // Always update village profile to latest
  const existingProfile = await db.villageProfile.toCollection().first();
  if (existingProfile) {
    await db.villageProfile.update(existingProfile.id!, {
      namaDesa: 'Desa Bellu',
      namaKecamatan: 'Kec. Salomekko',
      namaKabupaten: 'Kab. Bone',
      namaProvinsi: 'Prov. Sulawesi Selatan',
      alamat: 'Kantor Desa Bellu, Kec. Salomekko',
      telepon: '-',
      email: 'desabellu@gmail.com',
      kodePos: '92763',
      namaKepalaDesa: '',
      nipKepalaDesa: '',
      formatNomorSurat: '070/DES/BLU/MM/YYYY',
    });
  }

  if (userCount > 0) return;

  // Default users
  await db.users.bulkAdd([
    { username: 'admin', password: 'admin123', namaLengkap: 'Administrator', role: 'admin', createdAt: new Date().toISOString() },
    { username: 'sekre', password: 'sekre123', namaLengkap: 'Siti Aminah', role: 'sekretaris', createdAt: new Date().toISOString() },
    { username: 'operator', password: 'op123', namaLengkap: 'Budi Santoso', role: 'operator', createdAt: new Date().toISOString() },
  ]);

  // Default village profile
  await db.villageProfile.bulkAdd([
    {
      namaDesa: 'Desa Bellu',
      namaKecamatan: 'Kec. Salomekko',
      namaKabupaten: 'Kab. Bone',
      namaProvinsi: 'Prov. Sulawesi Selatan',
      alamat: 'Kantor Desa Bellu, Kec. Salomekko',
      telepon: '-',
      email: 'desabellu@gmail.com',
      kodePos: '92763',
      namaKepalaDesa: '',
      nipKepalaDesa: '',
      logoDesa: '',
      logoKabupaten: '',
      formatNomorSurat: '070/DES/BLU/MM/YYYY',
    },
  ]);

  // Sample KK
  await db.kartuKeluarga.bulkAdd([
    { nomorKK: '7308050101080001', kepalaKeluarga: 'Ahmad Fauzi', alamat: 'RT 01/RW 03, Desa Bellu', rt: '01', rw: '03', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nomorKK: '7308050101080002', kepalaKeluarga: 'Siti Aminah', alamat: 'RT 02/RW 03, Desa Bellu', rt: '02', rw: '03', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nomorKK: '7308050101080003', kepalaKeluarga: 'Budi Santoso', alamat: 'RT 03/RW 05, Desa Bellu', rt: '03', rw: '05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nomorKK: '7308050101080004', kepalaKeluarga: 'Dewi Ratnasari', alamat: 'RT 01/RW 01, Desa Bellu', rt: '01', rw: '01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nomorKK: '7308050101080005', kepalaKeluarga: 'Eko Prasetyo', alamat: 'RT 04/RW 05, Desa Bellu', rt: '04', rw: '05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  // Sample Penduduk
  const samplePenduduk: Omit<Penduduk, 'id'>[] = [
    { nik: '7308050101800001', nama: 'Ahmad Fauzi', tempatLahir: 'Watampone', tglLahir: '1990-03-15', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Petani', pendidikan: 'SMA/Sederajat', alamat: 'RT 01/RW 03', rt: '01', rw: '03', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101850002', nama: 'Siti Nurjanah', tempatLahir: 'Watampone', tglLahir: '1992-07-22', jenisKelamin: 'Perempuan', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Ibu Rumah Tangga', pendidikan: 'SMP/Sederajat', alamat: 'RT 01/RW 03', rt: '01', rw: '03', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101200003', nama: 'Aisyah Putri', tempatLahir: 'Watampone', tglLahir: '2015-01-10', jenisKelamin: 'Perempuan', agama: 'Islam', statusPerkawinan: 'Belum Kawin', pekerjaan: 'Pelajar/Mahasiswa', pendidikan: 'SD/Sederajat', alamat: 'RT 01/RW 03', rt: '01', rw: '03', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101750004', nama: 'Siti Aminah', tempatLahir: 'Makassar', tglLahir: '1975-11-30', jenisKelamin: 'Perempuan', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'PNS', pendidikan: 'S1', alamat: 'RT 02/RW 03', rt: '02', rw: '03', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101700005', nama: 'Budi Santoso', tempatLahir: 'Watampone', tglLahir: '1970-05-18', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Wiraswasta', pendidikan: 'D3', alamat: 'RT 03/RW 05', rt: '03', rw: '05', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101950006', nama: 'Dewi Ratnasari', tempatLahir: 'Makassar', tglLahir: '1995-09-05', jenisKelamin: 'Perempuan', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Pegawai Swasta', pendidikan: 'S1', alamat: 'RT 01/RW 01', rt: '01', rw: '01', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101920007', nama: 'Eko Prasetyo', tempatLahir: 'Bone', tglLahir: '1992-12-12', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Pedagang', pendidikan: 'SMA/Sederajat', alamat: 'RT 04/RW 05', rt: '04', rw: '05', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101100008', nama: 'Haji Muhidin', tempatLahir: 'Watampone', tglLahir: '1960-06-20', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Petani', pendidikan: 'SD/Sederajat', alamat: 'RT 05/RW 02', rt: '05', rw: '02', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101880009', nama: 'Rina Marlina', tempatLahir: 'Watampone', tglLahir: '1988-04-08', jenisKelamin: 'Perempuan', agama: 'Kristen Protestan', statusPerkawinan: 'Belum Kawin', pekerjaan: 'Pegawai Swasta', pendidikan: 'D3', alamat: 'RT 02/RW 01', rt: '02', rw: '01', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050102000010', nama: 'Reza Mahendra', tempatLahir: 'Watampone', tglLahir: '2000-08-25', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Belum Kawin', pekerjaan: 'Pelajar/Mahasiswa', pendidikan: 'SMA/Sederajat', alamat: 'RT 03/RW 03', rt: '03', rw: '03', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101650011', nama: 'Wartini', tempatLahir: 'Bone', tglLahir: '1965-02-14', jenisKelamin: 'Perempuan', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Petani', pendidikan: 'SD/Sederajat', alamat: 'RT 05/RW 02', rt: '05', rw: '02', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101050012', nama: 'Karto Sentono', tempatLahir: 'Bone', tglLahir: '1955-10-01', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Petani', pendidikan: 'Tidak Sekolah', alamat: 'RT 06/RW 02', rt: '06', rw: '02', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101980013', nama: 'Nadia Safitri', tempatLahir: 'Watampone', tglLahir: '1998-03-17', jenisKelamin: 'Perempuan', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Buruh Harian', pendidikan: 'SMP/Sederajat', alamat: 'RT 04/RW 05', rt: '04', rw: '05', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101850014', nama: 'Agus Riyanto', tempatLahir: 'Bone', tglLahir: '1985-07-30', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Nelayan', pendidikan: 'SMP/Sederajat', alamat: 'RT 01/RW 04', rt: '01', rw: '04', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101150015', nama: 'Mbah Surip', tempatLahir: 'Watampone', tglLahir: '1950-11-11', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Cerai Mati', pekerjaan: 'Tidak Bekerja', pendidikan: 'Tidak Sekolah', alamat: 'RT 06/RW 02', rt: '06', rw: '02', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050102050016', nama: 'Dimas Pratama', tempatLahir: 'Watampone', tglLahir: '2005-06-05', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Belum Kawin', pekerjaan: 'Pelajar/Mahasiswa', pendidikan: 'SMP/Sederajat', alamat: 'RT 03/RW 05', rt: '03', rw: '05', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101780017', nama: 'Linda Kusuma', tempatLahir: 'Makassar', tglLahir: '1978-12-25', jenisKelamin: 'Perempuan', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Wiraswasta', pendidikan: 'S1', alamat: 'RT 02/RW 01', rt: '02', rw: '01', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101900018', nama: 'Rizki Firmansyah', tempatLahir: 'Watampone', tglLahir: '1990-01-20', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'PNS', pendidikan: 'S1', alamat: 'RT 01/RW 03', rt: '01', rw: '03', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050101500019', nama: 'Tarno', tempatLahir: 'Bone', tglLahir: '1970-04-14', jenisKelamin: 'Laki-laki', agama: 'Islam', statusPerkawinan: 'Kawin', pekerjaan: 'Buruh Harian', pendidikan: 'SD/Sederajat', alamat: 'RT 05/RW 04', rt: '05', rw: '04', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { nik: '7308050102080020', nama: 'Siti Khodijah', tempatLahir: 'Watampone', tglLahir: '2008-09-09', jenisKelamin: 'Perempuan', agama: 'Islam', statusPerkawinan: 'Belum Kawin', pekerjaan: 'Pelajar/Mahasiswa', pendidikan: 'SD/Sederajat', alamat: 'RT 04/RW 05', rt: '04', rw: '05', foto: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  await db.penduduk.bulkAdd(samplePenduduk);

  // Sample Data Kelahiran
  await db.dataKelahiran.bulkAdd([
    { namaBayi: 'Muhammad Rizal', jenisKelamin: 'Laki-laki', tempatLahir: 'Watampone', tglLahir: '2026-01-15', beratBadan: 3.2, panjangBadan: 50, namaAyah: 'Ahmad Fauzi', namaIbu: 'Siti Nurjanah', nikAyah: '7308050101800001', nikIbu: '7308050101850002', alamat: 'RT 01/RW 03, Desa Bellu', rt: '01', rw: '03', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { namaBayi: 'Siti Azzahra', jenisKelamin: 'Perempuan', tempatLahir: 'Bone', tglLahir: '2026-02-20', beratBadan: 2.8, panjangBadan: 48, namaAyah: 'Rizki Firmansyah', namaIbu: 'Nadia Safitri', nikAyah: '7308050101900018', nikIbu: '7308050101980013', alamat: 'RT 04/RW 05, Desa Bellu', rt: '04', rw: '05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { namaBayi: 'Andi Pratama', jenisKelamin: 'Laki-laki', tempatLahir: 'Watampone', tglLahir: '2025-11-05', beratBadan: 3.5, panjangBadan: 52, namaAyah: 'Eko Prasetyo', namaIbu: 'Dewi Ratnasari', nikAyah: '7308050101920007', nikIbu: '7308050101950006', alamat: 'RT 04/RW 05, Desa Bellu', rt: '04', rw: '05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { namaBayi: 'Fatimah', jenisKelamin: 'Perempuan', tempatLahir: 'Watampone', tglLahir: '2025-09-12', beratBadan: 3.0, panjangBadan: 49, namaAyah: 'Haji Muhidin', namaIbu: 'Wartini', nikAyah: '7308050101100008', nikIbu: '7308050101650011', alamat: 'RT 05/RW 02, Desa Bellu', rt: '05', rw: '02', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { namaBayi: 'Irfan Maulana', jenisKelamin: 'Laki-laki', tempatLahir: 'Bone', tglLahir: '2026-03-01', beratBadan: 3.3, panjangBadan: 51, namaAyah: 'Budi Santoso', namaIbu: 'Linda Kusuma', nikAyah: '7308050101700005', nikIbu: '7308050101780017', alamat: 'RT 03/RW 05, Desa Bellu', rt: '03', rw: '05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  // Sample Data Kematian
  await db.dataKematian.bulkAdd([
    { namaMeninggal: 'Mbah Surip', nik: '7308050101150015', jenisKelamin: 'Laki-laki', tempatLahir: 'Watampone', tglLahir: '1950-11-11', tglMeninggal: '2025-12-20', sebabKematian: 'Sakit tua', umur: '75 tahun', namaAhliWaris: 'Suparno', hubunganAhliWaris: 'Keponakan', alamat: 'RT 06/RW 02, Desa Bellu', rt: '06', rw: '02', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { namaMeninggal: 'Hj. Salmah', nik: '7308050101400001', jenisKelamin: 'Perempuan', tempatLahir: 'Bone', tglLahir: '1945-06-15', tglMeninggal: '2026-01-10', sebabKematian: 'Penyakit jantung', umur: '80 tahun', namaAhliWaris: 'Agus Riyanto', hubunganAhliWaris: 'Anak', alamat: 'RT 01/RW 04, Desa Bellu', rt: '01', rw: '04', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { namaMeninggal: 'Tua Toa', nik: '7308050100900002', jenisKelamin: 'Laki-laki', tempatLahir: 'Watampone', tglLahir: '1938-03-22', tglMeninggal: '2025-08-05', sebabKematian: 'Sakit ginjal', umur: '87 tahun', namaAhliWaris: 'Karto Sentono', hubunganAhliWaris: 'Anak', alamat: 'RT 06/RW 02, Desa Bellu', rt: '06', rw: '02', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  // Sample Keuangan
  await db.keuangan.bulkAdd([
    // Pemasukan 2026
    { jenis: 'pemasukan', kategori: 'Dana Desa', sumber: 'Pemerintah Kabupaten', jumlah: 350000000, tanggal: '2026-01-15', keterangan: 'Dana Desa Tahap I 2026', tahun: 2026, bulan: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pemasukan', kategori: 'ADD', sumber: 'Pemerintah Provinsi', jumlah: 150000000, tanggal: '2026-01-20', keterangan: 'Alokasi Dana Desa 2026', tahun: 2026, bulan: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pemasukan', kategori: 'Bantuan', sumber: 'Pemerintah Pusat', jumlah: 50000000, tanggal: '2026-02-10', keterangan: 'BLT Dana Desa 2026', tahun: 2026, bulan: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pemasukan', kategori: 'PADes', sumber: 'Warga Desa', jumlah: 25000000, tanggal: '2026-02-28', keterangan: 'Pendapatan Asli Desa Q1 2026', tahun: 2026, bulan: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pemasukan', kategori: 'Sumbangan', sumber: 'Donatur', jumlah: 10000000, tanggal: '2026-03-05', keterangan: 'Sumbangan pembangunan mushola', tahun: 2026, bulan: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    // Pengeluaran 2026
    { jenis: 'pengeluaran', kategori: 'Pembangunan', sumber: 'Dana Desa', jumlah: 75000000, tanggal: '2026-01-25', keterangan: 'Pembangunan jalan RT 03', tahun: 2026, bulan: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pengeluaran', kategori: 'Penyelenggaraan', sumber: 'Dana Desa', jumlah: 30000000, tanggal: '2026-02-05', keterangan: 'Gaji perangkat desa Januari', tahun: 2026, bulan: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pengeluaran', kategori: 'Pemberdayaan', sumber: 'ADD', jumlah: 20000000, tanggal: '2026-02-15', keterangan: 'Pelatihan UMKM warga desa', tahun: 2026, bulan: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pengeluaran', kategori: 'Pembinaan', sumber: 'Dana Desa', jumlah: 15000000, tanggal: '2026-03-01', keterangan: 'Kegiatan Posyandu Maret', tahun: 2026, bulan: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pengeluaran', kategori: 'Pembangunan', sumber: 'Dana Desa', jumlah: 50000000, tanggal: '2026-03-10', keterangan: 'Rehabilitasi Balai Desa', tahun: 2026, bulan: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  // Sample APBDes 2026
  await db.apbdes.bulkAdd([
    { tahun: 2026, bidang: 'Pembangunan', namaKegiatan: 'Pembangunan jalan desa', anggaran: 200000000, realisasi: 75000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { tahun: 2026, bidang: 'Pembangunan', namaKegiatan: 'Rehabilitasi Balai Desa', anggaran: 100000000, realisasi: 50000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { tahun: 2026, bidang: 'Pembangunan', namaKegiatan: 'Pembangunan drainase', anggaran: 80000000, realisasi: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { tahun: 2026, bidang: 'Pemberdayaan', namaKegiatan: 'Pelatihan UMKM', anggaran: 40000000, realisasi: 20000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { tahun: 2026, bidang: 'Pemberdayaan', namaKegiatan: 'Bantuan modal usaha', anggaran: 30000000, realisasi: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { tahun: 2026, bidang: 'Penyelenggaraan', namaKegiatan: 'Gaji perangkat desa', anggaran: 180000000, realisasi: 60000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { tahun: 2026, bidang: 'Penyelenggaraan', namaKegiatan: 'Operasional desa', anggaran: 60000000, realisasi: 15000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { tahun: 2026, bidang: 'Pembinaan', namaKegiatan: 'Posyandu', anggaran: 25000000, realisasi: 15000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { tahun: 2026, bidang: 'Pembinaan', namaKegiatan: 'Kegiatan keagamaan', anggaran: 20000000, realisasi: 5000000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  // Sample Pengumuman
  await db.pengumuman.bulkAdd([
    { judul: 'Musyawarah Desa (Musdes) Tahun 2026', isi: 'Diberitahukan kepada seluruh warga Desa Bellu bahwa akan diadakan Musyawarah Desa untuk membahas program pembangunan tahun 2026. Acara akan dilaksanakan pada hari Sabtu, 10 April 2026 pukul 09.00 WITA di Balai Desa Bellu. Dimohon kehadiran seluruh warga.', kategori: 'pengumuman', gambar: '', tanggalPublish: '2026-04-01', status: 'published', createdAt: new Date().toISOString() },
    { judul: 'Jadwal Posyandu Bulan April 2026', isi: 'Posyandu Balita akan dilaksanakan setiap hari Rabu di Puskesmas Desa Bellu. Waktu: 08.00-12.00 WITA. Diharapkan seluruh ibu membawa balitanya untuk pemeriksaan rutin dan imunisasi.', kategori: 'kegiatan', gambar: '', tanggalPublish: '2026-04-01', status: 'published', createdAt: new Date().toISOString() },
    { judul: 'Program Bantuan Langsung Tunai (BLT) Tahap II', isi: 'Pemerintah Desa Bellu mengumumkan bahwa pencairan BLT Tahap II tahun 2026 akan dimulai pada tanggal 15 April 2026. Bagi warga yang sudah terdaftar sebagai penerima, harap membawa KTP dan KK asli ke kantor Desa.', kategori: 'berita', gambar: '', tanggalPublish: '2026-03-28', status: 'published', createdAt: new Date().toISOString() },
    { judul: 'Gotong Royong Bersih Desa', isi: 'Kegiatan gotong royong bersih desa akan dilaksanakan pada hari Minggu, 5 April 2026. Seluruh warga diharapkan berpartisipasi membawa peralatan kebersihan masing-masing. Kumpul pukul 06.00 WIB di Balai Desa.', kategori: 'kegiatan', gambar: '', tanggalPublish: '2026-03-30', status: 'published', createdAt: new Date().toISOString() },
    { judul: 'Tips Menjaga Kebersihan Lingkungan', isi: 'Mari bersama-sama menjaga kebersihan lingkungan kita. Buang sampah pada tempatnya, pisahkan sampah organik dan anorganik, dan kurangi penggunaan plastik sekali pakai. Lingkungan bersih = Desa sehat!', kategori: 'tips', gambar: '', tanggalPublish: '2026-03-25', status: 'published', createdAt: new Date().toISOString() },
  ]);

  // Sample Data Migrasi
  await db.dataMigrasi.bulkAdd([
    { jenis: 'pindah_masuk', nama: 'Muhammad Ilham', nik: '7308052501950001', jenisKelamin: 'Laki-laki', alamatAsal: 'RT 03/RW 05, Desa Bajoe, Kec. Tanete Riattang', alamatTujuan: 'RT 02/RW 03, Desa Bellu, Kec. Salomekko', tanggal: '2026-01-10', alasan: 'Pindah tempat tinggal mengikuti pekerjaan', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pindah_masuk', nama: 'Nur Aisyah Dg. Limpo', nik: '7308053520900002', jenisKelamin: 'Perempuan', alamatAsal: 'RT 01/RW 02, Desa Palakka, Kec. Libureng', alamatTujuan: 'RT 04/RW 05, Desa Bellu, Kec. Salomekko', tanggal: '2026-02-15', alasan: 'Menikah dengan warga Desa Bellu', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pindah_masuk', nama: 'Andi Tenri Waru', nik: '7308054101920003', jenisKelamin: 'Perempuan', alamatAsal: 'Jl. Andi Mappanyukki No. 12, Kota Watampone', alamatTujuan: 'RT 01/RW 01, Desa Bellu, Kec. Salomekko', tanggal: '2026-03-20', alasan: 'Pindah karena tugas sebagai guru honorer di SD Bellu', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pindah_keluar', nama: 'Rizki Amaldasari', nik: '7308050101980013', jenisKelamin: 'Perempuan', alamatAsal: 'RT 04/RW 05, Desa Bellu, Kec. Salomekko', alamatTujuan: 'Jl. Pengayoman No. 8, Kota Makassar', tanggal: '2026-01-25', alasan: 'Bekerja sebagai karyawan swasta di Makassar', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pindah_keluar', nama: 'Agus Salim', nik: '7308050101850014', jenisKelamin: 'Laki-laki', alamatAsal: 'RT 01/RW 04, Desa Bellu, Kec. Salomekko', alamatTujuan: 'RT 02/RW 01, Desa Awangpone, Kec. Awangpone', tanggal: '2026-02-28', alasan: 'Pindah mengikuti orang tua', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenis: 'pindah_keluar', nama: 'Siti Rahmawati', nik: '7308050101880009', jenisKelamin: 'Perempuan', alamatAsal: 'RT 02/RW 01, Desa Bellu, Kec. Salomekko', alamatTujuan: 'RT 05/RW 03, Desa Palakka, Kec. Libureng', tanggal: '2026-04-05', alasan: 'Menikah dan pindah ke rumah suami', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  // Sample Surat
  await db.surat.bulkAdd([
    { jenisSurat: 'Surat Keterangan Domisili', nomorSurat: '070/DES/SMJ/IV/2026/001', penerimaId: 1, namaPenerima: 'Ahmad Fauzi', nikPenerima: '3201010101800001', tanggalSurat: '2026-04-01', isiSurat: 'Surat keterangan domisili untuk keperluan pengajuan KPR', status: 'dicetak', qrCodeData: 'SUR-001-DOM-20260401', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenisSurat: 'Surat Keterangan Tidak Mampu (SKTM)', nomorSurat: '070/DES/SMJ/IV/2026/002', penerimaId: 11, namaPenerima: 'Wartini', nikPenerima: '3201010101650011', tanggalSurat: '2026-04-01', isiSurat: 'SKTM untuk pengurusan biaya berobat di rumah sakit', status: 'selesai', qrCodeData: 'SUR-002-SKTM-20260401', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenisSurat: 'Surat Pengantar KTP', nomorSurat: '070/DES/SMJ/III/2026/015', penerimaId: 10, namaPenerima: 'Reza Mahendra', nikPenerima: '3201010102000010', tanggalSurat: '2026-03-25', isiSurat: 'Pengantar pembuatan KTP Elektronik', status: 'dicetak', qrCodeData: 'SUR-015-KTP-20260325', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenisSurat: 'Surat Keterangan Usaha (SKU)', nomorSurat: '070/DES/SMJ/III/2026/018', penerimaId: 7, namaPenerima: 'Eko Prasetyo', nikPenerima: '3201010101920007', tanggalSurat: '2026-03-28', isiSurat: 'SKU untuk pengajuan pinjaman modal usaha', status: 'dicetak', qrCodeData: 'SUR-018-SKU-20260328', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { jenisSurat: 'Surat Keterangan Belum Menikah', nomorSurat: '070/DES/SMJ/IV/2026/003', penerimaId: 9, namaPenerima: 'Rina Marlina', nikPenerima: '3201010101880009', tanggalSurat: '2026-04-02', isiSurat: 'Keterangan belum menikah untuk keperluan administrasi pernikahan', status: 'diproses', qrCodeData: 'SUR-003-BM-20260402', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  // Sample Masyarakat Miskin
  await db.masyarakatMiskin.bulkAdd([
    { kkId: 1, namaKK: 'Mbah Surip', level: 1, penghasilan: 0, jumlahTanggungan: 1, kondisiRumah: 'tidak layak', aksesKesehatan: 'tidak ada', aksesPendidikan: 'tidak ada', catatan: 'Lansia, tinggal sendiri, tidak punya penghasilan', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 2, namaKK: 'Karto Sentono', level: 1, penghasilan: 200000, jumlahTanggungan: 5, kondisiRumah: 'tidak layak', aksesKesehatan: 'tidak ada', aksesPendidikan: 'tidak ada', catatan: 'Petani dengan lahan sempit, rumah tidak layak huni', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 3, namaKK: 'Wartini', level: 2, penghasilan: 350000, jumlahTanggungan: 4, kondisiRumah: 'semi-tidak layak', aksesKesehatan: 'kurang', aksesPendidikan: 'sampai SD', catatan: 'Ibu rumah tangga, suami buruh harian lepas', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 4, namaKK: 'Tarno', level: 2, penghasilan: 450000, jumlahTanggungan: 3, kondisiRumah: 'semi-tidak layak', aksesKesehatan: 'kurang', aksesPendidikan: 'sampai SD', catatan: 'Buruh harian, tidak punya lahan, rumah rusak', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 5, namaKK: 'Haji Muhidin', level: 3, penghasilan: 700000, jumlahTanggungan: 3, kondisiRumah: 'layak', aksesKesehatan: 'kurang', aksesPendidikan: 'sampai SMP', catatan: 'Petani dengan lahan kecil, akses kesehatan terbatas', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 6, namaKK: 'Nadia Safitri', level: 3, penghasilan: 800000, jumlahTanggungan: 2, kondisiRumah: 'layak', aksesKesehatan: 'baik', aksesPendidikan: 'sampai SMP', catatan: 'Buruh harian, suami pedagang keliling', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 7, namaKK: 'Agus Riyanto', level: 4, penghasilan: 1100000, jumlahTanggungan: 3, kondisiRumah: 'layak', aksesKesehatan: 'baik', aksesPendidikan: 'sampai SMP', catatan: 'Nelayan, penghasilan tidak tetap tergantung musim', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 8, namaKK: 'Dimas Pratama', level: 4, penghasilan: 1200000, jumlahTanggungan: 4, kondisiRumah: 'layak', aksesKesehatan: 'baik', aksesPendidikan: 'semua', catatan: 'Keluarga buruh, rawan terdampak banjir', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 9, namaKK: 'Siti Khodijah', level: 3, penghasilan: 900000, jumlahTanggungan: 5, kondisiRumah: 'semi-tidak layak', aksesKesehatan: 'kurang', aksesPendidikan: 'sampai SD', catatan: 'Keluarga besar dengan banyak tanggungan', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { kkId: 10, namaKK: 'Jumadi', level: 1, penghasilan: 150000, jumlahTanggungan: 6, kondisiRumah: 'tidak layak', aksesKesehatan: 'tidak ada', aksesPendidikan: 'tidak ada', catatan: 'Tidak bekerja, rumah sangat rusak parah', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]);

  console.log('✅ Database seeded successfully');
}

export default db;
