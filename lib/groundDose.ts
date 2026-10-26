import type { Extraction } from "./types";

// Lowercase, drop whitespace, and fold unit spellings so "500 mg" matches "500mg".
export function normalizeDoseText(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/i\.u\./g, "iu")
    .replace(/(?<=\d)(µg|μg|mcgs|ug)/g, "mcg")
    .replace(/(?<=\d)(milligrams?|mgs)/g, "mg")
    .replace(/(?<=\d)mls/g, "ml");
}

// A dose the model returned must appear in its own printed row, or the row is unsure.
export function groundDoses(extraction: Extraction): Extraction {
  return {
    ...extraction,
    medicines: extraction.medicines.map((m) => {
      if (m.dose_as_written === null) return m;
      const grounded = normalizeDoseText(m.source_text).includes(normalizeDoseText(m.dose_as_written));
      return grounded ? m : { ...m, unsure: true };
    }),
  };
}
