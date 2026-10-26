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

- [x] **4b. Opening hero on the Upload screen (learner-requested addition, time-boxed ~30 min)**
  Becomes usable: The Upload screen opens with a fictional, clearly stamped SAMPLE discharge sheet that animates into the four Telugu time-of-day cards, with a CSS 3D tilt on pointer/touch drag.
  Why now: Requested by the learner after slice 4's offline work, before the live checks and recording; it shows the kernel (English sheet → Telugu day plan) in the first second.
  PRD ref: `prd.md > Look and Feel`, `prd.md > Screens and Layout` (Upload)
  Spec ref: `spec.md > Look and Feel` (tokens, motion, reduced motion, contrast), `spec.md > Upload Screen`
  Build: `components/Hero.tsx` (inline SVG sheet, four cards from `SLOT_META` and `lib/strings.ts`), `.hero*` CSS keyframes in `app/globals.css` whose resting styles are the final frame; no WebGL, 3D libraries, external images or new fonts; `touch-action: pan-y` so vertical scroll still works.
  Verify (mechanical): `npm test` + `npm run build` clean; headless Chrome at 390×844 (motion and reduced motion): "Take a photo" fully visible without scrolling, title above the fold, no horizontal overflow, cards inside the hero, animation runs only with motion allowed, drag tilts only with motion allowed; contrast of every hero text pair ≥ 4.5:1; first-load transfer measured before and after deploy.
  Learner check: Open the live URL on your phone, watch the opening once, drag across it sideways, then turn on Reduce Motion and reload — it should be still.
  Commit: `Opening hero on the Upload screen`

- [ ] **5. (Stretch) Save as image, WhatsApp, print** — limited by the learner to print + WhatsApp, Save as image only if reliable, hard cutoff 23:00; not deployed until the learner's phone test passes
  Becomes usable: From the plan, download a 1080×1350 PNG with the footer, open a WhatsApp share link, or print a clean black-on-white page.
  Why now: Explicitly not part of "done" — last so it can be dropped if the deadline bites.
  PRD ref: `prd.md > Share (stretch, not part of "done")`
  Spec ref: `spec.md > Share Bar (stretch)`
  Build: `ShareBar` with html-to-image, wa.me link, `@media print` stylesheet; redeploy.
  Verify (mechanical): `npm run build` clean; generated PNG is 1080×1350 and contains the footer text; print preview has no buttons.
  Learner check: Save the image from sample 1's plan and open it on your phone at thumbnail size — is it readable?
  Commit: `Share image, WhatsApp link and print`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 2 (check-with-paper screen); learner checked from screenshots and asked for two fixes (named confirm tap, tappable pending line + short sticky bar), both done
- [ ] Telugu wording and live URL reviewed — after slice 3 (`lib/strings.ts` is **draft, review pending (not reviewed)**: learner accepted the table with no changes for now; final review on the real screen before recording)
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
- `/api/extract` now makes one explicit retry on a Gemini 503/429 after 2s, sharing the 40s budget; timeouts, bad replies and other errors are not retried — learner decision after the live smoke test showed frequent 503s; amends `spec.md > What Was Simplified and Why`. Covered by `tests/extractRoute.test.ts` (Gemini and sleep mocked).
- Friendly error screen (`lib/errors.ts`, `ErrorState`) pulled forward from slice 4 — learner asked that raw codes like "busy" never show; "Try again" reuses the photo held in browser memory.
- Third reading step renamed to "Getting the check screen ready" — it claimed the Telugu plan was being prepared before the Check screen.
- Plan markers are short text labels (Telugu review rows 19–20) rather than a bare symbol — learner decision; the PRD only said "a small marker".
- Error helpers moved to `lib/gemini-errors.ts` so route tests can mock the `server-only` Gemini client; Vitest 5 fails a test when a `vi.fn` returns a rejected promise, so route tests throw scripted failures from a plain wrapper instead.
- Suggested-time confirm now reads "Tap to confirm: Morning, Night" → "Confirmed: …" as a full-width button, and changing a suggested row's chips after confirming resets the confirmation — learner feedback at the slice 2 checkpoint: the old chip didn't look tappable or say what it confirmed. Tests in `tests/confirmScreen.test.tsx`.
- The "Confirm the suggested times on N medicines ↑" line is a button that scrolls to and focuses the first unconfirmed card; the sticky bar is 165px at 390×844 with every target kept at the PRD's 48px minimum (157px with 44px targets was possible but breaks the PRD). Checked headless at 390×844 against the sample 1 fixture: the jumped-to confirm button and the last card both sit above the bar.
- Slice 4's coverage pass ran offline against `tests/fixtures/` (all rows of `spec.md > Sample coverage` match; sample 3 plan placement test added) — the learner paused live calls. Still needs live calls: a non-document/blurry real photo, and all 5 samples end to end on the deployed URL.
- Contrast fixes from a computed WCAG check of every used pair: slot icons drawn in ink (morning/afternoon colours were 1.6–2.7:1), selected chips carry a ✓ besides the tint, the English slot label on headers uses ink (muted was 3.9–4.3:1 on evening/night), and the turmeric focus ring gets an inner ink edge (turmeric alone was 2.1:1 on paper). Every text pair now ≥ 4.5:1 and every UI pair ≥ 3:1.
- `/api/telugu`: minimal thinking (`thinkingConfig.thinkingLevel: MINIMAL`; 3.x flash models can't turn thinking fully off), budget raised from 25s to 40s shared by all attempts, one retry on a Gemini 503 after 2s only if ≥12s of budget remains (429 quota and timeouts are not retried), per-call log of attempt, model and elapsed ms only, and an optional `GEMINI_TRANSLATE_MODEL` (defaults to `GEMINI_MODEL`) — production logs showed two translate calls timing out at the old 25s budget and one 503 with no retry. Tests with mocked Gemini and a scripted clock; the budget rule is mutation-checked. One approved live request (5 items) took 13.8s wall, HTTP 200.
- Lite model tested for `/api/telugu` and rejected: `gemini-3.5-flash-lite` (one approved local call, same 5-item sample 2 fixture) took 21,227 ms vs 13.8 s wall for the default flash model, so it was slower, and it changed the follow-up's time relationship ("Review in 1 week" → "1 వారం తర్వాత", *after* 1 week, where flash kept "1 వారంలో", *in* 1 week). Learner decision: keep the default model; `GEMINI_TRANSLATE_MODEL` stays unset in production.
- Translation prompt gained a literal-translation rule: time phrases and instructions translated as literally as possible, the same time relationship kept ("in 1 week" stays "in 1 week"), and no instructions or meaning-changing words added or removed — prompted by the lite model's wording drift, which the translation guard can't catch (it checks numbers, units and ids, not meaning). Locked by `tests/prompts.test.ts`; not yet exercised live.
- Slice 5 "Save as image" dropped, not shipped — the learner's 23:00 cutoff rule: a reliable version needs a separate 1080×1350 layout and html-to-image embedding the Telugu webfont, which is known to render without fonts on iOS Safari, and it couldn't be proven on a phone in time.
- Print fits one A4 page for samples 1 and 2 but takes two for sample 4 (7 medicines × 4 slots) at a readable size (two columns, `--scale` 0.68, cards never split) — the PRD's "one page" conflicts with large print on dense sheets. Learner decision: two readable pages for dense sheets, keep the large type, don't shrink the text; recorded in `prd.md > Amendments From 5-build`. WhatsApp share sends a plain-text plan (slots, doses as written, Only if needed, Ask, warnings or fixed line, follow-up or fixed line, footer, every family-change marker) via `wa.me/?text=`; 2.9–4.7k-character links for samples 1–4. Share buttons' Telugu (rows 29–30) is draft.
- Turbopack reused a stale compiled `globals.css` after edits (both `next dev` and `next build`), seen with the hero and with the print rules; clearing `.next` fixed it, and a clean build then surfaced a transient `next/font` download failure that passed on retry. Before any deploy, build from a cleared `.next` and check the served CSS contains the new rules.
