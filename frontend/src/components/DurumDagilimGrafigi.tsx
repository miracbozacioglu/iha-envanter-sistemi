import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { TALEP_DURUM_BILGISI, TUM_DURUMLAR } from '../lib/talep';
import type { TalepDurumu } from '../types';

interface DurumDagilimGrafigiProps {
  dagilim: Record<TalepDurumu, number>;
}

interface Dilim {
  durum: TalepDurumu;
  etiket: string;
  deger: number;
  renk: string;
}

export function DurumDagilimGrafigi({ dagilim }: DurumDagilimGrafigiProps) {
  // Backend tüm durumları 0 ile doldurup gönderiyor; grafikte yalnızca
  // gerçekten kaydı olanları çiziyoruz, sıfırlar listede görünüyor.
  const dilimler: Dilim[] = TUM_DURUMLAR.map((durum) => ({
    durum,
    etiket: TALEP_DURUM_BILGISI[durum].etiket,
    deger: dagilim[durum] ?? 0,
    renk: TALEP_DURUM_BILGISI[durum].renk,
  }));

  const toplam = dilimler.reduce((t, d) => t + d.deger, 0);
  const cizilecek = dilimler.filter((d) => d.deger > 0);

  if (toplam === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <p className="text-sm font-medium text-fog-300">Henüz talep kaydı yok</p>
        <p className="max-w-xs text-xs leading-relaxed text-fog-700">
          Talepler açıldıkça durum dağılımı burada grafikleşir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-center">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={cizilecek}
              dataKey="deger"
              nameKey="etiket"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {cizilecek.map((dilim) => (
                // Renk bir CSS değişkeni; `fill` sunum niteliği yerine stille
                // veriliyor ki var() her tarayıcıda kesin çözülsün.
                <Cell key={dilim.durum} fill={dilim.renk} style={{ fill: dilim.renk }} />
              ))}
            </Pie>
            <Tooltip content={<DurumTooltip toplam={toplam} />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>

        {/* Halkanın ortasındaki toplam */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-mono text-2xl leading-none font-semibold text-fog-100 tabular-nums">
              {toplam}
            </p>
            <p className="label-micro mt-1.5 text-[0.5625rem]">Talep</p>
          </div>
        </div>
      </div>

      {/* Kendi lejandımız: recharts'ın varsayılanı iki temada da okunmuyor. */}
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {dilimler.map((dilim) => {
          const yuzde = toplam === 0 ? 0 : Math.round((dilim.deger / toplam) * 100);

          return (
            <li key={dilim.durum} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: dilim.renk, opacity: dilim.deger > 0 ? 1 : 0.3 }}
              />
              <span
                className={`min-w-0 flex-1 truncate text-xs ${
                  dilim.deger > 0 ? 'text-fog-300' : 'text-fog-700'
                }`}
              >
                {dilim.etiket}
              </span>
              <span className="font-mono text-xs text-fog-100 tabular-nums">{dilim.deger}</span>
              <span className="w-9 text-right font-mono text-[0.625rem] text-fog-700 tabular-nums">
                %{yuzde}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface TooltipYuku {
  payload?: { payload?: Dilim }[];
  active?: boolean;
  toplam: number;
}

function DurumTooltip({ active, payload, toplam }: TooltipYuku) {
  const dilim = payload?.[0]?.payload;
  if (!active || !dilim) return null;

  const yuzde = toplam === 0 ? 0 : Math.round((dilim.deger / toplam) * 100);

  return (
    <div className="rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 lift">
      <p className="flex items-center gap-2 text-xs text-fog-100">
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ backgroundColor: dilim.renk }}
        />
        {dilim.etiket}
      </p>
      <p className="mt-1 font-mono text-xs text-fog-500 tabular-nums">
        {dilim.deger} talep · %{yuzde}
      </p>
    </div>
  );
}
