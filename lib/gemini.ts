import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function gemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  // attempts: 1 turns off the SDK's automatic retries, so one request is one Gemini call.
  // Any retry is explicit in our own code.
  client ??= new GoogleGenAI({ apiKey, httpOptions: { retryOptions: { attempts: 1 } } });
  return client;
}

export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-3.5-flash";

// 429s and timeouts become the friendly "busy" state.
export function isBusyError(err: unknown): boolean {
  if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b|RESOURCE_EXHAUSTED|\b503\b|UNAVAILABLE|DEADLINE|timed? ?out|abort/i.test(msg);
}
