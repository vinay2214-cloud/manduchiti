---
doc: prd
status: approved
---

# Mandu Chit — Product Requirements

A mobile-first web app that turns a photo of an English hospital discharge summary into a large-print Telugu daily medicine plan. The caregiver (an adult child, often in another city) uploads the photo and confirms the medicines. The elderly patient reads the plan.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. **Upload.** The caregiver opens the app and takes a photo of the discharge summary (camera), picks one from the gallery, or taps "Try a sample sheet".
2. **Reading.** A three-step progress list ticks through "Reading the sheet", "Finding medicines" and "Preparing the Telugu plan".
3. **Check with paper.** The caregiver sees one card per medicine. Each card shows the name, dose, frequency and food instruction as written, plus a "from the paper" source line. The caregiver edits anything that's wrong and confirms each "Suggested" slot row. They tick "I compared this with the paper" and tap "Looks right, make the plan".
4. **Telugu plan.** The patient-facing plan appears: four time-of-day cards (only the non-empty ones), an "Only if needed" card, an "Ask your doctor or pharmacist" group, the "Go to hospital immediately if" panel, the follow-up line, and the safety footer.
5. **Success:** this works end to end at a public URL for 3 fictional sample discharge summaries.

(Stretch) 6. **Share:** save as image, share on WhatsApp, print.

## Screens and Layout
Mobile first at 390px, single column, max width 480px centred on desktop. A sticky bottom action bar has one primary button per screen. Touch targets are at least 48px. A text-size toggle (A, A+, A++) scales all text and is remembered for the session.

- **Upload:** warm title (working copy: "Make your mother's medicine plan"). A large camera button (primary), a gallery button (secondary), a "Try a sample sheet" link, and a lock icon with "Your photo is not saved."
- **Reading:** the three-step progress list with a tick per step, plus a skeleton card shimmer. There is never a spinner-only screen.
- **Check with paper (safety screen):** the banner "Compare this with the paper before continuing.", the medicine cards, the "Ask your doctor or pharmacist" group, the comparison checkbox, and the primary button.
- **Telugu plan:** a header with a patient-friendly title, the date, and a Telugu / English toggle at top right. Below it, in order: the time-of-day cards, the "Only if needed" card, the "Ask your doctor or pharmacist" group, the warning panel, the follow-up line, the legend (if needed), and a fixed footer banner.
- **Share (stretch):** Save as image, Share on WhatsApp, Print.

## Look and Feel
The concept is **"A prescription slip written for grandmother."** Warm paper, big friendly type, calm colour. It should feel like a trusted family helper, not a hospital system or a generic AI chat app. **Avoid** purple gradients, glassmorphism and chat bubbles.

- **Colours:** background paper `#FBF6EE`, cards `#FFFFFF`, ink `#12433E` (deep teal), muted text `#5B6B68`, accent turmeric `#E0A100` (primary buttons, focus ring).
- **Time of day:** morning amber `#F2B84B`, afternoon sky `#5BA4CF`, evening terracotta `#C8643C`, night indigo `#3D4A8F`. Each colour is always paired with an icon, a Telugu label and an English label.
- **Warning panel:** background `#FBE9E4`, border and icon `#9B2C1D`.
- **Shape:** radius 16px for cards, 12px for inputs, 999px for chips. One soft shadow only: `0 4px 16px rgba(18,67,62,0.08)`. Spacing scale: 4, 8, 12, 16, 24, 32.
- **Type:** Noto Sans Telugu for Telugu, and a clean humanist or system sans for English. Mobile sizes: Telugu body 20px, medicine name 22px semibold, section heading 26px, page title 30px. Telugu line height is 1.6.
- **Motion:** cards fade and rise in with a 60ms stagger. All motion is off under `prefers-reduced-motion`.
- **Accessibility:** contrast at least 4.5:1, never colour alone, a visible turmeric focus ring, and labels on all icons and images. Telugu and English text are both present in the DOM.
- **Microcopy:** plain, warm, short sentences with no medical jargon. Telugu phrases are AI-generated, and the learner (a Telugu speaker) reviews every phrase before recording the demo.

## Features and Behavior

### The Safety Rule
Source: `scope.md > The Safety Rule (non-negotiable)`.
The app only re-presents what is written. It never suggests, changes or infers a dose or timing, except for the clearly labelled, caregiver-confirmed slot suggestions defined in **Slot Mapping**. Anything unclear is routed to "Ask your doctor or pharmacist". Each rule below is written so it can be checked.

- [ ] Every dose shown on the plan is exactly the dose written on the sheet, with units as written (for example "500 mg"). A caregiver's edit is shown with a visible "Changed by your family" marker and the original value. The app never fills in a missing dose.
- [ ] Every difference between the plan and the paper, whether a slot or an edited field, is marked on the plan. Nothing is silently changed.
- [ ] No medicine reaches a time-of-day slot unless its slot came directly from the paper, or a caregiver confirmed a suggested slot.
- [ ] No unconfirmed suggestion can reach the plan.
- [ ] Every warning sign shown on the plan comes from the document. None are added.

### Image Upload
- Camera capture or gallery selection. "Try a sample sheet" loads one of the fictional samples.
- Before upload, the image is resized to at most 1600px on the long side, as a JPEG at about 0.8 quality.
- "Your photo is not saved" must be true: no photo or extracted data is stored after the request.
  - [ ] Uploading any of the 3 sample sheets moves to Reading and then to Check with paper.

### Extraction
For each medicine, the app extracts the name, dose, frequency, food instruction and source text exactly as written. It also extracts the warning signs and the follow-up instruction written in the document. Any value it isn't sure about is flagged.
  - [ ] Every medicine on each of the 3 samples appears on the Check screen, with a "from the paper: <source text>" line.
  - [ ] Unsure values show an amber "Check this against the paper" badge.

### Slot Mapping
Frequencies are sorted into four kinds:

| Written on the sheet | Behavior on the Check screen |
|---|---|
| **Digit pattern** (e.g. `1-0-1`, `1-1-1`, `1-0-0-1`) | Maps directly to the matching slots. No extra tap needed. |
| **Named time or meal word** (e.g. "Morning", "8 AM", "at bedtime", "after breakfast") | Maps directly. The written time is also shown on the row. No extra tap needed. |
| **Count only:** OD, BD, TDS, QID | Frequency shown as written, plus pre-filled slots with an amber **"Suggested, please confirm"** chip. Each such row needs its **own confirm tap**, which turns the chip into a tick. |
| **Anything else** (as directed, weekly, blank, unreadable, unsupported) | Goes in the **"Ask your doctor or pharmacist"** group with no slot. |
| **SOS / as needed** | Goes in the **"Only if needed"** card. |

- **Suggested defaults:** OD = morning. BD = morning and night. TDS = morning, afternoon and night. QID = morning, afternoon, evening and night.
- **Clock times** use half-open ranges: morning 05:00 to before 11:00, afternoon 11:00 to before 16:00, evening 16:00 to before 20:00, night 20:00 to before 05:00. "At bedtime" is night.
- **Meal words:** breakfast = morning, lunch = afternoon, dinner = night.
- The caregiver can change the slot chips on any row that has slots. If they change a slot that came directly from the paper, it gets the same "chosen by your family" marker as a confirmed suggestion.
- Items in the "Ask your doctor or pharmacist" group can't be given a slot in the POC.
- [ ] `1-0-1` puts the medicine in morning and night with no confirm tap required.
- [ ] "8 AM" puts it in morning and shows "8 AM" on the row. "11:00" is afternoon. "20:00" is night. "04:59" is night.
- [ ] BD shows "Suggested, please confirm" on morning and night, and needs a tap.
- [ ] "As directed", "weekly", a blank frequency and an unreadable frequency each appear in the "Ask your doctor or pharmacist" group with no slot.
- [ ] SOS appears only in "Only if needed".
- [ ] Moving a `1-0-1` medicine from night to evening shows the "chosen by your family" marker on the evening slot.
- [ ] An "Ask your doctor or pharmacist" item offers no slot chips.

### Check With Paper (the safety gate)
- Every field (name, dose, frequency, food instruction) is editable inline.
- "Looks right, make the plan" stays **disabled until** every suggested row is confirmed **and** the "I compared this with the paper" checkbox is ticked.
  - [ ] With one BD row unconfirmed and the box ticked, the button is disabled.
  - [ ] With all suggestions confirmed and the box unticked, the button is disabled.
  - [ ] With both done, the button is enabled and leads to the plan.

### Food Instructions
- The chips before food (భోజనానికి ముందు), after food (భోజనం తర్వాత) and with food appear **only for those exact meanings**.
- Anything else ("empty stomach", "30 min before breakfast", "after breakfast") is shown as plain text, translated faithfully, with the original English in small text beneath. It is never converted to the nearest chip.
- If no food instruction is written, nothing is shown.
- Food instructions never decide the slot.
  - [ ] "Empty stomach" shows as Telugu text with "empty stomach" beneath it, and no chip.
  - [ ] A medicine with no food instruction shows no chip and no text.

### Telugu Plan
- Four time-of-day cards in order: ఉదయం (morning), మధ్యాహ్నం (afternoon), సాయంత్రం (evening), రాత్రి (night). Each has a coloured header with an icon. Empty slots are hidden.
- **Each medicine row** shows:
  - the name in English exactly as written, large and primary, so the patient can match it to the strip or bottle (no transliteration)
  - the dose as written
  - the food chip or text
  - the frequency as written in small text (for example "BD, twice a day")
  - the written time, if one was given
- **Family-chosen slots** carry a small marker, explained by a legend at the bottom. Each legend line appears only when that kind of marker is present:
  - Confirmed suggestion: "Time chosen by your family. The sheet only said how many times."
  - A slot the caregiver moved away from the paper's timing: "Time changed by your family from the sheet."
  - Slots taken directly from the paper have no marker.
- **Missing dose but known frequency:** the row keeps its slot and shows "Not written on the sheet. Ask your doctor or pharmacist." in place of the dose.
- **Caregiver edits:** any edit to a name, dose or food instruction shows a "Changed by your family" marker, with a small line beneath: "Sheet said: <original value>". The original value is kept in memory for the session only.
- **"Only if needed"** card below the four slots, for SOS medicines.
- **"Ask your doctor or pharmacist"** group, for medicines with no usable frequency.
- **"Go to hospital immediately if"** panel with a warning icon, listing the document's warning signs translated into Telugu. It is **always shown**. If the document lists none, it shows the fixed line: "No warning signs were written on this sheet. Ask your doctor what to watch for."
- **Follow-up line** from the document (for example "Medicine OPD after 2 weeks"). It is **always shown**. If the document has none, it shows: "No follow-up was written on this sheet."
- **Fixed footer:** "This plan only repeats what your hospital wrote. Confirm with your doctor or pharmacist."
- **Telugu / English toggle** switches the plan's labels and translated text.
  - [ ] For each of the 3 samples, every confirmed medicine appears in exactly the expected slots, with the dose as written.
  - [ ] The "chosen by your family" legend line appears only when a confirmed suggestion is present. The "changed by your family from the sheet" line appears only when a moved slot is present. Neither appears for a plan taken entirely from the paper.
  - [ ] The footer is always visible on the plan.
  - [ ] A sheet with no warning signs shows the warning panel with "No warning signs were written on this sheet. Ask your doctor what to watch for."
  - [ ] A sheet with no follow-up shows "No follow-up was written on this sheet."
  - [ ] Editing a dose from "500 mg" to "250 mg" shows "250 mg" with the "Changed by your family" marker and "Sheet said: 500 mg".
  - [ ] Edits to the name and to the food instruction behave the same way. An unedited field shows no marker.

### Share (stretch, not part of "done")
- Save as image (1080×1350, same design, readable at thumbnail size, includes the safety footer), Share on WhatsApp, Print.
- The print stylesheet is black on white, one page, no buttons.

## States and Boundaries
- **Blurry or dark photo:** a friendly message with one retake tip. No stack traces ever.
- **Not a discharge summary, or no medicines found:** say so plainly and offer retry.
- **Rate limit or timeout:** "Busy right now, please try again in a minute" with a retry button.
- **Missing dose:** "Not written on the sheet. Ask your doctor or pharmacist." Never filled in.
- **No warning signs or no follow-up in the document:** the section still shows, with its fixed line. A missing section could look like "nothing to watch for".
- **Unreadable or unsupported frequency:** the same message, placed in the "Ask your doctor or pharmacist" group.
- **No persistence:** nothing is saved. Refreshing or closing loses the plan. The text size and the original values of edited fields are kept for the session only.

## Product Decisions
- **Count-only frequencies get suggested slots, but each one must be tapped to confirm.** This keeps the plan usable while making every non-paper timing an explicit family decision.
- **Suggested slots are marked on the plan** with a legend, so the patient can tell what the paper said from what the family chose.
- **The frequency as written is always shown on the plan,** so the source stays visible.
- **Food instructions never decide slots,** and chips are used only for exact meanings. This avoids rounding unusual instructions off to the nearest chip.
- **Medicine names and doses stay in English as written,** because the patient matches them to the strip or bottle and a misspelled transliteration would be a safety risk.
- **Clock times use half-open ranges** so boundary times are unambiguous and testable.
- **Share and Print are a stretch goal.** "Done" is the core flow at a public URL.
- **Telugu copy is reviewed by the learner** before the demo.

- **Changed slots that came from the paper get the same family marker,** with their own legend line ("Time changed by your family from the sheet."). Any timing that isn't the paper's is visible and explained accurately.
- **No slots for "Ask" items in the POC.** The caregiver should check with the doctor first.
- **Warning and follow-up sections are never hidden.** A missing section can look like "nothing to watch for", so a fixed line is shown instead.
- **Any edit to a name, dose or food instruction is marked "Changed by your family" and shows "Sheet said: <original>".** The plan never silently differs from the paper.

## What We're Building
- The Upload, Reading, Check with paper and Telugu plan screens, as above.
- Extraction of medicines, warning signs and follow-up from a photo of a printed discharge summary.
- Slot Mapping, the safety gate, the food-instruction rules, and the Telugu / English toggle.
- The error states above.
- 3 fictional sample discharge summaries, including "Try a sample sheet".
- Deployment at a public URL with no login and no storage.

## Deferred From the POC
- **Share image, WhatsApp share, Print:** stretch goals.
- **Transliterating medicine names into Telugu:** a misspelling risk. Possible later.
- **Assigning slots to "Ask" items on the Check screen:** keeps the safety gate simple.

## Possible Later Enhancements
- Hindi and Tamil.
- WhatsApp reminders.
- A pharmacist verification step.
- Telugu transliteration of medicine names, with a verification step.
- Letting the caregiver give a slot to an "Ask" item after they have checked with the doctor.

## Non-Goals
- **Dose checking or drug interaction checks:** these go against the safety rule, since the app never judges.
- **Login, database, history:** not needed to prove the one flow, and nothing is stored.
- **Reminders:** a separate loop.
- **A doctor or pharmacist portal:** a different user.
- **Heavily handwritten prescriptions:** unreliable. The POC uses printed summaries only.
- **Filling in or "fixing" anything** the sheet leaves unclear.

## Open Questions
- **Exact Telugu wording** for all microcopy: can wait for the build, and is reviewed before the demo.
- **Contents of the 3 fictional samples:** the spec should design them so together they cover every Slot Mapping kind and edge case (digit pattern, named time, OD/BD/TDS/QID, SOS, as directed, missing dose, unusual food text).

## Amendments From 4-spec
These are learner decisions made during `4-spec` after looking at the sample sheets. They refine **Slot Mapping** and **Food Instructions**.
- **Paper timing wins:** a named time or meal word (Morning, Night, bedtime, a clock time, breakfast, lunch, dinner) in the frequency **or the Instructions column** makes the slot direct, with no confirm tap. The frequency count stays visible. Examples: OD + "Night" → night. OD + "Morning" → morning.
- **Two roles for words:** food-relation words alone (before food, after food, with food, empty stomach) never decide a slot. Meal words and named times do. "Before breakfast" → morning slot, and the food text is shown as written.
- **Disagreement:** if the count and the named times disagree (BD + "Morning", OD + "morning and night"), the medicine goes to "Ask your doctor or pharmacist", with both texts shown as written.
- **Partial words:** a partly readable time or meal word ("before breakf") is never completed. It counts as unrecognised, so the slot is suggested and the row is unsure.
- **Digit patterns:** 3 positions = morning-afternoon-night, 4 positions = morning-afternoon-evening-night, 0 = no slot, any other length or an unparseable digit → Ask. A non-1 digit is shown as written on that slot's row ("Morning: 2"), never multiplied with the dose, and the pattern stays visible. These count as direct.
- **Duration:** stripped before classifying ("OD x 3 days" is OD), and shown exactly as written on the confirm screen and the plan. Never turned into dates or counts.
- **Privacy line:** if the Gemini free-tier terms allow using submitted content, "Your photo is not saved." becomes "Mandu Chit doesn't store your photo. This demo is for sample sheets only, please don't upload real patient papers."
- **Frequency edits:** an "Ask your doctor or pharmacist" row stays in Ask even if the caregiver edits its frequency. Ask rows show the hint "If this was misread, retake the photo." For other rows, a frequency edit re-schedules the row and marks it "Changed by your family" / "Sheet said: <original>". Name, dose and food edits stay allowed everywhere, with markers.
