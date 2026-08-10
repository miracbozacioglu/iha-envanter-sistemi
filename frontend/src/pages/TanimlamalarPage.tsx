import { Boxes, PlaneTakeoff, Radar, Truck, Warehouse, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { KaynakBolumu } from '../components/tanimlar/KaynakBolumu';
import {
  DepoFormu,
  IhaAraciFormu,
  IhaModeliFormu,
  KategoriFormu,
  TedarikciFormu,
} from '../components/tanimlar/TanimFormlari';
import { Rozet } from '../components/ui/Rozet';
import type { Depo, IhaAraci, IhaModeli, Kategori, Tedarikci } from '../types';

type SekmeAnahtari = 'kategoriler' | 'modeller' | 'araclar' | 'tedarikciler' | 'depolar';

interface Sekme {
  anahtar: SekmeAnahtari;
  etiket: string;
  ikon: LucideIcon;
}

const SEKMELER: Sekme[] = [
  { anahtar: 'kategoriler', etiket: 'Kategoriler', ikon: Boxes },
  { anahtar: 'modeller', etiket: 'İHA Modelleri', ikon: Radar },
  { anahtar: 'araclar', etiket: 'İHA Araçları', ikon: PlaneTakeoff },
  { anahtar: 'tedarikciler', etiket: 'Tedarikçiler', ikon: Truck },
  { anahtar: 'depolar', etiket: 'Depolar', ikon: Warehouse },
];

export function TanimlamalarPage() {
  const [sekme, setSekme] = useState<SekmeAnahtari>('kategoriler');

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <div
          role="tablist"
          aria-label="Tanım türleri"
          className="inline-flex min-w-full gap-1 rounded-lg border border-ink-700 bg-ink-900 p-1 sm:min-w-0"
        >
          {SEKMELER.map((s) => (
            <button
              key={s.anahtar}
              type="button"
              role="tab"
              aria-selected={sekme === s.anahtar}
              onClick={() => setSekme(s.anahtar)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium whitespace-nowrap transition sm:flex-none ${
                sekme === s.anahtar
                  ? 'bg-signal-500/12 text-signal-400'
                  : 'text-fog-500 hover:text-fog-300'
              }`}
            >
              <s.ikon className="size-4" strokeWidth={1.75} />
              {s.etiket}
            </button>
          ))}
        </div>
      </div>

      {sekme === 'kategoriler' && <KategorilerSekmesi />}
      {sekme === 'modeller' && <ModellerSekmesi />}
      {sekme === 'araclar' && <AraclarSekmesi />}
      {sekme === 'tedarikciler' && <TedarikcilerSekmesi />}
      {sekme === 'depolar' && <DepolarSekmesi />}
    </div>
  );
}

/** Tablo hücresi — tanım tablolarında tekrar eden hizalama. */
function Hucre({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function Bos() {
  return <span className="text-fog-700 italic">—</span>;
}

function KategorilerSekmesi() {
  return (
    <KaynakBolumu<Kategori>
      yol="kategoriler"
      tekil="Kategori"
      basliklar={['Ad', 'Açıklama']}
      etiket={(k) => k.ad}
      FormBileseni={KategoriFormu}
      bosBaslik="Henüz kategori yok"
      bosAciklama="Parçaları sınıflandırmak için ilk kategoriyi ekleyin."
      satir={(k) => (
        <>
          <Hucre className="font-medium text-fog-100">{k.ad}</Hucre>
          <Hucre className="text-fog-500">{k.aciklama ?? <Bos />}</Hucre>
        </>
      )}
    />
  );
}

function ModellerSekmesi() {
  return (
    <KaynakBolumu<IhaModeli>
      yol="iha-modelleri"
      tekil="İHA Modeli"
      basliklar={['Model', 'Üretici', 'Açıklama']}
      etiket={(m) => m.ad}
      FormBileseni={IhaModeliFormu}
      bosBaslik="Henüz İHA modeli yok"
      bosAciklama="Araçları ve parça uyumluluklarını tanımlayabilmek için bir model ekleyin."
      satir={(m) => (
        <>
          <Hucre className="font-medium text-fog-100">{m.ad}</Hucre>
          <Hucre className="text-fog-300">{m.uretici}</Hucre>
          <Hucre className="text-fog-500">{m.aciklama ?? <Bos />}</Hucre>
        </>
      )}
    />
  );
}

function AraclarSekmesi() {
  return (
    <KaynakBolumu<IhaAraci>
      yol="iha-araclari"
      tekil="İHA Aracı"
      basliklar={['Kuyruk no', 'Model', 'Durum', 'Açıklama']}
      etiket={(a) => a.kuyrukNo}
      FormBileseni={IhaAraciFormu}
      bosBaslik="Henüz İHA aracı yok"
      bosAciklama="Bakım kaydı tutabilmek için filoya bir araç ekleyin."
      satir={(a) => (
        <>
          <Hucre>
            <span className="font-mono text-xs text-signal-400">{a.kuyrukNo}</span>
          </Hucre>
          <Hucre className="text-fog-100">
            {a.ihaModeli ? (
              <>
                {a.ihaModeli.ad}{' '}
                <span className="text-xs text-fog-700">· {a.ihaModeli.uretici}</span>
              </>
            ) : (
              <Bos />
            )}
          </Hucre>
          <Hucre>
            <DurumRozeti durum={a.durum} />
          </Hucre>
          <Hucre className="text-fog-500">{a.aciklama ?? <Bos />}</Hucre>
        </>
      )}
    />
  );
}

function DurumRozeti({ durum }: { durum: string }) {
  const ton = durum === 'AKTIF' ? 'sinyal' : durum === 'BAKIMDA' ? 'uyari' : 'notr';

  return (
    <Rozet ton={ton} mono>
      {durum}
    </Rozet>
  );
}

function TedarikcilerSekmesi() {
  return (
    <KaynakBolumu<Tedarikci>
      yol="tedarikciler"
      tekil="Tedarikçi"
      basliklar={['Ad', 'Telefon', 'E-posta']}
      etiket={(t) => t.ad}
      FormBileseni={TedarikciFormu}
      bosBaslik="Henüz tedarikçi yok"
      bosAciklama="Sipariş oluşturabilmek için en az bir tedarikçi tanımlayın."
      satir={(t) => (
        <>
          <Hucre className="font-medium text-fog-100">{t.ad}</Hucre>
          <Hucre className="font-mono text-xs text-fog-500">{t.telefon ?? <Bos />}</Hucre>
          <Hucre className="text-fog-500">
            {t.email ? (
              <a href={`mailto:${t.email}`} className="transition hover:text-signal-400">
                {t.email}
              </a>
            ) : (
              <Bos />
            )}
          </Hucre>
        </>
      )}
    />
  );
}

function DepolarSekmesi() {
  return (
    <KaynakBolumu<Depo>
      yol="depolar"
      tekil="Depo"
      basliklar={['Ad', 'Lokasyon']}
      etiket={(d) => d.ad}
      FormBileseni={DepoFormu}
      bosBaslik="Henüz depo yok"
      bosAciklama="Stok girişi yapabilmek için en az bir depo tanımlanmalı."
      satir={(d) => (
        <>
          <Hucre className="font-medium text-fog-100">{d.ad}</Hucre>
          <Hucre className="text-fog-500">{d.lokasyon ?? <Bos />}</Hucre>
        </>
      )}
    />
  );
}
