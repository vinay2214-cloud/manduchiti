import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function gemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-3.5-flash";

// 429s and timeouts become the friendly "busy" state.
export function isBusyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b|RESOURCE_EXHAUSTED|\b503\b|UNAVAILABLE|DEADLINE|timed? ?out/i.test(msg);
}
