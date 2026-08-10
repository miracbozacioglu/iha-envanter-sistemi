interface BrandMarkProps {
  className?: string;
}


export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Nişangâh halkası — dört yönde boşluk bırakan kesikli çember */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeOpacity="0.45"
        strokeDasharray="7 4.4"
        strokeDashoffset="3.5"
      />
      {/* Eksen çentikleri */}
      <path
        d="M16 1.6v3.4M16 27v3.4M1.6 16h3.4M27 16h3.4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeOpacity="0.7"
      />
      {/* Delta kanat */}
      <path
        d="M16 7.6 24.4 23.4 16 19.3 7.6 23.4 16 7.6Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
