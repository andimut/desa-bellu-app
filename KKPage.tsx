'use client';

import { useAppStore } from '@/lib/store';
import { KopSurat } from '@/components/layout/KopSurat';
import { QRCodeSVG } from 'qrcode.react';
import type { Surat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helper: generate default letter body based on jenis surat
// ---------------------------------------------------------------------------

function getDefaultLetterBody(jenis: string, nama: string, nik: string): string {
  const bodies: Record<string, string> = {
    'Surat Pengantar KTP': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang berdomisili di wilayah Desa Bellu. Surat pengantar ini dibuat untuk keperluan pengurusan pembuatan/perpanjangan Kartu Tanda Penduduk (KTP) di Kantor Kecamatan Salomekko.\n\nDemikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Pengantar KK': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang berdomisili di wilayah Desa Bellu. Surat pengantar ini dibuat untuk keperluan pengurusan Kartu Keluarga (KK) di Dinas Kependudukan dan Pencatatan Sipil Kabupaten Bone.\n\nDemikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Domisili': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan dengan sebenarnya bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar berdomisili di Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, Provinsi Sulawesi Selatan. Yang bersangkutan telah menetap dan tinggal di wilayah Desa Bellu sejak lahir.\n\nSurat keterangan domisili ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Tidak Mampu (SKTM)': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan dengan sebenarnya bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang termasuk dalam kategori keluarga tidak mampu. Berdasarkan data yang ada dan hasil verifikasi lapangan, yang bersangkutan memiliki penghasilan yang sangat terbatas dan tidak mampu untuk membiayai kebutuhan dasar secara layak.\n\nSurat Keterangan Tidak Mampu ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Usaha (SKU)': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan dengan sebenarnya bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang menjalankan usaha dagang di wilayah Desa Bellu. Usaha tersebut telah berjalan dan beroperasi secara aktif.\n\nSurat Keterangan Usaha ini dibuat untuk dapat dipergunakan sebagaimana mestinya, sebagai salah satu syarat administrasi.`,

    'Surat Keterangan Pindah': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang akan melakukan pemindahan penduduk dari Desa Bellu ke daerah tujuan. Yang bersangkutan telah melengkapi seluruh persyaratan administrasi yang diperlukan.\n\nDemikian surat keterangan pindah ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Lahir': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK Ibu\t: ${nik}\n\nAdalah benar telah dilahirkan di Desa Bellu, Kecamatan Salomekko, Kabupaten Bone. Surat keterangan ini dibuat sebagai bukti kelahiran yang akan digunakan untuk pengurusan Akta Kelahiran di Dinas Kependudukan dan Pencatatan Sipil.\n\nDemikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Kematian': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar telah meninggal dunia di Desa Bellu, Kecamatan Salomekko, Kabupaten Bone. Surat keterangan ini dibuat sebagai bukti kematian yang sah untuk keperluan administrasi kelanjutan.\n\nDemikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Belum Menikah': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan dengan sebenarnya bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang berstatus belum menikah (belum pernah melakukan pernikahan). Berdasarkan data administrasi kependudukan yang ada di Desa Bellu, tidak ditemukan catatan pernikahan atas nama yang bersangkutan.\n\nDemikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Penghasilan': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan dengan sebenarnya bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang memiliki penghasilan rata-rata per bulan yang sesuai dengan data yang tercatat. Keterangan ini dibuat berdasarkan laporan dari yang bersangkutan dan data yang tersedia di kantor Desa.\n\nDemikian surat keterangan penghasilan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Pengantar SKCK': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang berkelakuan baik dan belum pernah terlibat tindak pidana. Selama berdomisili di Desa Bellu, yang bersangkutan dikenal sebagai warga yang patuh terhadap hukum dan norma sosial.\n\nSurat pengantar ini dibuat untuk keperluan pengurusan Surat Keterangan Catatan Kepolisian (SKCK) di Kepolisian Sektor Salomekko.\n\nDemikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan RT/RW': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang berdomisili di wilayah Desa Bellu. Surat keterangan ini dibuat sebagai bukti resmi kependudukan dari Rukun Tetangga/Rukun Warga setempat.\n\nDemikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Bebas Narkoba': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang selama ini dikenal baik dan tidak pernah terlibat dalam penyalahgunaan narkotika dan obat-obatan terlarang. Berdasarkan informasi dari RT/RW setempat, yang bersangkutan berperilaku positif.\n\nDemikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Orang Tua': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan dengan sebenarnya bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang merupakan orang tua/wali dari seorang anak. Keterangan ini dibuat sebagai bukti hubungan kekeluargaan yang sah sesuai dengan data administrasi kependudukan di Desa Bellu.\n\nDemikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Waris': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar ahli waris yang sah dari almarhum/almarhumah sesuai dengan hukum waris yang berlaku. Keterangan ini dibuat berdasarkan musyawarah keluarga dan kesepakatan para ahli waris.\n\nDemikian surat keterangan waris ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Tanah': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar memiliki/menguasai sebidang tanah yang terletak di wilayah Desa Bellu. Tanah tersebut telah dimiliki dan dikuasai secara turun-temurun sejak lama.\n\nDemikian surat keterangan tanah ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Izin Keramaian': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini memberikan izin kepada:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nUntuk menyelenggarakan kegiatan keramaian di wilayah Desa Bellu. Kegiatan tersebut wajib mematuhi peraturan dan ketentuan yang berlaku serta menjaga ketertiban dan kebersihan lingkungan.\n\nDemikian surat izin keramaian ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Izin Usaha Mikro': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini memberikan izin kepada:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nUntuk menjalankan usaha mikro di wilayah Desa Bellu. Usaha tersebut wajib mematuhi peraturan daerah dan peraturan desa yang berlaku.\n\nDemikian surat izin usaha mikro ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Keterangan Jamkesos': `Yang bertanda tahan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini menerangkan dengan sebenarnya bahwa:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nAdalah benar warga Desa Bellu yang termasuk dalam kategori keluarga kurang mampu dan berhak mendapatkan bantuan Jaminan Kesehatan Sosial (Jamkesos) dari pemerintah.\n\nDemikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,

    'Surat Rekomendasi Bantuan': `Yang bertanda tangan di bawah ini, Kepala Desa Bellu, Kecamatan Salomekko, Kabupaten Bone, dengan ini merekomendasikan:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nUntuk dapat menerima bantuan dari pemerintah/sumber terkait. Berdasarkan data yang ada dan hasil musyawarah desa, yang bersangkutan memenuhi kriteria sebagai penerima bantuan.\n\nDemikian surat rekomendasi ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`,
  };

  return bodies[jenis] || `Surat ${jenis} ini diberikan kepada:\n\nNama\t: ${nama}\nNIK\t\t: ${nik}\n\nDemikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`;
}

// ---------------------------------------------------------------------------
// Format date in Indonesian
// ---------------------------------------------------------------------------

function formatTanggalIndo(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CetakSuratProps {
  surat: Surat;
}

export function CetakSuratContent({ surat }: CetakSuratProps) {
  const villageProfile = useAppStore((s) => s.villageProfile);

  // Determine the letter body
  const isGeneric = surat.isiSurat.startsWith('Surat ') && surat.isiSurat.includes(' untuk ');
  const letterBody = isGeneric
    ? getDefaultLetterBody(surat.jenisSurat, surat.namaPenerima, surat.nikPenerima)
    : surat.isiSurat;

  const tanggalFormatted = formatTanggalIndo(surat.tanggalSurat);
  const namaDesa = villageProfile?.namaDesa || 'Bellu';
  const namaKades = villageProfile?.namaKepalaDesa || 'Kepala Desa Bellu';
  const nipKades = villageProfile?.nipKepalaDesa || '-';

  return (
    <div
      className="print-area bg-white shadow-xl mx-auto"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 25mm',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '12pt',
        lineHeight: '1.6',
        color: '#000',
      }}
    >
      {/* Kop Surat */}
      <div className="border-b-[3px] border-black pb-3 mb-6">
        <div className="flex items-start justify-between">
          {/* Logo Kabupaten */}
          <div className="flex-shrink-0 w-[70px] h-[70px] rounded-full border border-gray-400 flex items-center justify-center bg-white overflow-hidden">
            {villageProfile?.logoKabupaten ? (
              <img src={villageProfile.logoKabupaten} alt="Logo Kabupaten" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[9px] text-gray-500 text-center leading-tight font-bold">LOGO<br/>KAB.</span>
            )}
          </div>

          {/* Header Text */}
          <div className="text-center flex-1 px-4">
            <p className="text-[10pt] font-medium tracking-wider uppercase">Pemerintah</p>
            <h1 className="text-[14pt] font-bold tracking-wide">
              KABUPATEN {villageProfile?.namaKabupaten?.toUpperCase() || 'BONE'}
            </h1>
            <p className="text-[11pt] font-medium">KECAMATAN {villageProfile?.namaKecamatan?.toUpperCase() || 'SALOMEKKO'}</p>
            <h2 className="text-[16pt] font-bold tracking-wide">
              DESA {villageProfile?.namaDesa?.toUpperCase() || 'BELLU'}
            </h2>
            <p className="text-[9pt] text-gray-600 mt-0.5">
              {villageProfile?.alamat || 'Desa Bellu, Kec. Salomekko, Kab. Bone'}
              {villageProfile?.telepon ? ` | Telp: ${villageProfile.telepon}` : ''}
              {villageProfile?.kodePos ? ` | Kode Pos: ${villageProfile.kodePos}` : ''}
            </p>
          </div>

          {/* Logo Desa */}
          <div className="flex-shrink-0 w-[70px] h-[70px] rounded-full border border-gray-400 flex items-center justify-center bg-white overflow-hidden">
            {villageProfile?.logoDesa ? (
              <img src={villageProfile.logoDesa} alt="Logo Desa" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[9px] text-gray-500 text-center leading-tight font-bold">LOGO<br/>DESA</span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
          {surat.jenisSurat.toUpperCase()}
        </h3>
        <p className="text-[9pt] text-gray-500 mt-0.5">Nomor: {surat.nomorSurat}</p>
      </div>

      {/* Letter Meta */}
      <div className="mb-6" style={{ fontSize: '11pt' }}>
        <table className="w-auto" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td className="pr-2 align-top" style={{ width: '100px', verticalAlign: 'top' }}>Nomor</td>
              <td className="pr-2" style={{ verticalAlign: 'top' }}>:</td>
              <td style={{ verticalAlign: 'top' }}>{surat.nomorSurat}</td>
            </tr>
            <tr>
              <td className="pr-2" style={{ verticalAlign: 'top' }}>Lampiran</td>
              <td className="pr-2" style={{ verticalAlign: 'top' }}>:</td>
              <td style={{ verticalAlign: 'top' }}>-</td>
            </tr>
            <tr>
              <td className="pr-2" style={{ verticalAlign: 'top' }}>Perihal</td>
              <td className="pr-2" style={{ verticalAlign: 'top' }}>:</td>
              <td style={{ verticalAlign: 'top' }}>{surat.jenisSurat}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Addressee */}
      <div className="mb-6" style={{ fontSize: '11pt' }}>
        <p className="mb-1">Kepada Yth,</p>
        <p className="font-semibold ml-4">Bapak/Ibu {surat.namaPenerima}</p>
        <p className="ml-4">NIK: {surat.nikPenerima}</p>
        <p className="ml-4">di Tempat</p>
      </div>

      {/* Salutation */}
      <div className="mb-4" style={{ fontSize: '11pt' }}>
        <p>Assalamu&apos;alaikum Wr. Wb.</p>
      </div>

      {/* Letter Body */}
      <div className="mb-6 text-justify whitespace-pre-line" style={{ fontSize: '11pt', lineHeight: '1.8' }}>
        {letterBody}
      </div>

      {/* Closing */}
      <div className="mb-6" style={{ fontSize: '11pt' }}>
        <p>Wassalamu&apos;alaikum Wr. Wb.</p>
      </div>

      {/* Signature */}
      <div className="flex justify-end mt-12" style={{ fontSize: '11pt' }}>
        <div className="text-center" style={{ width: '250px' }}>
          <p>{namaDesa}, {tanggalFormatted}</p>
          <p className="font-semibold mt-1">Kepala Desa {namaDesa}</p>
          <div className="mt-16">
            <p className="font-bold underline">{namaKades}</p>
            {nipKades !== '-' && (
              <p className="text-[9pt] mt-0.5">NIP: {nipKades}</p>
            )}
          </div>
        </div>
      </div>

      {/* QR Code */}
      {surat.qrCodeData && (
        <div className="flex justify-center mt-8">
          <div className="text-center">
            <QRCodeSVG value={surat.qrCodeData} size={80} level="M" />
            <p className="text-[7pt] text-gray-500 mt-1 font-mono">{surat.qrCodeData}</p>
            <p className="text-[7pt] text-gray-500">QR Code Verifikasi</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function CetakSuratPage() {
  const suratToPrint = useAppStore((s) => s.suratToPrint);
  const setSuratToPrint = useAppStore((s) => s.setSuratToPrint);
  const navigate = useAppStore((s) => s.navigate);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    setSuratToPrint(null);
    navigate('surat');
  };

  if (!suratToPrint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Tidak ada surat untuk dicetak.</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="size-4 mr-2" />
          Kembali ke Administrasi Surat
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Action Bar - hidden on print */}
      <div className="no-print sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="size-4 mr-1.5" />
              Kembali
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Cetak Surat</h1>
              <p className="text-xs text-muted-foreground">
                {suratToPrint.jenisSurat} &mdash; {suratToPrint.nomorSurat}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handlePrint}
          >
            <Printer className="size-4 mr-1.5" />
            Cetak / Print
          </Button>
        </div>
      </div>

      {/* Paper Preview */}
      <div className="max-w-5xl mx-auto py-8 px-4">
        <CetakSuratContent surat={suratToPrint} />
      </div>
    </div>
  );
}
