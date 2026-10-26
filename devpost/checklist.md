---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. A sample sheet goes in and the extracted medicines come back, checked by code**
  Becomes usable: A running Next.js app where you pick a camera/gallery photo or "Try a sample sheet" and see the Reading steps, then the validated `Extraction` JSON (medicines, warning signs, follow-up), with ungrounded doses forced to `unsure`.
  Why now: Gemini vision + structured output is the biggest unknown and the kernel's first half. If extraction of the samples is shaky, every later slice changes — find out first. Bootstrapping lives here.
  PRD ref: `prd.md > The Core Journey` (steps 1–2), `prd.md > Image Upload`, `prd.md > Extraction`, `prd.md > The Safety Rule`
  Spec ref: `spec.md > Stack` (unverified items), `spec.md > Upload Screen`, `spec.md > Image Resize`, `spec.md > Reading Screen`, `spec.md > Extract API`, `spec.md > Dose Grounding Guard`, `spec.md > Data Model`, `spec.md > Privacy Copy`, `spec.md > Look and Feel` (tokens only)
  Build: Scaffold Next.js + TS + Tailwind v4 + Vitest; `@theme` tokens and Noto Sans Telugu; `.env.example`. Verify the current Gemini model name, `@google/genai` structured-output syntax, free-tier data terms (pick the privacy line), and Vercel Hobby limits. `lib/types.ts`, `schemas.ts`, `prompts.ts`, `gemini.ts`, `groundDose.ts` (test written failing first), `resizeImage.ts`; `/api/extract` with size/type checks and `maxDuration = 60`; minimal `UploadScreen` (camera, gallery, sample picker from `public/samples/`, privacy line), `ReadingScreen`, and a temporary raw-JSON view in `page.tsx`. Then a smoke deploy to Vercel with `GEMINI_API_KEY` set, to measure live latency and timeouts early (full deploy still in slice 3).
  Verify (mechanical): `npm test` (groundDose tests pass after failing first); `npm run build` clean; with the dev server running, POST samples 1–4 and 5 to `/api/extract` via curl and confirm each reply passes the schema, lists every medicine on the sheet, keeps text as written, and sample 5's cut-off text is flagged unsure rather than completed; smoke deploy: the public URL loads and `/api/extract` on the live URL returns a valid extraction for one sample, with latency recorded under Revisions if it changes the plan.
  Learner check: `npm run dev`, open http://localhost:3000, tap "Try a sample sheet" → sample 2, watch the Reading steps, and compare the JSON against the paper: every medicine present, doses exactly as printed, nothing filled in.
  Commit: `Upload and validated extraction with dose grounding`

- [x] **2. Check with paper: editable cards, slot chips, Ask group, and the gate**
  Becomes usable: After extraction you land on the safety screen — one card per medicine with the source line and unsure badge, direct chips, amber "Suggested, please confirm" chips that need their own tap, an "Ask your doctor or pharmacist" group with no chips, "Only if needed" rows, the comparison checkbox, and a "Looks right, make the plan" button that only enables when the gate passes.
  Why now: The scheduler and gate are the safety rule in code — the kernel's core. The confirm screen can't show chips or the Ask group without them, so they ship together. Early feedback here shapes the plan screen.
  PRD ref: `prd.md > Slot Mapping`, `prd.md > Check With Paper (the safety gate)`, `prd.md > Food Instructions`, `prd.md > Amendments From 4-spec`
  Spec ref: `spec.md > Scheduler`, `spec.md > Food Display`, `spec.md > Check With Paper Screen`, `spec.md > Plan Logic` (`canMakePlan` and frequency-edit re-scheduling), `spec.md > Data Model`, `spec.md > Tests and Acceptance Mapping`
  Build: `lib/scheduler.ts`, `lib/food.ts`, `canMakePlan()` in `lib/plan.ts`, each with its spec'd Vitest cases written first and shown failing; `ConfirmState` construction (original vs edited per field) in `page.tsx`; `ConfirmScreen`, `MedicineCard`, `SlotChips` styled per Look and Feel; frequency edits re-schedule non-Ask rows and never move a row out of Ask.
  Verify (mechanical): `npm test` — scheduler, food and gate suites pass (every spec'd case, incl. boundaries, paper-wins, disagreements, partial words, duration); `npm run build` clean; extract samples 1 and 2 and confirm each medicine's status matches the Sample coverage table.
  Learner check: Run sample 2. Confirm the insulin/as-directed/weekly rows sit in Ask with no chips, SOS is in Only if needed, the BD row needs its tap, and the button stays disabled until every suggestion is confirmed and the box is ticked.
  Commit: `Check-with-paper screen with scheduler and safety gate`

- [ ] **3. The confirmed medicines become the Telugu plan, at a public URL**
  Becomes usable: The full core journey — tap the button, see "Preparing the Telugu plan", then the plan: slot cards, Only if needed, Ask, the always-shown warning panel and follow-up line, legend lines only when needed, footer, "Changed by your family / Sheet said" markers, Telugu/English and text-size toggles. Deployed on Vercel.
  Why now: Completes the kernel end to end; deploying here (not at the end) surfaces Vercel body/timeout surprises while there's still time.
  PRD ref: `prd.md > Telugu Plan`, `prd.md > The Safety Rule`, `prd.md > The Core Journey` (steps 4–5)
  Spec ref: `spec.md > Telugu API`, `spec.md > Translation Guard`, `spec.md > Static Telugu Strings`, `spec.md > Plan Logic` (`buildPlan`), `spec.md > Plan Screen`, `spec.md > Look and Feel`, `spec.md > Where It Runs and How Someone Tries It`
  Build: `lib/translationGuard.ts` and `buildPlan()` with their tests written first (incl. the randomized "nothing silently changed" property); `lib/strings.ts` (AI-drafted Telugu, flagged for your review); `/api/telugu` with zod + guard + one retry; `PlanScreen`, `SlotCard`, `WarningPanel`, `LanguageToggle`, `TextSizeToggle` (sessionStorage in try/catch); remove the raw-JSON view. Link Vercel, set `GEMINI_API_KEY`, deploy.
  Verify (mechanical): `npm test` all green; `npm run build` clean; samples 1, 2, 4 end to end locally — every medicine in exactly the expected slots, dose as written, fixed lines on sample 4; translate route rejects a tampered digit (unit test); the public URL loads and completes sample 1.
  Learner check: On the public URL in a phone-sized window, run sample 1 end to end, then sample 2 and edit one dose — confirm the marker and "Sheet said" line. Read every Telugu string and tell me what to change.
  Commit: `Telugu plan with translation guard, deployed`

- [ ] **4. Friendly errors, coverage pass, README and LICENSE**
  Becomes usable: A random or dark photo gets a plain message with one tip and a retry; busy/invalid errors retry cleanly; all five samples behave per the coverage table; the repo explains itself.
  Why now: Required for "done" but not risky; comes after the kernel works so it can't crowd it out.
  PRD ref: `prd.md > States and Boundaries`, `prd.md > What We're Building`
  Spec ref: `spec.md > Error States`, `spec.md > Important Failure Modes`, `spec.md > Tests and Acceptance Mapping` (Sample coverage), `spec.md > File Structure` (README, LICENSE)
  Build: `lib/errors.ts`, `ErrorState`, client timeout ~45s mapping to `busy`; contrast check on turmeric/amber fills; README (what, safety rule, privacy note, run, test, deploy); LICENSE; apply your Telugu string edits; redeploy.
  Verify (mechanical): `npm test` + `npm run build` clean; curl a non-document image and confirm the `not_document` code; run all 5 samples on the deployed URL and tick each row of the coverage table.
  Learner check: Upload any non-medical photo from your gallery and confirm the friendly message; skim the README.
  Commit: `Error states, README and license`

- [ ] **5. (Stretch) Save as image, WhatsApp, print**
  Becomes usable: From the plan, download a 1080×1350 PNG with the footer, open a WhatsApp share link, or print a clean black-on-white page.
  Why now: Explicitly not part of "done" — last so it can be dropped if the deadline bites.
  PRD ref: `prd.md > Share (stretch, not part of "done")`
  Spec ref: `spec.md > Share Bar (stretch)`
  Build: `ShareBar` with html-to-image, wa.me link, `@media print` stylesheet; redeploy.
  Verify (mechanical): `npm run build` clean; generated PNG is 1080×1350 and contains the footer text; print preview has no buttons.
  Learner check: Save the image from sample 1's plan and open it on your phone at thumbnail size — is it readable?
  Commit: `Share image, WhatsApp link and print`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2 (check-with-paper screen), before the plan screen is built
- [ ] Telugu wording and live URL reviewed — after slice 3
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [pending]
Route and stops: [pending]
Edit outcome: [pending]
Reflection: [pending]
Activity mode: [pending]

## Revisions

- Default Gemini model changed from `gemini-2.5-flash` to `gemini-3.5-flash` (still overridable with `GEMINI_MODEL`) — the API returned 404 "no longer available to new users" for 2.5; 3.7/3.8-flash returned 503 high demand and `gemini-flash-latest` took ~575s, while 3.5-flash answered in ~9–15s.
- Privacy line set to "Mandu Chit doesn't store your photo. This demo is for sample sheets only, please don't upload real patient papers." — the Gemini free-tier terms say submitted content is used to improve Google products and may be read by human reviewers.
- Vercel Hobby limits verified: 4.5 MB request body, 300s max duration, so `maxDuration = 60` stands. Free-tier Gemini returned 503 on roughly 1 in 3 extraction calls during local testing (mapped to `busy`); whether to add a server retry is open for the slice 2 checkpoint.
- Extraction's model call is capped at 40s via `abortSignal`, and abort/timeout map to `busy` — the smoke deploy hit Vercel's 60s FUNCTION_INVOCATION_TIMEOUT (raw 504) because `@google/genai` retries 503s up to 5 times with backoff by default, so the spec's "zero retries for extraction" was never literally true; the SDK retries now run inside the 40s budget. Live smoke test after the fix: 2 of 5 calls succeeded (~13s), the rest were clean `busy`.
- Free-tier quota is 20 generate requests per day per model (429 RESOURCE_EXHAUSTED, `generate_content_free_tier_requests`, limit 20) — exhausted for the default model on build day by testing; resets after the deadline. Lite models still had quota. How to proceed is a learner decision (billing vs model change).
- SDK automatic retries turned off (`retryOptions.attempts: 1`) and the route logs only the attempt number and status — learner decision so one request is one Gemini call; any retry will be explicit in our code. Verified offline with a stubbed fetch: 1 call vs 5 with SDK defaults.
- Slice 2's sample check runs against saved slice-1 extraction replies in `tests/fixtures/` instead of live calls — the learner paused live calls to protect quota; the fixtures are the real model output for samples 1–5.
- Added `lib/confirm.ts` (build/edit/toggle/confirm on `ConfirmState`) and a `sheetStatus` field on `ConfirmRow` — the spec put this logic in `page.tsx`, but pure functions make the "Ask stays Ask" and gate rules unit-testable.
- Editing a row's instructions re-runs the scheduler too, not only frequency edits (Ask rows still stay in Ask) — instructions can carry timing ("Morning"), so a frequency-only rule would leave stale slots. Approved by the learner; recorded in `prd.md > Amendments From 5-build`.
- A named time only counts when the frequency itself is recognised: blank frequency + "Night", or "As directed" + "Morning", go to Ask; "HS" + "Morning" is a disagreement → Ask — the spec's "named slots only → direct" would otherwise let instructions fill in a frequency the sheet didn't give. Approved by the learner; recorded in `prd.md > Amendments From 5-build` and `spec.md > Scheduler`, with a dedicated test block (mutation-checked: reverting the rule fails 13 tests).
