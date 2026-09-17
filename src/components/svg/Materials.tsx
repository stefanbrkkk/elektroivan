/**
 * Shared SVG material definitions for the dimensional illustration language
 * (docs/DESIGN.md §2). Render `<Materials />` once inside each inline <svg>
 * that uses these ids; identical defs in several SVGs are harmless.
 * Light comes from the top-left everywhere.
 */
export function Materials() {
  return (
    <defs>
      <linearGradient id="m-copper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F6C08B" />
        <stop offset="0.45" stopColor="#C96A2C" />
        <stop offset="1" stopColor="#7A3B12" />
      </linearGradient>
      <linearGradient id="m-brass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F2D98A" />
        <stop offset="1" stopColor="#B8912E" />
      </linearGradient>
      <linearGradient id="m-polymer-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2A2F3D" />
        <stop offset="1" stopColor="#151823" />
      </linearGradient>
      <linearGradient id="m-polymer-light" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F3F1EA" />
        <stop offset="1" stopColor="#C9C7BE" />
      </linearGradient>
      <linearGradient id="m-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#D7DBE3" />
        <stop offset="0.5" stopColor="#8A8F9C" />
        <stop offset="1" stopColor="#5C616D" />
      </linearGradient>
      <linearGradient id="m-ins-blue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6BA8FF" />
        <stop offset="1" stopColor="#2C5FBF" />
      </linearGradient>
      <linearGradient id="m-ins-brown" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#A8663A" />
        <stop offset="1" stopColor="#5E3418" />
      </linearGradient>
      <pattern id="m-ins-ye-gn" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="4" height="8" fill="#F1D33B" />
        <rect x="4" width="4" height="8" fill="#3FA34D" />
      </pattern>
      <pattern id="m-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#8FD8FF" strokeOpacity="0.25" strokeWidth="1" />
      </pattern>
      <radialGradient id="m-glow-volt" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFD36A" stopOpacity="0.9" />
        <stop offset="0.5" stopColor="#FFB92B" stopOpacity="0.35" />
        <stop offset="1" stopColor="#FFB92B" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="m-glow-arc" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="0.4" stopColor="#8FD8FF" stopOpacity="0.45" />
        <stop offset="1" stopColor="#8FD8FF" stopOpacity="0" />
      </radialGradient>
      <filter id="m-soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
      </filter>
    </defs>
  );
}
