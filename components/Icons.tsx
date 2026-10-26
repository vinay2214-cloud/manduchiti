type P = { className?: string; label?: string };

function Svg({ className, label, children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className ?? "h-6 w-6"} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {children}
    </svg>
  );
}

export const LockIcon = (p: P) => (
  <Svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>
);
export const CameraIcon = (p: P) => (
  <Svg {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Svg>
);
export const ImageIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></Svg>
);
export const CheckIcon = (p: P) => (
  <Svg {...p}><path d="m5 12 5 5 9-10" /></Svg>
);
export const SunIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>
);
export const CloudSunIcon = (p: P) => (
  <Svg {...p}><path d="M8 3v1.5M3.5 8H5M4.8 4.8l1 1M12.2 4.8l-1 1" /><path d="M11 9.2A3.5 3.5 0 0 0 5.2 11" /><path d="M7 20h10a4 4 0 1 0-1-7.9A5 5 0 0 0 7 20z" /></Svg>
);
export const SunsetIcon = (p: P) => (
  <Svg {...p}><path d="M12 10V3M8.5 6.5 12 3l3.5 3.5" /><path d="M5 16a7 7 0 0 1 14 0" /><path d="M2 20h20M4.2 12.2l1.4 1M18.4 13.2l1.4-1" /></Svg>
);
export const MoonIcon = (p: P) => (
  <Svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></Svg>
);
export const WarningIcon = (p: P) => (
  <Svg {...p}><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></Svg>
);
