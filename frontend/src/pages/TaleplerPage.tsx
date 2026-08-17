import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TalepDurumStepper } from '../components/TalepDurumStepper';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { useAuth } from '../hooks/useAuth';
import { useTalepler } from '../hooks/useTalepler';
import { hataMesaji } from '../lib/api';
import { TALEP_DURUM_BILGISI, TUM_DURUMLAR, tarihSaatYaz } from '../lib/talep';
import type { TalepDurumu, TalepOzet } from '../types';

type DurumFiltresi = TalepDurumu | 'HEPSI';

export function TaleplerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const yonetici = user?.rol === 'YONETICI';
  // Talep açma backend'de yalnızca teknisyene açık; buton da öyle olmalı.
  const teknisyen = user?.rol === 'TEKNISYEN';

  const [filtre, setFiltre] = useState<DurumFiltresi>('HEPSI');
  const talepler = useTalepler(filtre === 'HEPSI' ? undefined : filtre);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="overflow-x-auto">
          <div
            role="tablist"
            aria-label="Durum filtresi"
            className="inline-flex gap-1 rounded-lg border border-ink-700 bg-ink-900 p-1"
          >
            <FiltreDugmesi
              aktif={filtre === 'HEPSI'}
              onClick={() => setFiltre('HEPSI')}
              etiket="Hepsi"
              sinif="bg-ink-700 text-fog-100"
            />
            {TUM_DURUMLAR.map((durum) => (
              <FiltreDugmesi
                key={durum}
                aktif={filtre === durum}
                onClick={() => setFiltre(durum)}
                etiket={TALEP_DURUM_BILGISI[durum].etiket}
                sinif={TALEP_DURUM_BILGISI[durum].dolu}
              />
            ))}
          </div>
        </div>

        {teknisyen && (
          <Link
            to="/talepler/yeni"
            className="inline-flex items-center gap-2 rounded-lg bg-signal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-400"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Yeni Talep
          </Link>
        )}
      </div>

      <div className="panel overflow-hidden">
        {talepler.isPending ? (
          <Yukleniyor mesaj="Talepler yükleniyor" />
        ) : talepler.isError ? (
          <Hata
            mesaj={hataMesaji(talepler.error)}
            onTekrarDene={() => {
              void talepler.refetch();
            }}
          />
        ) : talepler.data.length === 0 ? (
          <Bos
            baslik={filtre === 'HEPSI' ? 'Henüz talep yok' : 'Bu durumda talep yok'}
            aciklama={
              filtre === 'HEPSI'
                ? 'İhtiyaç duyulan parçalar için ilk talebi açın.'
                : 'Başka bir durum filtresi seçmeyi deneyin.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-900/60">
                  <Baslik className="w-20">No</Baslik>
                  <Baslik>Parça</Baslik>
                  <Baslik className="w-24 text-right">Miktar</Baslik>
                  {yonetici && <Baslik className="w-40">Talep eden</Baslik>}
                  <Baslik className="w-40">Tarih</Baslik>
                  <Baslik className="w-52">Durum</Baslik>
                </tr>
              </thead>
              <tbody>
                {talepler.data.map((talep) => (
                  <TalepSatiri
                    key={talep.id}
                    talep={talep}
                    yonetici={yonetici}
                    onAc={() => navigate(`/talepler/${talep.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!yonetici && (
        <p className="text-xs leading-relaxed text-fog-700">
          Teknisyen olarak yalnızca kendi açtığınız talepleri görüyorsunuz.
        </p>
      )}
    </div>
  );
}

function TalepSatiri({
  talep,
  yonetici,
  onAc,
}: {
  talep: TalepOzet;
  yonetici: boolean;
  onAc: () => void;
}) {
  return (
    <tr
      onClick={onAc}
      className="cursor-pointer border-b border-ink-800 transition last:border-b-0 hover:bg-ink-800/60"
    >
      <td className="px-4 py-3">
        {/* Klavye ve ekran okuyucular için gerçek bağlantı */}
        <Link
          to={`/talepler/${talep.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-signal-400 transition hover:text-signal-300"
        >
          #{talep.id}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-fog-500">{talep.parca.kod}</span>
          <span className="text-fog-100">{talep.parca.ad}</span>
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono text-fog-100 tabular-nums">
        {talep.miktar}
        <span className="ml-1 text-xs text-fog-700">{talep.parca.birim}</span>
      </td>
      {yonetici && (
        <td className="px-4 py-3 whitespace-nowrap text-fog-300">
          {talep.teknisyen.ad} {talep.teknisyen.soyad}
        </td>
      )}
      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-fog-500 tabular-nums">
        {tarihSaatYaz(talep.olusturma)}
      </td>
      <td className="px-4 py-3">
        <TalepDurumStepper durum={talep.durum} redSebebi={talep.redSebebi} kompakt />
      </td>
    </tr>
  );
}

function FiltreDugmesi({
  aktif,
  onClick,
  etiket,
  sinif,
}: {
  aktif: boolean;
  onClick: () => void;
  etiket: string;
  sinif: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={aktif}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
        aktif ? sinif : 'text-fog-500 hover:text-fog-300'
      }`}
    >
      {etiket}
    </button>
  );
}

function Baslik({ children, className = '' }: { children: string; className?: string }) {
  return (
    <th
      scope="col"
      className={`label-micro px-4 py-3 text-left font-normal whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}
