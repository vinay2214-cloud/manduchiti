import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildConfirmState, editField, toggleSlot, confirmRow } from "@/lib/confirm";
import { canMakePlan } from "@/lib/plan";
import type { ConfirmState, Extraction } from "@/lib/types";

const fixture = (n: string) =>
  JSON.parse(readFileSync(path.join(__dirname, "fixtures", `${n}.json`), "utf8")) as Extraction;
const row = (st: ConfirmState, name: string) => st.rows.find((r) => r.name.original === name)!;

describe("the gate: canMakePlan", () => {
  const base = buildConfirmState(fixture("sample1_clean")); // has BD + OD suggestions
  const allConfirmed = base.rows.reduce((st, r) => (r.schedule.status === "suggested" ? confirmRow(st, r.id) : st), base);

  it("unconfirmed BD row + box ticked → disabled", () => {
    const st = { ...base, compared: true };
    expect(row(st, "Tab Metformin").schedule.status).toBe("suggested");
    expect(canMakePlan(st)).toBe(false);
  });
  it("all suggestions confirmed but box unticked → disabled", () => {
    expect(canMakePlan({ ...allConfirmed, compared: false })).toBe(false);
  });
  it("both done → enabled", () => {
    expect(canMakePlan({ ...allConfirmed, compared: true })).toBe(true);
  });
  it("a sheet with no suggestions only needs the box", () => {
    const st = buildConfirmState(fixture("sample4_coverage"));
    const noSuggest = { ...st, rows: st.rows.filter((r) => r.schedule.status !== "suggested") };
    expect(canMakePlan({ ...noSuggest, compared: false })).toBe(false);
    expect(canMakePlan({ ...noSuggest, compared: true })).toBe(true);
  });
});

describe("confirm state keeps the original next to every edit", () => {
  const st = buildConfirmState(fixture("sample1_clean"));
  it("starts with value === original", () => {
    const r = row(st, "Tab Metformin");
    expect(r.dose).toEqual({ original: "500 mg", value: "500 mg" });
    expect(r.originalSlots).toEqual(["morning", "night"]);
    expect(r.confirmed).toBe(false);
  });
  it("an edit changes value, never original", () => {
    const r = row(editField(st, row(st, "Tab Metformin").id, "dose", "250 mg"), "Tab Metformin");
    expect(r.dose).toEqual({ original: "500 mg", value: "250 mg" });
  });
});

describe("frequency edits", () => {
  const st = buildConfirmState(fixture("sample2_ambiguous"));
  it("an Ask row stays in Ask after its frequency is edited", () => {
    const id = row(st, "Syp Cough syrup").id;
    const r = row(editField(st, id, "frequency", "BD"), "Syp Cough syrup");
    expect(r.schedule.status).toBe("ask");
    expect(r.slots).toEqual([]);
    expect(r.frequency).toEqual({ original: "As directed", value: "BD" });
  });
  it("a suggested row edited to 1-0-1 becomes direct M+N", () => {
    const s1 = buildConfirmState(fixture("sample1_clean"));
    const id = row(s1, "Tab Metformin").id;
    const r = row(editField(s1, id, "frequency", "1-0-1"), "Tab Metformin");
    expect(r.schedule.status).toBe("direct");
    expect(r.slots).toEqual(["morning", "night"]);
  });
  it("a suggested row edited to 'as directed' moves to Ask", () => {
    const s1 = buildConfirmState(fixture("sample1_clean"));
    const id = row(s1, "Tab Metformin").id;
    const r = row(editField(s1, id, "frequency", "as directed"), "Tab Metformin");
    expect(r.schedule.status).toBe("ask");
    expect(r.slots).toEqual([]);
  });
  it("re-scheduling to a new suggestion needs a fresh confirm tap", () => {
    const s1 = buildConfirmState(fixture("sample2_ambiguous"));
    const id = row(s1, "Tab Telmisartan").id;
    const r = row(editField(s1, id, "frequency", "BD"), "Tab Telmisartan");
    expect(r.schedule.status).toBe("suggested");
    expect(r.confirmed).toBe(false);
  });
});

describe("slot chips", () => {
  const st = buildConfirmState(fixture("sample2_ambiguous"));
  const id = row(st, "Tab Telmisartan").id; // 1-0-1
  it("moving night → evening changes slots but keeps originalSlots", () => {
    const moved = toggleSlot(toggleSlot(st, id, "night"), id, "evening");
    const r = row(moved, "Tab Telmisartan");
    expect(r.slots).toEqual(["morning", "evening"]);
    expect(r.originalSlots).toEqual(["morning", "night"]);
  });
  it("the last slot can't be removed", () => {
    const one = toggleSlot(st, id, "night");
    expect(row(toggleSlot(one, id, "morning"), "Tab Telmisartan").slots).toEqual(["morning"]);
  });
  it("Ask and as-needed rows offer no slots to toggle", () => {
    const askId = row(st, "Inj Insulin (see chart)").id;
    expect(row(toggleSlot(st, askId, "morning"), "Inj Insulin (see chart)").slots).toEqual([]);
    const sosId = row(st, "Tab Paracetamol").id;
    expect(row(toggleSlot(st, sosId, "morning"), "Tab Paracetamol").slots).toEqual([]);
  });
});

describe("sample coverage table (from saved slice-1 extractions)", () => {
  const statuses = (n: string) =>
    Object.fromEntries(buildConfirmState(fixture(n)).rows.map((r) => [r.name.original, [r.schedule.status, r.slots.join("+")]]));

  it("sample 1", () => {
    expect(statuses("sample1_clean")).toEqual({
      "Tab Metformin": ["suggested", "morning+night"],
      "Tab Amlodipine": ["direct", "morning"],
      "Tab Atorvastatin": ["direct", "night"],
      "Tab Aspirin": ["suggested", "morning"],
      "Tab Pantoprazole": ["direct", "morning"],
    });
  });
  it("sample 2", () => {
    expect(statuses("sample2_ambiguous")).toEqual({
      "Tab Telmisartan": ["direct", "morning+night"],
      "Tab Azithromycin": ["suggested", "morning"],
      "Syp Cough syrup": ["ask", ""],
      "Tab Paracetamol": ["as_needed", ""],
      "Tab Vitamin D3": ["ask", ""],
      "Inj Insulin (see chart)": ["ask", ""],
    });
  });
  it("sample 3", () => {
    expect(statuses("sample3_photo_style")).toEqual({
      "Tab Clopidogrel": ["suggested", "morning"],
      "Tab Metoprolol": ["suggested", "morning+night"],
      "Tab Furosemide": ["direct", "morning"],
      "Tab Rosuvastatin": ["direct", "night"],
      "Tab Ramipril": ["direct", "night"],
      "Tab Sorbitrate": ["as_needed", ""],
    });
  });
  it("sample 4", () => {
    const st = buildConfirmState(fixture("sample4_coverage"));
    expect(statuses("sample4_coverage")).toEqual({
      "Tab Metformin": ["direct", "morning+afternoon+night"],
      "Tab Calcium": ["direct", "morning+night"],
      "Tab Levocetirizine": ["suggested", "morning+afternoon+night"],
      "Cap Amoxicillin": ["suggested", "morning+afternoon+evening+night"],
      "Tab Thyroxine": ["direct", "morning"],
      "Tab Montelukast": ["direct", "night"],
      "Tab Ecosprin": ["direct", "night"],
    });
    expect(row(st, "Tab Calcium").schedule.slotQuantities).toEqual({ morning: "2" });
  });
  it("sample 5: the cut-off row stays suggested and unsure", () => {
    const r = row(buildConfirmState(fixture("sample5_cutoff_test")), "Tab Thyroxine");
    expect(r.schedule.status).toBe("suggested");
    expect(r.unsure).toBe(true);
  });
});
