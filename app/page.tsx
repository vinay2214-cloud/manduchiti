"use client";

import { useEffect, useState } from "react";
import UploadScreen from "@/components/UploadScreen";
import ReadingScreen from "@/components/ReadingScreen";
import ConfirmScreen from "@/components/ConfirmScreen";
import PlanScreen from "@/components/PlanScreen";
import ErrorState from "@/components/ErrorState";
import { applyStoredScale } from "@/components/TextSizeToggle";
import { buildConfirmState } from "@/lib/confirm";
import { toErrorCode } from "@/lib/errors";
import { buildPlan, translationItems } from "@/lib/plan";
import { resizeImage } from "@/lib/resizeImage";
import { en } from "@/lib/strings";
import type { ConfirmState, ErrorCode, Extraction, Plan, Translations } from "@/lib/types";

type Step = "upload" | "reading" | "confirm" | "preparing" | "plan" | "error";
type Failure = { code: ErrorCode; during: "extract" | "plan" };

async function postJson(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(45_000) });
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    // A non-JSON reply (e.g. a platform error page) is treated as "invalid".
  }
  if (!res.ok) throw Object.assign(new Error("request failed"), { code: json.error });
  return json;
}

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [readingDone, setReadingDone] = useState(0);
  const [photo, setPhoto] = useState<Blob | null>(null); // kept in memory only, so "Try again" can reuse it
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(applyStoredScale, []);

  async function extract(blob: Blob) {
    setPhoto(blob);
    setStep("reading");
    setReadingDone(0);
    try {
      const small = await resizeImage(blob);
      const body = new FormData();
      body.append("image", small, "sheet.jpg");
      const req = postJson("/api/extract", { method: "POST", body });
      setReadingDone(1);
      const json = await req;
      setReadingDone(2);
      setConfirm(buildConfirmState(json as unknown as Extraction));
      setStep("confirm");
    } catch (e) {
      setFailure({ code: toErrorCode(e), during: "extract" });
      setStep("error");
    }
  }

  async function makePlan(state: ConfirmState) {
    setStep("preparing");
    try {
      const items = translationItems(state);
      const translations = items.length
        ? ((await postJson("/api/telugu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items }) }))
            .translations as Translations)
        : {};
      setPlan(buildPlan(state, translations));
      setStep("plan");
      window.scrollTo(0, 0);
    } catch (e) {
      setFailure({ code: toErrorCode(e), during: "plan" });
      setStep("error");
    }
  }

  const reset = () => {
    setStep("upload");
    setPhoto(null);
    setConfirm(null);
    setPlan(null);
    setFailure(null);
  };

  return (
    <div className="mx-auto max-w-[480px]">
      {step === "upload" && <UploadScreen onImage={extract} />}
      {step === "reading" && <ReadingScreen steps={en.readingSteps} done={readingDone} />}
      {step === "confirm" && confirm && (
        <ConfirmScreen state={confirm} onChange={setConfirm} onMakePlan={() => makePlan(confirm)} onStartOver={reset} />
      )}
      {step === "preparing" && <ReadingScreen steps={en.preparingSteps} done={1} />}
      {step === "plan" && plan && <PlanScreen plan={plan} onBack={() => setStep("confirm")} onStartOver={reset} />}
      {step === "error" && failure && (
        <ErrorState
          code={failure.code}
          onRetry={failure.during === "plan" ? (confirm ? () => makePlan(confirm) : null) : photo ? () => extract(photo) : null}
          onRetake={reset}
          onStartOver={reset}
          onBack={failure.during === "plan" ? () => setStep("confirm") : undefined}
        />
      )}
    </div>
  );
}
