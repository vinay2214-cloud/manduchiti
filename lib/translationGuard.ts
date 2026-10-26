import type { TranslateItem, TranslatedItem } from "./types";

// Deterministic check on the AI's second job: the translation may add nothing, drop nothing,
// and must keep every number and unit.

const TELUGU_DIGITS = "౦౧౨౩౪౫౬౭౮౯";
const toWestern = (s: string) => s.replace(/[౦-౯]/g, (d) => String(TELUGU_DIGITS.indexOf(d)));
const digitRuns = (s: string) => (toWestern(s).match(/\d+/g) ?? []).sort();

const UNITS: [string, RegExp][] = [
  ["mg", /mg/i],
  ["mcg", /mcg|µg|μg/i],
  ["ml", /ml/i],
  ["IU", /\biu\b|i\.u\./i],
  ["F", /°?\s*F\b/],
];
// Unit tokens in the source: mg/mcg/ml/IU anywhere as a word, F only right after a number.
const SOURCE_UNITS: [string, RegExp][] = [
  ["mg", /\d\s*mg\b|\bmg\b/i],
  ["mcg", /\bmcg\b|µg|μg/i],
  ["ml", /\d\s*ml\b|\bml\b/i],
  ["IU", /\biu\b|i\.u\./i],
  ["F", /\d\s*°?\s*F\b/],
];

export function checkTranslation(input: TranslateItem[], output: TranslatedItem[]): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const inIds = input.map((i) => i.id);
  const outIds = output.map((o) => o.id);

  if (new Set(outIds).size !== outIds.length) problems.push("duplicate ids in the translation");
  if (outIds.length !== inIds.length) problems.push(`expected ${inIds.length} items, got ${outIds.length}`);
  for (const id of inIds) if (!outIds.includes(id)) problems.push(`missing ${id}`);
  for (const id of outIds) if (!inIds.includes(id)) problems.push(`unexpected ${id}`);

  for (const item of input) {
    const out = output.find((o) => o.id === item.id);
    if (!out) continue;
    if (!out.te.trim()) {
      problems.push(`${item.id}: empty`);
      continue;
    }
    if (digitRuns(item.text).join(",") !== digitRuns(out.te).join(",")) problems.push(`${item.id}: numbers changed`);
    for (const [unit, re] of SOURCE_UNITS) {
      if (re.test(item.text) && !UNITS.find(([u]) => u === unit)![1].test(out.te)) problems.push(`${item.id}: unit ${unit} dropped`);
    }
  }
  return { ok: problems.length === 0, problems };
}
