import type { ErrorCode } from "./types";

// Friendly copy for every error code. Raw codes are never shown.
// "reuse" errors can be retried with the same photo; "retake" errors need a new one.
export const ERRORS: Record<ErrorCode, { title: string; tip?: string; action: "reuse" | "retake" }> = {
  busy: { title: "Busy right now, please try again in a minute", action: "reuse" },
  invalid: { title: "Something didn't come through properly", tip: "Please try again.", action: "reuse" },
  blurry: { title: "The photo is hard to read", tip: "Lay the paper flat in good light and fill the frame with the page.", action: "retake" },
  not_document: { title: "This doesn't look like a discharge summary or prescription", tip: "Take a photo of the printed medicine list from the hospital.", action: "retake" },
  no_medicines: { title: "No medicines were found on this sheet", tip: "Make sure the medicines table is in the photo.", action: "retake" },
  too_large: { title: "That photo is too large", tip: "Please try a smaller photo.", action: "retake" },
};

export function toErrorCode(e: unknown): ErrorCode {
  const code = (e as { code?: unknown }).code;
  if (typeof code === "string" && code in ERRORS) return code as ErrorCode;
  if ((e as Error)?.name === "TimeoutError") return "busy";
  return "invalid";
}
