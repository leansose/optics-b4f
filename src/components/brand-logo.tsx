const BRAND = "#42a5f5";
const BRAND_INK = "#1565c0";
const SURFACE = "#ffffff";

export function BrandLogo() {
  return (
    <svg
      viewBox="0 0 176 36"
      role="img"
      aria-labelledby="brand-logo-title"
      className="h-9 w-auto"
    >
      <title id="brand-logo-title">Opticmizer</title>
      <defs>
        <linearGradient id="brand-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BRAND} />
          <stop offset="100%" stopColor={BRAND_INK} />
        </linearGradient>
      </defs>
      <rect
        x="0.5"
        y="2"
        width="32"
        height="32"
        rx="10"
        fill="url(#brand-logo-gradient)"
      />
      <ellipse
        cx="16.5"
        cy="18"
        rx="11"
        ry="7.5"
        fill={SURFACE}
        opacity="0.96"
      />
      <circle cx="16.5" cy="18" r="4.2" fill={BRAND_INK} />
      <circle cx="18.4" cy="15.8" r="1.4" fill={SURFACE} />
      <path
        d="M8.5 14.5c2-2.6 4.7-3.7 7.6-3.7"
        fill="none"
        stroke={SURFACE}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.75"
      />
      <text
        x="43"
        y="24"
        fontFamily="var(--font-display), system-ui, sans-serif"
        fontSize="18"
        fontWeight="650"
        letterSpacing="-0.5"
        fill="var(--logo-wordmark)"
      >
        <tspan>Optic</tspan>
        <tspan fill={BRAND}>mizer</tspan>
      </text>
    </svg>
  );
}
