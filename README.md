# Mandu Chit · మందు చీటీ

Turn a photo of an English hospital discharge summary into a large-print **Telugu daily medicine plan** for an elderly patient: morning, afternoon, evening and night, before or after food, plus the warning signs and follow-up the hospital wrote.

A caregiver (often an adult child in another city) uploads the photo and checks every medicine against the paper. The patient reads the plan.

**Live demo:** https://mandu-chit.vercel.app — use the built-in **Try a sample sheet**. The samples in `samples/` are fictional.

> **Not medical advice.** Mandu Chit only re-presents what the paper says. It does not check doses, interactions or anything else. Always confirm with a doctor or pharmacist.

## The safety rule

> The app only re-presents what is written. It never suggests, changes or infers a dose or timing. Anything unclear goes to "Ask your doctor or pharmacist".

The AI (Gemini) only *reads* the sheet and *translates* free text. Every safety decision is plain, unit-tested code:

| Check | Where | What it guarantees |
|---|---|---|
| Dose grounding | `lib/groundDose.ts` | A dose that doesn't appear in its own printed row is flagged "Check this against the paper". |
| Scheduler | `lib/scheduler.ts` | Times come only from the paper (`1-0-1`, "Night", "8 PM", "at bedtime"). A count alone (OD, BD, TDS, QID) is only a *suggestion*. Anything unclear, conflicting or cut off goes to Ask, with no time. |
| The gate | `lib/plan.ts > canMakePlan` | No plan until every suggested time is confirmed by its own tap and "I compared this with the paper" is ticked. `buildPlan` enforces it again. |
| Nothing silently changed | `lib/plan.ts > buildPlan` | Every edit shows "Changed by your family" with "Sheet said: …"; every family-chosen or moved time is marked and explained by a legend. A randomized test checks this over 300 edit sequences. |
| Translation guard | `lib/translationGuard.ts` | A translation that adds, drops or reorders items, or changes any number or unit (mg, mcg, ml, IU, F), is rejected and never shown. |

Medicine names and doses stay in English exactly as written, so they can be matched to the strip or bottle.

## Privacy

Mandu Chit has no database and no login, stores nothing, and never logs the photo or the document text. The photo is sent to the Gemini API to be read. On Gemini's **free tier, Google may use submitted content to improve its products** ([terms](https://ai.google.dev/gemini-api/terms)), so this demo is for the **fictional sample sheets only — please don't upload real patient papers.**

## Run it locally

Requires Node 22.12+ or 24+ (Vitest needs it; Next.js alone needs 20.9+) and a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY (GEMINI_MODEL is optional)
npm run dev                  # http://localhost:3000
```

Each sample run uses about two Gemini requests: one to read the sheet and one to translate. The server makes at most one extra attempt per step: on a busy/rate-limit error when reading, or when a translation fails the guard.

## Tests

```bash
npm test
```

Vitest, no network: Gemini is mocked, and `tests/fixtures/` holds real extraction replies for the five sample sheets. The tests cover the scheduler (every Slot Mapping rule and clock boundary), food chips, dose grounding, the gate, plan markers, the translation guard, and both API routes' retry behaviour.

## Deploy

Deployed on Vercel (Hobby). Set `GEMINI_API_KEY` in the project's environment variables, then `vercel --prod` or push to the linked repo.

## How it's built

Next.js (App Router) + TypeScript + Tailwind CSS v4, zod, `@google/genai`, Vitest. One page holds all state; two server routes call Gemini:

- `app/api/extract` — photo → Gemini (structured JSON) → zod → dose grounding.
- `app/api/telugu` — free text only → Gemini → zod → translation guard.

Fixed Telugu labels live in `lib/strings.ts` and are never generated at runtime. **Their wording is still a draft pending a native-speaker review.**

Planning documents for the Devpost "Build With AI: Basics" hackathon are in `devpost/`.

## License

[MIT](LICENSE)
