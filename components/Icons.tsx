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
