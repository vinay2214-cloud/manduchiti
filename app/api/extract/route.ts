import { gemini, geminiModel, isBusyError } from "@/lib/gemini";
import { EXTRACT_PROMPT } from "@/lib/prompts";
import { ModelExtractionSchema, extractionJsonSchema } from "@/lib/schemas";
import { groundDoses } from "@/lib/groundDose";
import type { ErrorCode, Extraction } from "@/lib/types";

export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;
// The SDK retries 503s with backoff on its own; this caps the whole call so a slow
// model ends as a friendly "busy" before the browser (45s) or Vercel (60s) gives up.
const MODEL_BUDGET_MS = 40_000;

function fail(error: ErrorCode, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("image");
    file = f instanceof File ? f : null;
  } catch {
    return fail("invalid", 400);
  }
  if (!file || !file.type.startsWith("image/")) return fail("not_document", 400);
  if (file.size > MAX_BYTES) return fail("too_large", 413);

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  let text: string | undefined;
  try {
    const res = await gemini().models.generateContent({
      model: geminiModel(),
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: file.type, data } }, { text: EXTRACT_PROMPT }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: extractionJsonSchema,
        temperature: 0,
        abortSignal: AbortSignal.timeout(MODEL_BUDGET_MS),
      },
    });
    text = res.text;
  } catch (err) {
    // Log the failure kind only — never the image or document text.
    const status = (err as { status?: number }).status ?? (err instanceof Error ? err.name : "unknown");
    console.error("extract: model call failed", status);
    return fail(isBusyError(err) ? "busy" : "invalid", isBusyError(err) ? 503 : 502);
  }

  let json: unknown;
  try {
    json = JSON.parse(text ?? "");
  } catch {
    return fail("invalid", 502);
  }
  const parsed = ModelExtractionSchema.safeParse(json);
  if (!parsed.success) return fail("invalid", 502);

  const m = parsed.data;
  if (!m.document_ok) return fail(m.problem ?? "not_document", 422);
  if (m.medicines.length === 0) return fail("no_medicines", 422);

  const extraction: Extraction = {
    document_ok: true,
    medicines: m.medicines.map((med, i) => ({ id: `m${i + 1}`, ...med })),
    warning_signs: m.warning_signs,
    follow_up: m.follow_up,
  };
  return Response.json(groundDoses(extraction));
}
