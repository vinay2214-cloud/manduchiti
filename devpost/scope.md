---
doc: scope
status: approved
---

# Mandu Chit

A web app that turns a photo of an English hospital discharge summary into a large-print Telugu daily medicine plan for an elderly patient in Andhra Pradesh.

## The Problem
Elderly patients in Andhra Pradesh are discharged with a paper summary in English and 5 to 10 medicines. They often can't read it, and the family member who can is often in another city. Missed or mistimed medicines lead to readmissions.

## The Unique Kernel
Photo of a discharge summary in → large-print Telugu day plan out (morning, afternoon, evening, night, before or after food), plus the warning signs written in the document. The app is **faithful to the paper**: it only re-presents what's written, with a caregiver confirmation step in between.

## Who It's For
- **The caregiver** (an adult child, often in another city) who can read English. They upload the photo and confirm the extracted medicines against the paper.
- **The patient** (elderly, reads Telugu, can't read the English summary) who reads the large Telugu plan.

## The Core Loop
1. The caregiver uploads a photo of the discharge summary.
2. The app extracts the medicines (name, dose, timing, before or after food) and the warning signs.
3. The caregiver checks the extracted medicines against the paper and corrects them if needed.
4. The app shows the large-print Telugu day plan and the warning signs.

They come back for each new discharge or prescription change.

## The Safety Rule (non-negotiable)
The app only re-presents what's written. It never suggests, changes, or infers a dose or timing. Anything unclear is flagged **"ask your doctor or pharmacist"**. This rule must be testable: `4-spec` turns it into concrete checks and `5-build` turns those into tests. That is also the learner's stated learning goal.

## Inspiration & Identity
Not discussed yet. Large print and readability for elderly Telugu readers are implied by the kernel. `3-prd` will cover look and feel.

## Why This Matters to the Learner
Not discussed directly. The learner studies health informatics, has built healthcare hackathon projects before, and wants to practice turning a safety rule into something testable.

## What "Working" Looks Like
On **3 fictional sample discharge summaries**, the app extracts the medicines, the learner confirms them against the paper, and it shows the Telugu plan end to end, **at a public URL**.

The "oh, that's cool" moment: an English discharge photo goes in, the caregiver confirms, and a clear large-print Telugu day plan comes out.

## The POC Boundary
In:
- Upload a photo of a printed discharge summary.
- Extract medicines (dose, timing, food relation) and the warning signs written in the document.
- Caregiver confirmation and correction screen.
- Large-print Telugu plan in morning / afternoon / evening / night slots, with before or after food.
- Warning signs shown in Telugu.
- "Ask your doctor or pharmacist" flags for anything unclear.
- Deployed at a public URL. No login, no database, one flow end to end.

**Stretch (not part of "done"):** a share image for WhatsApp.

## Later (pitch only)
- Hindi and Tamil
- WhatsApp reminders
- A pharmacist verification step

## Explicitly Cut
- **Login, database, history:** not needed to prove the one flow. No database also means no stored medical documents.
- **Reminders:** a separate product loop. A WhatsApp version is listed under Later.
- **Dose checking and drug interaction checks:** these would go against the safety rule, since the app judges nothing and only re-presents the document.
- **Other languages:** Telugu proves the kernel. Others are listed under Later.
- **Doctor or pharmacist portal:** a different user. A pharmacist verification step is listed under Later.
- **Heavily handwritten prescriptions:** extraction is unreliable, so the POC uses printed summaries only.
