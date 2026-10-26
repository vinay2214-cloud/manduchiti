import { ThinkingLevel } from "@google/genai";
import { errorStatus, gemini, isBusyError, translateModel } from "@/lib/gemini";
import { now, sleep } from "@/lib/sleep";
import { TRANSLATE_PROMPT } from "@/lib/prompts";
import { TeluguReplySchema, TeluguRequestSchema, teluguJsonSchema } from "@/lib/schemas";
import { checkTranslation } from "@/lib/translationGuard";
import type { ErrorCode, TranslateItem, Translations } from "@/lib/types";

export const maxDuration = 60;

// At most one retry: when the reply fails the schema or the translation guard, or on a Gemini 503
// (after 2s, only if enough of the budget is left). 429 quota errors and timeouts are returned at once.
const MAX_ATTEMPTS = 2;
// One budget for every attempt, ending before the browser (45s) and Vercel (60s) give up.
const MODEL_BUDGET_MS = 40_000;
const RETRY_DELAY_MS = 2_000;
const MIN_ATTEMPT_MS = 10_000; // don't start a retry that can't realistically finish

function fail(error: ErrorCode, status: number) {
  return Response.json({ error }, { status });
}

type Attempt = { ok: true; translations: Translations } | { ok: false; busy: boolean; status?: number };

async function translateOnce(items: TranslateItem[], attempt: number, budget: AbortSignal): Promise<Attempt> {
  const model = translateModel();
  const started = now();
  // Log only the attempt number, model and elapsed time — never the document text.
  const log = (outcome: string) => console.info("telugu: gemini attempt", attempt, `model=${model}`, `${now() - started}ms`, outcome);
  let text: string | undefined;
  try {
    const res = await gemini().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: TRANSLATE_PROMPT }, { text: JSON.stringify({ items }) }] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: teluguJsonSchema,
        temperature: 0,
        // Translation needs no reasoning; minimal thinking is the lowest level 3.x flash models accept.
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        abortSignal: budget,
      },
    });
    text = res.text;
  } catch (err) {
    log(`failed ${errorStatus(err)}`);
    return { ok: false, busy: isBusyError(err), status: (err as { status?: number }).status };
  }

  let json: unknown;
  try {
    json = JSON.parse(text ?? "");
  } catch {
    log("rejected not json");
    return { ok: false, busy: false };
  }
  const parsed = TeluguReplySchema.safeParse(json);
  if (!parsed.success) {
    log("rejected schema");
    return { ok: false, busy: false };
  }
  const check = checkTranslation(items, parsed.data.items);
  if (!check.ok) {
    log(`rejected guard ${check.problems.length}`);
    return { ok: false, busy: false };
  }
  log("ok");
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

  const start = now();
  const budget = AbortSignal.timeout(MODEL_BUDGET_MS);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await translateOnce(items, attempt, budget);
    if (result.ok) return Response.json({ translations: result.translations });
    const lastAttempt = attempt === MAX_ATTEMPTS;
    if (result.busy) {
      const remaining = MODEL_BUDGET_MS - (now() - start);
      const retry503 = result.status === 503 && !lastAttempt && !budget.aborted && remaining >= RETRY_DELAY_MS + MIN_ATTEMPT_MS;
      if (!retry503) return fail("busy", 503);
      await sleep(RETRY_DELAY_MS);
    }
  }
  return fail("invalid", 502);
}
