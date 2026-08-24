import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface TemaDugmesiProps {
  className?: string;
}

/**
 * İkon, mevcut temayı değil geçilecek temayı gösterir: koyudayken güneş
 * (aydınlığa geç), açıktayken ay (karanlığa geç).
 */
export function TemaDugmesi({ className = '' }: TemaDugmesiProps) {
  const { tema, temaDegistir } = useTheme();
  const koyu = tema === 'dark';
  const etiket = koyu ? 'Açık temaya geç' : 'Koyu temaya geç';

  return (
    <button
      type="button"
      onClick={temaDegistir}
      title={etiket}
      aria-label={etiket}
      className={`grid size-9 shrink-0 place-items-center rounded-lg border border-ink-700 text-fog-500 transition hover:border-signal-500/40 hover:bg-ink-800 hover:text-signal-400 ${className}`}
    >
      {koyu ? (
        <Sun className="size-4" strokeWidth={1.75} />
      ) : (
        <Moon className="size-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
