"use client";

import { useRef } from "react";
import { plan as S } from "@/lib/strings";
import { SLOT_ORDER } from "@/lib/scheduler";
import { SLOT_META } from "./SlotChips";

// Opening illustration: a fictional sample sheet turns into the four Telugu time-of-day cards.
// Inline SVG + CSS only. The resting styles are the final frame, so reduced motion simply shows it.
const MAX_TILT = 12;

// Each card starts at the sheet's final centre (17% across, 98px down) and flies to its grid spot.
// x offsets are in the card's own width (28.5% of the hero); see .hero-card in globals.css.
const CARD_FROM = [
  { fx: "-126%", fy: "48px" },
  { fx: "-237%", fy: "48px" },
  { fx: "-126%", fy: "-48px" },
  { fx: "-237%", fy: "-48px" },
];

export default function Hero() {
  const stage = useRef<HTMLDivElement>(null);

  function tilt(e: React.PointerEvent<HTMLDivElement>) {
    if (!stage.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    stage.current.style.setProperty("--ry", `${(x * 2 * MAX_TILT).toFixed(1)}deg`);
    stage.current.style.setProperty("--rx", `${(-y * 2 * MAX_TILT).toFixed(1)}deg`);
  }
  function reset() {
    stage.current?.style.setProperty("--ry", "0deg");
    stage.current?.style.setProperty("--rx", "0deg");
  }

  return (
    <div className="hero" role="img" aria-label="Illustration: a sample discharge sheet in English becomes four Telugu cards for morning, afternoon, evening and night."
      onPointerMove={tilt} onPointerLeave={reset} onPointerUp={reset} onPointerCancel={reset}>
      <div ref={stage} className="hero-stage" aria-hidden>
        <div className="hero-sheet">
          <svg viewBox="0 0 120 168" className="h-full w-full">
            <rect x="0.5" y="0.5" width="119" height="167" rx="6" fill="#FFFFFF" stroke="#5B6B68" strokeOpacity="0.35" />
            <text x="10" y="17" fontSize="8.5" fontWeight="700" fill="#12433E">DISCHARGE SUMMARY</text>
            <line x1="10" y1="22" x2="110" y2="22" stroke="#12433E" strokeWidth="1" />
            <text x="10" y="33" fontSize="6" fill="#5B6B68">Sample Hospital (fictional)</text>
            <text x="10" y="48" fontSize="6.5" fontWeight="700" fill="#12433E">MEDICINES</text>
            {[["Tab Sample-A", "1-0-1"], ["Tab Sample-B", "OD"], ["Cap Sample-C", "TDS"], ["Tab Sample-D", "HS"], ["Syp Sample-E", "SOS"]].map(([n, f], i) => (
              <g key={n}>
                <text x="10" y={60 + i * 12} fontSize="6" fill="#12433E">{n}</text>
                <text x="84" y={60 + i * 12} fontSize="6" fill="#12433E">{f}</text>
              </g>
            ))}
            <text x="10" y="132" fontSize="6.5" fontWeight="700" fill="#9B2C1D">WARNING SIGNS</text>
            <rect x="10" y="137" width="80" height="3" rx="1.5" fill="#5B6B68" opacity="0.35" />
            <rect x="10" y="144" width="62" height="3" rx="1.5" fill="#5B6B68" opacity="0.35" />
            <g transform="rotate(-18 60 92)">
              <rect x="22" y="80" width="76" height="22" rx="4" fill="#FFFFFF" fillOpacity="0.85" stroke="#9B2C1D" strokeWidth="2" />
              <text x="60" y="96" fontSize="13" fontWeight="800" fill="#9B2C1D" textAnchor="middle" letterSpacing="2">SAMPLE</text>
            </g>
          </svg>
        </div>
        {SLOT_ORDER.map((slot, i) => {
          const { color, Icon } = SLOT_META[slot];
          return (
            <div key={slot} className="hero-card"
              style={{ "--i": i, "--fx": CARD_FROM[i].fx, "--fy": CARD_FROM[i].fy, "--slot": color } as React.CSSProperties}>
              <Icon className="h-5 w-5 shrink-0 text-ink" />
              <span lang="te" className="block text-[15px] leading-tight font-bold whitespace-nowrap">{S[slot].te}</span>
              <span lang="en" className="block text-[11px] leading-tight font-semibold">{S[slot].en}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
