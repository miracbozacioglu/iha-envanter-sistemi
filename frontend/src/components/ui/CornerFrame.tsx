interface CornerFrameProps {
  /** Köşe çizgilerinin uzunluğu (px). */
  size?: number;
  className?: string;
}

/**
 * HUD köşe parantezleri. Konumlandırma için üst öğede `relative` olmalı.
 * Sadece dekoratif; tıklamayı engellemez.
 */
export function CornerFrame({ size = 18, className = 'text-signal-400/50' }: CornerFrameProps) {
  const kenar = { width: size, height: size };

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <span className="absolute -top-px -left-px border-t border-l border-current" style={kenar} />
      <span className="absolute -top-px -right-px border-t border-r border-current" style={kenar} />
      <span
        className="absolute -bottom-px -left-px border-b border-l border-current"
        style={kenar}
      />
      <span
        className="absolute -right-px -bottom-px border-r border-b border-current"
        style={kenar}
      />
    </div>
  );
}
