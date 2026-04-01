'use client';

import { useAppStore } from '@/lib/store';

export function KopSurat() {
  const villageProfile = useAppStore((s) => s.villageProfile);

  return (
    <div className="border-b-2 border-double border-gray-800 pb-4 mb-4">
      <div className="flex items-start justify-between">
        {/* Logo Kabupaten */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
          {villageProfile?.logoKabupaten ? (
            <img src={villageProfile.logoKabupaten} alt="Logo Kabupaten" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-gray-400 text-center leading-tight">LOGO<br/>KAB.</span>
          )}
        </div>

        {/* Header Text */}
        <div className="text-center flex-1 px-4">
          <p className="text-[11px] font-medium tracking-wider uppercase">Pemerintah</p>
          <h1 className="text-sm font-bold tracking-wide">
            KABUPATEN {villageProfile?.namaKabupaten?.toUpperCase() || 'BONE'}
          </h1>
          <p className="text-[11px] font-medium">KECAMATAN {villageProfile?.namaKecamatan?.toUpperCase() || 'SALOMEKKO'}</p>
          <h2 className="text-base font-bold tracking-wide">
            DESA {villageProfile?.namaDesa?.toUpperCase() || 'BELLU'}
          </h2>
          <p className="text-[9px] text-gray-600 mt-0.5">
            {villageProfile?.alamat || 'Desa Bellu, Kec. Salomekko, Kab. Bone'}
            {villageProfile?.telepon ? ` | Telp: ${villageProfile.telepon}` : ''}
            {villageProfile?.kodePos ? ` | Kode Pos: ${villageProfile.kodePos}` : ''}
          </p>
        </div>

        {/* Logo Desa */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
          {villageProfile?.logoDesa ? (
            <img src={villageProfile.logoDesa} alt="Logo Desa" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-gray-400 text-center leading-tight">LOGO<br/>DESA</span>
          )}
        </div>
      </div>
    </div>
  );
}
