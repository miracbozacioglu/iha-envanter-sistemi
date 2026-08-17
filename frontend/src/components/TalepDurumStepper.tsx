import { Check, CircleDot, Truck, XCircle, type LucideIcon } from 'lucide-react';
import type { TalepDurumu } from '../types';
import { TALEP_AKISI, TALEP_DURUM_BILGISI, type AkisDurumu } from '../lib/talep';

interface TalepDurumStepperProps {
  durum: TalepDurumu;
  /** REDDEDILDI durumunda gösterilir. */
  redSebebi?: string | null;
  /** Tablo satırları için sadeleştirilmiş görünüm. */
  kompakt?: boolean;
}

export function TalepDurumStepper({
  durum,
  redSebebi,
  kompakt = false,
}: TalepDurumStepperProps) {
  if (durum === 'REDDEDILDI') {
    return <Reddedildi redSebebi={redSebebi} kompakt={kompakt} />;
  }

  // durum burada REDDEDILDI olamaz (yukarıda ayrıldı), akışta mutlaka yer alır.
  const mevcutSira = TALEP_AKISI.indexOf(durum as AkisDurumu);

  if (kompakt) {
    return (
      <span className="flex items-center gap-2">
        <span className="flex items-center gap-1" aria-hidden="true">
          {TALEP_AKISI.map((adim, sira) => (
            <span
              key={adim}
              className={`size-1.5 rounded-full transition ${
                sira <= mevcutSira ? TALEP_DURUM_BILGISI[durum].cizgi : 'bg-ink-600'
              }`}
            />
          ))}
        </span>
        <span
          className={`font-mono text-[0.625rem] tracking-[0.1em] uppercase ${TALEP_DURUM_BILGISI[durum].metin}`}
        >
          {TALEP_DURUM_BILGISI[durum].etiket}
        </span>
      </span>
    );
  }

  return (
    <ol className="flex items-start">
      {TALEP_AKISI.map((adim, sira) => {
        const tamamlandi = sira < mevcutSira;
        const aktif = sira === mevcutSira;
        const bilgi = TALEP_DURUM_BILGISI[adim];
        const Icon = ADIM_IKONU[adim];

        return (
          <li key={adim} className="flex min-w-0 flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              {/* Sol bağlantı: ilk adımda görünmez, hizayı korumak için yer tutar */}
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${sira === 0 ? 'opacity-0' : ''} ${
                  sira <= mevcutSira ? TALEP_DURUM_BILGISI[durum].cizgi : 'bg-ink-700'
                }`}
              />

              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full border transition ${
                  tamamlandi || aktif ? bilgi.dolu : 'border-ink-600 bg-ink-850 text-fog-700'
                } ${aktif ? 'ring-2 ring-offset-2 ring-offset-ink-900 ' + halkaSinifi(adim) : ''}`}
              >
                {tamamlandi ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <Icon className="size-4" strokeWidth={2} />
                )}
              </span>

              <span
                aria-hidden="true"
                className={`h-px flex-1 ${sira === TALEP_AKISI.length - 1 ? 'opacity-0' : ''} ${
                  sira < mevcutSira ? TALEP_DURUM_BILGISI[durum].cizgi : 'bg-ink-700'
                }`}
              />
            </div>

            <span
              className={`mt-2.5 px-1 text-center font-mono text-[0.625rem] leading-tight tracking-[0.08em] uppercase ${
                aktif ? bilgi.metin : tamamlandi ? 'text-fog-500' : 'text-fog-700'
              }`}
            >
              {bilgi.etiket}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const ADIM_IKONU: Record<AkisDurumu, LucideIcon> = {
  BEKLIYOR: CircleDot,
  ONAYLANDI: Check,
  SIPARIS_VERILDI: Truck,
  TESLIM_ALINDI: Check,
};

function halkaSinifi(durum: TalepDurumu): string {
  switch (durum) {
    case 'BEKLIYOR':
      return 'ring-alert-400/30';
    case 'ONAYLANDI':
      return 'ring-signal-500/30';
    case 'SIPARIS_VERILDI':
      return 'ring-info-500/30';
    default:
      return 'ring-success-500/30';
  }
}

function Reddedildi({ redSebebi, kompakt }: { redSebebi?: string | null; kompakt: boolean }) {
  const bilgi = TALEP_DURUM_BILGISI.REDDEDILDI;

  if (kompakt) {
    return (
      <span className="flex items-center gap-2">
        <XCircle className={`size-3.5 ${bilgi.metin}`} strokeWidth={2} />
        <span
          className={`font-mono text-[0.625rem] tracking-[0.1em] uppercase ${bilgi.metin}`}
        >
          {bilgi.etiket}
        </span>
      </span>
    );
  }

  return (
    <div className="flex items-start gap-3.5 rounded-lg border border-danger-500/30 bg-danger-900/40 px-4 py-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-danger-500/60 bg-danger-900/70 text-danger-400">
        <XCircle className="size-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="label-micro text-danger-400">{bilgi.etiket}</p>
        <p className="mt-2 text-sm leading-relaxed text-fog-300">
          {redSebebi?.trim() ? redSebebi : 'Red sebebi belirtilmemiş.'}
        </p>
      </div>
    </div>
  );
}
