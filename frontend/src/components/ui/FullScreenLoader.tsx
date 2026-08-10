import { BrandMark } from './BrandMark';

interface FullScreenLoaderProps {
  mesaj?: string;
}

export function FullScreenLoader({ mesaj = 'Oturum doğrulanıyor' }: FullScreenLoaderProps) {
  return (
    <div className="hud-grid grid h-full place-items-center bg-ink-950">
      <div className="flex flex-col items-center gap-5">
        <span className="relative grid size-16 place-items-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-signal-500/25"
          />
          <span
            aria-hidden="true"
            className="hud-sweep absolute inset-0 rounded-full border-t border-signal-400"
          />
          <BrandMark className="size-8 text-signal-400" />
        </span>
        <p className="label-micro">{mesaj}</p>
      </div>
    </div>
  );
}
