import { STOK_DURUM_BILGISI, type StokDurumu } from '../../lib/stok';

interface StokRozetiProps {
  durum: StokDurumu;
  /** Stok toplamı kesin bilinmiyorsa rozet soluklaşır. */
  tahmini?: boolean;
  title?: string;
}

export function StokRozeti({ durum, tahmini = false, title }: StokRozetiProps) {
  const bilgi = STOK_DURUM_BILGISI[durum];

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[0.625rem] tracking-[0.1em] uppercase ${bilgi.sinif} ${
        tahmini ? 'opacity-70' : ''
      }`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${bilgi.nokta}`} />
      {bilgi.etiket}
    </span>
  );
}
