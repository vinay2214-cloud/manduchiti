import { describe, it, expect } from "vitest";
import { groundDoses } from "@/lib/groundDose";
import type { Extraction, ExtractedMedicine } from "@/lib/types";

function med(dose: string | null, source: string): ExtractedMedicine {
  return {
    id: "m1", name: "X", dose_as_written: dose, frequency_as_written: "BD",
    instructions_as_written: null, duration_as_written: null, source_text: source, unsure: false,
  };
}
function run(m: ExtractedMedicine) {
  const e: Extraction = { document_ok: true, medicines: [m], warning_signs: [], follow_up: null };
  return groundDoses(e).medicines[0];
}

describe("groundDoses", () => {
  it("keeps a dose that appears in its source line, ignoring spacing", () => {
    expect(run(med("500 mg", "Tab Metformin 500mg BD")).unsure).toBe(false);
  });
  it("treats mcg and µg as the same unit", () => {
    expect(run(med("50 mcg", "Tab Thyroxine 50 µg OD")).unsure).toBe(false);
  });
  it("normalizes ml/mls and iu/i.u.", () => {
    expect(run(med("10 ml", "Syp Lactulose 10 mls HS")).unsure).toBe(false);
    expect(run(med("12 IU", "Inj Insulin 12 i.u. before breakfast")).unsure).toBe(false);
  });
  it("flags a dose that the source line doesn't contain", () => {
    expect(run(med("250 mg", "Tab Metformin 500 mg BD")).unsure).toBe(true);
  });
  it("leaves a null dose alone", () => {
    const m = med(null, "Inj Insulin as directed");
    expect(run(m)).toEqual(m);
  });
  it("never clears an unsure flag the model already set", () => {
    expect(run({ ...med("500 mg", "Tab Metformin 500 mg BD"), unsure: true }).unsure).toBe(true);
  });
});
