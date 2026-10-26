import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildConfirmState, confirmRow, editField, setCompared, toggleSlot } from "@/lib/confirm";
import { buildPlan, translationItems } from "@/lib/plan";
import { SLOT_ORDER } from "@/lib/scheduler";
import type { ConfirmState, Extraction, Plan, PlanRow, Slot, Translations } from "@/lib/types";

const fixture = (n: string) =>
  JSON.parse(readFileSync(path.join(__dirname, "fixtures", `${n}.json`), "utf8")) as Extraction;
const idOf = (st: ConfirmState, name: string) => st.rows.find((r) => r.name.original === name)!.id;

// Stand-in for /api/telugu: a fake "translation" that keeps every number, so the plan can be built offline.
const fakeTranslate = (st: ConfirmState): Translations =>
  Object.fromEntries(translationItems(st).map((i) => [i.id, `TE(${i.text})`]));

function ready(n: string, edit: (st: ConfirmState) => ConfirmState = (s) => s): ConfirmState {
  let st = edit(buildConfirmState(fixture(n)));
  for (const r of st.rows) if (r.schedule.status === "suggested") st = confirmRow(st, r.id);
  return setCompared(st, true);
}
const plan = (st: ConfirmState) => buildPlan(st, fakeTranslate(st));
const inSlot = (p: Plan, slot: Slot) => p.slots.find((s) => s.slot === slot)?.rows ?? [];
const find = (p: Plan, slot: Slot, name: string) => inSlot(p, slot).find((r) => r.name === name);
const allRows = (p: Plan): PlanRow[] => [...p.slots.flatMap((s) => s.rows), ...p.asNeeded, ...p.ask];

describe("every confirmed medicine lands in exactly the expected slots, dose as written", () => {
  const expected: Record<string, Record<string, Slot[] | "as_needed" | "ask">> = {
    sample1_clean: {
      "Tab Metformin": ["morning", "night"], "Tab Amlodipine": ["morning"], "Tab Atorvastatin": ["night"],
      "Tab Aspirin": ["morning"], "Tab Pantoprazole": ["morning"],
    },
    sample2_ambiguous: {
      "Tab Telmisartan": ["morning", "night"], "Tab Azithromycin": ["morning"], "Syp Cough syrup": "ask",
      "Tab Paracetamol": "as_needed", "Tab Vitamin D3": "ask", "Inj Insulin (see chart)": "ask",
    },
    sample4_coverage: {
      "Tab Metformin": ["morning", "afternoon", "night"], "Tab Calcium": ["morning", "night"],
      "Tab Levocetirizine": ["morning", "afternoon", "night"], "Cap Amoxicillin": ["morning", "afternoon", "evening", "night"],
      "Tab Thyroxine": ["morning"], "Tab Montelukast": ["night"], "Tab Ecosprin": ["night"],
    },
  };
  for (const [sample, meds] of Object.entries(expected)) {
    it(sample, () => {
      const ex = fixture(sample);
      const p = plan(ready(sample));
      for (const [name, where] of Object.entries(meds)) {
        const dose = ex.medicines.find((m) => m.name === name)!.dose_as_written;
        if (where === "as_needed" || where === "ask") {
          const list = where === "ask" ? p.ask : p.asNeeded;
          expect(list.map((r) => r.name)).toContain(name);
          expect(p.slots.some((s) => s.rows.some((r) => r.name === name))).toBe(false);
          continue;
        }
        const slotsFound = SLOT_ORDER.filter((s) => find(p, s, name));
        expect(slotsFound, name).toEqual(where);
        for (const s of where) expect(find(p, s, name)!.dose).toBe(dose);
      }
    });
  }
  it("empty slots are dropped and the rest stay in day order", () => {
    expect(plan(ready("sample1_clean")).slots.map((s) => s.slot)).toEqual(["morning", "night"]);
  });
  it("a 2-0-1 quantity shows on the morning slot only", () => {
    const p = plan(ready("sample4_coverage"));
    expect(find(p, "morning", "Tab Calcium")!.quantity).toBe("2");
    expect(find(p, "night", "Tab Calcium")!.quantity).toBeUndefined();
  });
});

describe("the gate is enforced again in buildPlan", () => {
  it("refuses an unconfirmed suggestion", () => {
    const st = setCompared(buildConfirmState(fixture("sample1_clean")), true);
    expect(() => plan(st)).toThrow();
  });
  it("refuses when the paper comparison isn't ticked", () => {
    expect(() => plan(setCompared(ready("sample1_clean"), false))).toThrow();
  });
  it("refuses to show a free-text item without its checked translation", () => {
    const st = ready("sample2_ambiguous");
    const t = fakeTranslate(st);
    delete t["warn:0"];
    expect(() => buildPlan(st, t)).toThrow();
  });
});

describe("markers", () => {
  it("a confirmed suggestion carries 'suggested_confirmed'; paper slots carry none", () => {
    const p = plan(ready("sample1_clean"));
    expect(find(p, "morning", "Tab Metformin")!.slotMarker).toBe("suggested_confirmed");
    expect(find(p, "morning", "Tab Amlodipine")!.slotMarker).toBeNull();
  });
  it("moving a 1-0-1 night slot to evening marks the evening slot 'moved' and records the sheet's times", () => {
    const p = plan(ready("sample2_ambiguous", (st) => {
      const id = idOf(st, "Tab Telmisartan");
      return toggleSlot(toggleSlot(st, id, "night"), id, "evening");
    }));
    expect(find(p, "evening", "Tab Telmisartan")!.slotMarker).toBe("moved");
    expect(find(p, "night", "Tab Telmisartan")).toBeUndefined();
    expect(find(p, "morning", "Tab Telmisartan")!.fieldChanges).toContainEqual({ field: "times", original: "Morning, Night" });
  });
  it('editing a dose from 500 mg to 250 mg shows 250 mg with "Sheet said: 500 mg"', () => {
    const p = plan(ready("sample1_clean", (st) => editField(st, idOf(st, "Tab Metformin"), "dose", "250 mg")));
    const r = find(p, "morning", "Tab Metformin")!;
    expect(r.dose).toBe("250 mg");
    expect(r.fieldChanges).toEqual([{ field: "dose", original: "500 mg" }]);
  });
  it("name and instruction edits are marked the same way; unedited rows carry no field changes", () => {
    const p = plan(ready("sample1_clean", (st) => {
      st = editField(st, idOf(st, "Tab Aspirin"), "name", "Tab Ecosprin");
      return editField(st, idOf(st, "Tab Atorvastatin"), "instructions", "Night, after food");
    }));
    expect(find(p, "morning", "Tab Ecosprin")!.fieldChanges).toEqual([{ field: "name", original: "Tab Aspirin" }]);
    expect(find(p, "night", "Tab Atorvastatin")!.fieldChanges).toEqual([{ field: "instructions", original: "Night" }]);
    expect(find(p, "morning", "Tab Amlodipine")!.fieldChanges).toEqual([]);
  });
  it('editing a BD row to 1-0-1 → direct M+N, slots "moved", "Sheet said: BD"', () => {
    const p = plan(ready("sample1_clean", (st) => editField(st, idOf(st, "Tab Metformin"), "frequency", "1-0-1")));
    for (const s of ["morning", "night"] as Slot[]) {
      const r = find(p, s, "Tab Metformin")!;
      expect(r.slotMarker).toBe("moved");
      expect(r.fieldChanges).toContainEqual({ field: "frequency", original: "BD" });
    }
  });
  it("editing an Ask row's frequency keeps it in Ask with no slots, but marks the edit", () => {
    const p = plan(ready("sample2_ambiguous", (st) => editField(st, idOf(st, "Syp Cough syrup"), "frequency", "BD")));
    const r = p.ask.find((x) => x.name === "Syp Cough syrup")!;
    expect(r.fieldChanges).toContainEqual({ field: "frequency", original: "As directed" });
    expect(p.slots.some((s) => s.rows.some((x) => x.name === "Syp Cough syrup"))).toBe(false);
  });
});

describe("legend lines appear only when their marker is present", () => {
  it("none for a plan taken entirely from the paper", () => {
    const p = plan(ready("sample4_coverage", (st) => ({ ...st, rows: st.rows.filter((r) => r.schedule.status === "direct") })));
    expect([p.showSuggestedLegend, p.showMovedLegend]).toEqual([false, false]);
  });
  it("only the suggested line when only suggestions were confirmed", () => {
    const p = plan(ready("sample1_clean"));
    expect([p.showSuggestedLegend, p.showMovedLegend]).toEqual([true, false]);
  });
  it("the moved line once a paper slot is moved", () => {
    const p = plan(ready("sample2_ambiguous", (st) => toggleSlot(st, idOf(st, "Tab Telmisartan"), "evening")));
    expect(p.showMovedLegend).toBe(true);
  });
});

describe("fixed lines and missing dose", () => {
  it("no warning signs → fixed warnings line; no follow-up → fixed follow-up line", () => {
    const p = plan(ready("sample4_coverage"));
    expect(p.warnings).toEqual({ kind: "fixed" });
    expect(p.followUp).toEqual({ kind: "fixed" });
  });
  it("warnings and follow-up are the document's own, each with its checked translation", () => {
    const p = plan(ready("sample2_ambiguous"));
    expect(p.warnings).toEqual({ kind: "items", items: fixture("sample2_ambiguous").warning_signs.map((en) => ({ en, te: `TE(${en})` })) });
    expect(p.followUp).toEqual({ kind: "text", en: "Review in 1 week with chest X-ray.", te: "TE(Review in 1 week with chest X-ray.)" });
  });
  it("a null dose → dose null (the plan shows 'Not written on the sheet'); never filled in", () => {
    const p = plan(ready("sample2_ambiguous"));
    expect(p.ask.find((r) => r.name === "Inj Insulin (see chart)")!.dose).toBeNull();
  });
  it("food: exact chips stay chips, other text is translated with the English kept", () => {
    const p = plan(ready("sample4_coverage"));
    expect(find(p, "morning", "Tab Metformin")!.food).toEqual({ kind: "chip", chip: "after" });
    expect(find(p, "morning", "Tab Thyroxine")!.food).toEqual({
      kind: "text", en: "Empty stomach 30 min before breakfast", te: "TE(Empty stomach 30 min before breakfast)",
    });
    expect(find(p, "morning", "Cap Amoxicillin")!.food).toEqual({ kind: "none" });
  });
  it("duration and frequency stay as written", () => {
    const r = find(plan(ready("sample2_ambiguous")), "morning", "Tab Azithromycin")!;
    expect([r.frequencyAsWritten, r.durationAsWritten]).toEqual(["OD", "x 3 days"]);
  });
});

describe("translationItems sends only free text from the document", () => {
  it("non-chip instructions, warnings and follow-up — never names, doses or chip text", () => {
    const items = translationItems(ready("sample2_ambiguous"));
    expect(items.map((i) => i.text).sort()).toEqual(
      ["If fever", "Sunday", "Fever above 101 F for more than 2 days", "Breathing difficulty", "Coughing blood", "Blue lips", "Review in 1 week with chest X-ray."].sort(),
    );
  });
});

// Randomized property: whatever the caregiver does, every difference from the paper is visible on the plan.
describe("nothing silently changed", () => {
  const samples = ["sample1_clean", "sample2_ambiguous", "sample3_photo_style", "sample4_coverage"];
  let seed = 42;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const VALUES = ["250 mg", "1-0-1", "BD", "Night", "after food", "as directed", "Tab Other", "", "OD", "8 PM"];

  it("holds for 300 random edit sequences", () => {
    for (let run = 0; run < 300; run++) {
      let st = buildConfirmState(fixture(pick(samples)));
      for (let k = 0; k < 6; k++) {
        const r = pick(st.rows);
        if (rnd() < 0.5) st = editField(st, r.id, pick(["name", "dose", "frequency", "instructions"] as const), pick(VALUES));
        else st = toggleSlot(st, r.id, pick(SLOT_ORDER));
      }
      for (const r of st.rows) if (r.schedule.status === "suggested") st = confirmRow(st, r.id);
      st = setCompared(st, true);
      const p = plan(st);

      for (const row of st.rows) {
        const shown = allRows(p).filter((x) => x.id === row.id);
        expect(shown.length, "every medicine appears on the plan").toBeGreaterThan(0);
        for (const f of ["name", "dose", "frequency", "instructions"] as const) {
          const changed = (row[f].value ?? "") !== (row[f].original ?? "");
          for (const x of shown) {
            expect(x.fieldChanges.some((c) => c.field === f && c.original === row[f].original), `${f} edit on ${row.id}`).toBe(changed);
          }
        }
        for (const { slot, rows } of p.slots) {
          const x = rows.find((y) => y.id === row.id);
          if (!x) continue;
          if (!row.originalSlots.includes(slot) || row.schedule.status === "suggested") {
            expect(x.slotMarker, `${row.id} in ${slot}`).not.toBeNull();
          }
        }
        const sameTimes = row.slots.length === row.originalSlots.length && row.slots.every((s) => row.originalSlots.includes(s));
        if (row.sheetStatus === "direct" && !sameTimes && row.slots.length > 0) {
          const marked = shown.every((x) => x.slotMarker === "moved" || x.fieldChanges.some((c) => c.field === "times" || c.field === "frequency" || c.field === "instructions"));
          expect(marked, `${row.id} times changed`).toBe(true);
        }
      }
    }
  });
});
