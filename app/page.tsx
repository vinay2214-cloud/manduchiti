"use client";

import { useState } from "react";
import UploadScreen from "@/components/UploadScreen";
import ReadingScreen from "@/components/ReadingScreen";
import { resizeImage } from "@/lib/resizeImage";
import { en } from "@/lib/strings";
import type { ErrorCode, Extraction } from "@/lib/types";

type Step = "upload" | "reading" | "confirm" | "error";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [readingDone, setReadingDone] = useState(0);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);

  async function handleImage(blob: Blob) {
    setStep("reading");
    setReadingDone(0);
    try {
      const small = await resizeImage(blob);
      const body = new FormData();
      body.append("image", small, "sheet.jpg");
      const req = fetch("/api/extract", { method: "POST", body, signal: AbortSignal.timeout(45_000) });
      setReadingDone(1);
      const res = await req;
      const json = await res.json();
      if (!res.ok) throw Object.assign(new Error("extract"), { code: json.error as ErrorCode });
      setReadingDone(2);
      setExtraction(json as Extraction);
      setStep("confirm");
    } catch (e) {
      const code = (e as { code?: ErrorCode }).code ?? ((e as Error).name === "TimeoutError" ? "busy" : "invalid");
      setError(code);
      setStep("error");
    }
  }

  const reset = () => { setStep("upload"); setExtraction(null); setError(null); };

  return (
    <div className="mx-auto max-w-[480px]">
      {step === "upload" && <UploadScreen onImage={handleImage} />}
      {step === "reading" && <ReadingScreen done={readingDone} />}
      {step === "error" && (
        <main className="px-4 pt-10">
          <p className="text-lg font-semibold">Something went wrong: {error}</p>
          <button type="button" onClick={reset} className="mt-6 min-h-12 rounded-full bg-turmeric px-6 font-semibold text-ink">{en.startOver}</button>
        </main>
      )}
      {step === "confirm" && extraction && (
        // Temporary raw view for slice 1; replaced by the Check with paper screen in slice 2.
        <main className="px-4 pt-6 pb-10">
          <button type="button" onClick={reset} className="min-h-12 font-semibold underline">{en.startOver}</button>
          <pre className="mt-4 overflow-x-auto rounded-[var(--radius-input)] bg-card p-3 text-xs whitespace-pre-wrap">
            {JSON.stringify(extraction, null, 2)}
          </pre>
        </main>
      )}
    </div>
  );
}
