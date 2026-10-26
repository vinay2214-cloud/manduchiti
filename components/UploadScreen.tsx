"use client";

import { useRef, useState } from "react";
import { en, SAMPLES } from "@/lib/strings";
import { CameraIcon, ImageIcon, LockIcon } from "./Icons";

type Props = { onImage: (blob: Blob) => void };

export default function UploadScreen({ onImage }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [showSamples, setShowSamples] = useState(false);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) onImage(f);
  }

  async function useSample(file: string) {
    // Samples go through the same resize + extract path as a real photo.
    const res = await fetch(file);
    onImage(await res.blob());
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 px-4 pt-10 pb-6">
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">Mandu Chit · మందు చీటీ</p>
        <h1 className="mt-2 text-[1.875rem] leading-tight font-bold">{en.uploadTitle}</h1>
        <p className="mt-3 text-muted">{en.uploadSubtitle}</p>

        <button type="button" onClick={() => setShowSamples((s) => !s)}
          className="mt-8 min-h-12 font-semibold underline underline-offset-4" aria-expanded={showSamples}>
          {en.trySample}
        </button>
        {showSamples && (
          <ul className="mt-2 space-y-2" aria-label={en.samplePickerTitle}>
            {SAMPLES.map((s, i) => (
              <li key={s.file} className="rise" style={{ "--i": i } as React.CSSProperties}>
                <button type="button" onClick={() => useSample(s.file)}
                  className="min-h-12 w-full rounded-[var(--radius-input)] bg-card px-4 text-left shadow-[var(--shadow-soft)]">
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 flex items-start gap-2 text-sm text-muted">
          <LockIcon className="mt-0.5 h-5 w-5 shrink-0" label="Privacy" />
          <span>{en.privacy}</span>
        </p>
      </main>

      <div className="sticky bottom-0 space-y-3 bg-paper/95 px-4 pt-3 pb-5 backdrop-blur-none">
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        <button type="button" onClick={() => cameraRef.current?.click()}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-turmeric text-lg font-semibold text-ink">
          <CameraIcon /> {en.takePhoto}
        </button>
        <button type="button" onClick={() => galleryRef.current?.click()}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-ink font-semibold">
          <ImageIcon /> {en.chooseGallery}
        </button>
      </div>
    </div>
  );
}
