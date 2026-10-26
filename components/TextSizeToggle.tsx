"use client";

import { useEffect, useState } from "react";
import T from "./T";

const SCALES = [1, 1.15, 1.3];
const LABELS = ["A", "A+", "A++"];
const KEY = "mandu-chit:scale";

function readScale(): number {
  try {
    const v = Number(sessionStorage.getItem(KEY));
    return SCALES.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

export function applyStoredScale() {
  document.documentElement.style.setProperty("--scale", String(readScale()));
}

export default function TextSizeToggle() {
  const [scale, setScale] = useState(1);
  useEffect(() => setScale(readScale()), []);

  function choose(s: number) {
    setScale(s);
    document.documentElement.style.setProperty("--scale", String(s));
    try {
      sessionStorage.setItem(KEY, String(s));
    } catch {
      // Session storage can be unavailable (private mode); the size still applies for this view.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="sr-only"><T k="textSize" /></span>
      <div className="flex rounded-full bg-card p-1 shadow-[var(--shadow-soft)]" role="group">
        {SCALES.map((s, i) => (
          <button key={s} type="button" aria-pressed={scale === s} onClick={() => choose(s)}
            className={`min-h-11 min-w-11 rounded-full px-2 font-bold ${scale === s ? "bg-ink text-paper" : "text-ink"}`}
            style={{ fontSize: `${0.85 + i * 0.15}rem` }}>
            {LABELS[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
