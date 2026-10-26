"use client";

import { useState } from "react";
import UploadScreen from "@/components/UploadScreen";
import ReadingScreen from "@/components/ReadingScreen";
import { resizeImage } from "@/lib/resizeImage";
import ConfirmScreen from "@/components/ConfirmScreen";
import { buildConfirmState } from "@/lib/confirm";
import { en } from "@/lib/strings";
import type { ConfirmState, ErrorCode, Extraction } from "@/lib/types";

type Step = "upload" | "reading" | "confirm" | "plan" | "error";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [readingDone, setReadingDone] = useState(0);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
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
      setConfirm(buildConfirmState(json as Extraction));
      setStep("confirm");
    } catch (e) {
      const code = (e as { code?: ErrorCode }).code ?? ((e as Error).name === "TimeoutError" ? "busy" : "invalid");
      setError(code);
      setStep("error");
    }
  }

  const reset = () => { setStep("upload"); setConfirm(null); setError(null); };

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
      {step === "confirm" && confirm && (
        <ConfirmScreen state={confirm} onChange={setConfirm} onMakePlan={() => setStep("plan")} onStartOver={reset} />
      )}
      {step === "plan" && (
        // Temporary until slice 3 builds the Telugu plan.
        <main className="px-4 pt-10">
          <p className="text-lg font-semibold">The Telugu plan arrives in the next step of the build.</p>
          <button type="button" onClick={() => setStep("confirm")} className="mt-6 min-h-12 font-semibold underline">Back to checking</button>
        </main>
      )}
    </div>
  );
}
