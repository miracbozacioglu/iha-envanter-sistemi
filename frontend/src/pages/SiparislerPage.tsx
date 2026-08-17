import { PackageCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bos, Hata, Yukleniyor } from '../components/ui/DurumKutusu';
import { Rozet } from '../components/ui/Rozet';
import { useSiparisler } from '../hooks/useTalepler';
import { hataMesaji } from '../lib/api';
import { paraYaz, tarihSaatYaz } from '../lib/talep';
import type { SiparisDetay } from '../types';
import { TeslimAlModali } from './TalepDetayPage';

export function SiparislerPage() {
  const siparisler = useSiparisler();
  const [teslimAlinacak, setTeslimAlinacak] = useState<SiparisDetay | null>(null);

  const bekleyen = (siparisler.data ?? []).filter((s) => !s.teslimAlindi).length;

  return (
    <div className="space-y-5">
      <div className="panel overflow-hidden">
        <header className="flex items-center gap-2.5 border-b border-ink-700 px-5 py-3">
          <Truck className="size-4 text-fog-700" strokeWidth={1.75} />
          <h2 className="label-micro flex-1">Tedarikçi siparişleri</h2>
          {siparisler.data && bekleyen > 0 && (
            <Rozet ton="bilgi" mono>
              {bekleyen} teslim bekliyor
            </Rozet>
          )}
        </header>

        {siparisler.isPending ? (
          <Yukleniyor mesaj="Siparişler yükleniyor" />
        ) : siparisler.isError ? (
          <Hata
            mesaj={hataMesaji(siparisler.error)}
            onTekrarDene={() => {
              void siparisler.refetch();
            }}
          />
        ) : siparisler.data.length === 0 ? (
          <Bos
            baslik="Henüz sipariş yok"
            aciklama="Onaylanmış bir talepten sipariş oluşturduğunuzda burada listelenir."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-900/60">
                  <Baslik className="w-20">No</Baslik>
                  <Baslik>Parça</Baslik>
                  <Baslik className="w-44">Tedarikçi</Baslik>
                  <Baslik className="w-24 text-right">Miktar</Baslik>
                  <Baslik className="w-32 text-right">Birim fiyat</Baslik>
                  <Baslik className="w-32 text-right">Toplam</Baslik>
                  <Baslik className="w-40">Sipariş tarihi</Baslik>
                  <Baslik className="w-36">Durum</Baslik>
                  <th scope="col" className="w-28 px-4 py-3">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {siparisler.data.map((siparis) => (
                  <SiparisSatiri
                    key={siparis.id}
                    siparis={siparis}
                    onTeslimAl={() => setTeslimAlinacak(siparis)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {teslimAlinacak && (
        <TeslimAlModali
          siparisId={teslimAlinacak.id}
          onKapat={() => setTeslimAlinacak(null)}
        />
      )}
    </div>
  );
}

function SiparisSatiri({
  siparis,
  onTeslimAl,
}: {
  siparis: SiparisDetay;
  onTeslimAl: () => void;
}) {
  const toplam =
    siparis.birimFiyat === null ? null : String(Number(siparis.birimFiyat) * siparis.miktar);

  return (
    <tr className="border-b border-ink-800 transition last:border-b-0 hover:bg-ink-800/50">
      <td className="px-4 py-3 font-mono text-xs text-fog-500">#{siparis.id}</td>
      <td className="px-4 py-3">
        {/* Sipariş talebe bağlı; satırdan talep detayına geçilebiliyor. */}
        <Link to={`/talepler/${siparis.talepId}`} className="group flex items-center gap-2">
          <span className="font-mono text-xs text-signal-400 transition group-hover:text-signal-300">
            {siparis.talep.parca.kod}
          </span>
          <span className="text-fog-100">{siparis.talep.parca.ad}</span>
        </Link>
      </td>
      <td className="px-4 py-3 text-fog-300">{siparis.tedarikci.ad}</td>
      <td className="px-4 py-3 text-right font-mono text-fog-100 tabular-nums">
        {siparis.miktar}
      </td>
      <td className="px-4 py-3 text-right font-mono text-fog-500 tabular-nums">
        {paraYaz(siparis.birimFiyat)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-fog-300 tabular-nums">
        {paraYaz(toplam)}
      </td>
      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-fog-500 tabular-nums">
        {tarihSaatYaz(siparis.siparisTarihi)}
      </td>
      <td className="px-4 py-3">
        {siparis.teslimAlindi ? (
          <Rozet ton="basari" mono>
            Teslim alındı
          </Rozet>
        ) : (
          <Rozet ton="bilgi" mono>
            Yolda
          </Rozet>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {!siparis.teslimAlindi && (
          <button
            type="button"
            onClick={onTeslimAl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-success-500/40 bg-success-900/40 px-3 py-2 text-xs font-semibold text-success-400 transition hover:bg-success-900/70"
          >
            <PackageCheck className="size-3.5" strokeWidth={2} />
            Teslim al
          </button>
        )}
      </td>
    </tr>
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
