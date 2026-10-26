import { errorStatus, gemini, geminiModel, isBusyError } from "@/lib/gemini";
import { TRANSLATE_PROMPT } from "@/lib/prompts";
import { TeluguReplySchema, TeluguRequestSchema, teluguJsonSchema } from "@/lib/schemas";
import { checkTranslation } from "@/lib/translationGuard";
import type { ErrorCode, TranslateItem, Translations } from "@/lib/types";

export const maxDuration = 60;

// One explicit retry, and only when the reply fails the schema or the translation guard.
// Busy/quota errors are returned at once: a retry wouldn't help and would spend quota.
const MAX_ATTEMPTS = 2;
const MODEL_BUDGET_MS = 25_000;

function fail(error: ErrorCode, status: number) {
  return Response.json({ error }, { status });
}

type Attempt = { ok: true; translations: Translations } | { ok: false; busy: boolean };

async function translateOnce(items: TranslateItem[], attempt: number): Promise<Attempt> {
  // Log only the attempt number and outcome — never the document text.
  console.info("telugu: gemini attempt", attempt);
  let text: string | undefined;
  try {
    const res = await gemini().models.generateContent({
      model: geminiModel(),
      contents: [{ role: "user", parts: [{ text: TRANSLATE_PROMPT }, { text: JSON.stringify({ items }) }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: teluguJsonSchema,
        temperature: 0,
        abortSignal: AbortSignal.timeout(MODEL_BUDGET_MS),
      },
    });
    text = res.text;
  } catch (err) {
    console.error("telugu: gemini attempt", attempt, "failed", errorStatus(err));
    return { ok: false, busy: isBusyError(err) };
  }

  let json: unknown;
  try {
    json = JSON.parse(text ?? "");
  } catch {
    console.error("telugu: gemini attempt", attempt, "rejected", "not json");
    return { ok: false, busy: false };
  }
  const parsed = TeluguReplySchema.safeParse(json);
  if (!parsed.success) {
    console.error("telugu: gemini attempt", attempt, "rejected", "schema");
    return { ok: false, busy: false };
  }
  const check = checkTranslation(items, parsed.data.items);
  if (!check.ok) {
    console.error("telugu: gemini attempt", attempt, "rejected", "guard", check.problems.length);
    return { ok: false, busy: false };
  }
  return { ok: true, translations: Object.fromEntries(parsed.data.items.map((i) => [i.id, i.te])) };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid", 400);
  }
  const req = TeluguRequestSchema.safeParse(body);
  if (!req.success) return fail("invalid", 400);
  const { items } = req.data;
  if (items.length === 0) return Response.json({ translations: {} });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await translateOnce(items, attempt);
    if (result.ok) return Response.json({ translations: result.translations });
    if (result.busy) return fail("busy", 503);
  }
  return fail("invalid", 502);
}
