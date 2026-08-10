import { Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useKaynakListesi, useKaynakMutasyonlari, type Kimlikli } from '../../hooks/useKaynak';
import { hataMesaji } from '../../lib/api';
import { Bos, Hata, Yukleniyor } from '../ui/DurumKutusu';
import { Modal } from '../ui/Modal';

export interface FormBileseniProps<T> {
  /** null ise ekleme, doluysa düzenleme. */
  kayit: T | null;
  onKapat: () => void;
}

interface KaynakBolumuProps<T extends Kimlikli> {
  /** API yolu ve query anahtarı, ör. "kategoriler". */
  yol: string;
  /** Tekil ad — başlıklarda kullanılır, ör. "Kategori". */
  tekil: string;
  basliklar: string[];
  satir: (kayit: T) => ReactNode;
  /** Silme onayında gösterilecek okunabilir ad. */
  etiket: (kayit: T) => string;
  FormBileseni: (props: FormBileseniProps<T>) => ReactNode;
  bosBaslik: string;
  bosAciklama: string;
}

export function KaynakBolumu<T extends Kimlikli>({
  yol,
  tekil,
  basliklar,
  satir,
  etiket,
  FormBileseni,
  bosBaslik,
  bosAciklama,
}: KaynakBolumuProps<T>) {
  const liste = useKaynakListesi<T>(yol);
  const { sil } = useKaynakMutasyonlari<T, unknown>(yol);

  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<T | null>(null);
  const [silinecek, setSilinecek] = useState<T | null>(null);
  const [silmeHatasi, setSilmeHatasi] = useState<string | null>(null);

  function ekle() {
    setDuzenlenen(null);
    setFormAcik(true);
  }

  function duzenle(kayit: T) {
    setDuzenlenen(kayit);
    setFormAcik(true);
  }

  function silmeyiSor(kayit: T) {
    setSilinecek(kayit);
    setSilmeHatasi(null);
  }

  async function silmeyiOnayla() {
    if (!silinecek) return;

    try {
      await sil.mutateAsync(silinecek.id);
      setSilinecek(null);
    } catch (error) {
      // FK kısıtı (400) burada yakalanır; modal açık kalıp mesajı gösterir.
      setSilmeHatasi(hataMesaji(error, 'Kayıt silinemedi.'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={ekle}
          className="inline-flex items-center gap-2 rounded-lg bg-signal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-400"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Yeni {tekil}
        </button>
      </div>

      <div className="panel overflow-hidden">
        {liste.isPending ? (
          <Yukleniyor mesaj={`${tekil} listesi yükleniyor`} />
        ) : liste.isError ? (
          <Hata
            mesaj={hataMesaji(liste.error)}
            onTekrarDene={() => {
              void liste.refetch();
            }}
          />
        ) : liste.data.length === 0 ? (
          <Bos baslik={bosBaslik} aciklama={bosAciklama} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-900/60">
                  {basliklar.map((baslik) => (
                    <th
                      key={baslik}
                      scope="col"
                      className="label-micro px-4 py-3 text-left font-normal whitespace-nowrap"
                    >
                      {baslik}
                    </th>
                  ))}
                  <th scope="col" className="w-24 px-4 py-3">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {liste.data.map((kayit) => (
                  <tr
                    key={kayit.id}
                    className="border-b border-ink-800 transition last:border-b-0 hover:bg-ink-800/50"
                  >
                    {satir(kayit)}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IslemDugmesi
                          etiket={`${etiket(kayit)} kaydını düzenle`}
                          onClick={() => duzenle(kayit)}
                        >
                          <Pencil className="size-3.5" strokeWidth={2} />
                        </IslemDugmesi>
                        <IslemDugmesi
                          etiket={`${etiket(kayit)} kaydını sil`}
                          tehlikeli
                          onClick={() => silmeyiSor(kayit)}
                        >
                          <Trash2 className="size-3.5" strokeWidth={2} />
                        </IslemDugmesi>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formAcik && (
        <Modal
          baslik={duzenlenen ? `${tekil} düzenle` : `Yeni ${tekil}`}
          altBaslik={duzenlenen ? etiket(duzenlenen) : undefined}
          onKapat={() => setFormAcik(false)}
        >
          <FormBileseni kayit={duzenlenen} onKapat={() => setFormAcik(false)} />
        </Modal>
      )}

      {silinecek && (
        <Modal
          baslik={`${tekil} sil`}
          onKapat={() => {
            setSilinecek(null);
            setSilmeHatasi(null);
          }}
        >
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-fog-300">
              <strong className="text-fog-100">{etiket(silinecek)}</strong> kaydı silinecek. Bu
              işlem geri alınamaz.
            </p>

            {silmeHatasi && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-danger-500/30 bg-danger-900/40 px-3.5 py-3"
              >
                <TriangleAlert
                  className="mt-px size-4 shrink-0 text-danger-400"
                  strokeWidth={1.75}
                />
                <p className="text-sm leading-relaxed text-danger-400">{silmeHatasi}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSilinecek(null);
                  setSilmeHatasi(null);
                }}
                className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-fog-500 transition hover:border-ink-500 hover:text-fog-300"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => void silmeyiOnayla()}
                disabled={sil.isPending}
                className="rounded-lg bg-danger-500 px-4 py-2.5 text-sm font-semibold text-fog-100 transition hover:bg-danger-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sil.isPending ? 'Siliniyor…' : 'Evet, sil'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function IslemDugmesi({
  etiket,
  onClick,
  tehlikeli = false,
  children,
}: {
  etiket: string;
  onClick: () => void;
  tehlikeli?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={etiket}
      aria-label={etiket}
      className={`rounded-md border border-transparent p-2 text-fog-700 transition hover:border-ink-600 ${
        tehlikeli ? 'hover:bg-danger-900/40 hover:text-danger-400' : 'hover:bg-ink-800 hover:text-fog-100'
      }`}
    >
      {children}
    </button>
  );
}
