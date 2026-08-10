/**
 * Form girdilerinin ortak sınıf demeti; hata durumunda kenarlık kırmızıya döner.
 * Bileşen dosyasından ayrı duruyor ki fast-refresh yalnızca bileşen export eden
 * dosyalarda çalışabilsin.
 */
export function girdiSinifi(hataVar: boolean, ek = ''): string {
  return `w-full rounded-lg border bg-ink-850 px-3.5 py-2.5 text-sm text-fog-100 transition placeholder:text-fog-700 hover:border-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500/15 ${
    hataVar
      ? 'border-danger-500/50 focus:border-danger-500/70'
      : 'border-ink-600 focus:border-signal-500/60'
  } ${ek}`;
}
