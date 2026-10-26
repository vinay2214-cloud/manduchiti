import { describe, it, expect } from "vitest";
import { checkTranslation } from "@/lib/translationGuard";

const input = [
  { id: "warn:0", text: "Fever above 101 F for more than 2 days" },
  { id: "instr:m4", text: "If fever" },
  { id: "follow", text: "Review in 1 week with chest X-ray." },
];
const good = [
  { id: "warn:0", te: "2 రోజులకు పైగా 101 F కంటే ఎక్కువ జ్వరం" },
  { id: "instr:m4", te: "జ్వరం ఉంటే" },
  { id: "follow", te: "1 వారంలో ఛాతీ ఎక్స్-రేతో చూపించుకోండి." },
];

describe("checkTranslation", () => {
  it("passes a faithful translation", () => {
    expect(checkTranslation(input, good)).toEqual({ ok: true, problems: [] });
  });
  it("fails on an extra id", () => {
    expect(checkTranslation(input, [...good, { id: "warn:9", te: "ఛాతీ నొప్పి" }]).ok).toBe(false);
  });
  it("fails on a missing id", () => {
    expect(checkTranslation(input, good.slice(1)).ok).toBe(false);
  });
  it("fails on a duplicated id, even when the count matches", () => {
    expect(checkTranslation(input, [good[0], good[0], good[2]]).ok).toBe(false);
  });
  it('fails when "101" becomes "102"', () => {
    const bad = good.map((g) => (g.id === "warn:0" ? { ...g, te: g.te.replace("101", "102") } : g));
    expect(checkTranslation(input, bad).ok).toBe(false);
  });
  it("fails when a number is added", () => {
    const bad = good.map((g) => (g.id === "instr:m4" ? { ...g, te: "100 F జ్వరం ఉంటే" } : g));
    expect(checkTranslation(input, bad).ok).toBe(false);
  });
  it('fails when "mg" is dropped', () => {
    const r = checkTranslation([{ id: "a", text: "Take 500 mg" }], [{ id: "a", te: "500 తీసుకోండి" }]);
    expect(r.ok).toBe(false);
    expect(r.problems.join(" ")).toMatch(/mg/);
  });
  it.each([["mcg"], ["ml"], ["IU"]])('fails when "%s" is dropped', (unit) => {
    expect(checkTranslation([{ id: "a", text: `10 ${unit} daily` }], [{ id: "a", te: "రోజూ 10" }]).ok).toBe(false);
  });
  it('fails when the "F" after a temperature is dropped', () => {
    const bad = good.map((g) => (g.id === "warn:0" ? { ...g, te: "2 రోజులకు పైగా 101 కంటే ఎక్కువ జ్వరం" } : g));
    expect(checkTranslation(input, bad).ok).toBe(false);
  });
  it("accepts Telugu numerals ౧౦౧ for 101", () => {
    const te = good.map((g) => (g.id === "warn:0" ? { ...g, te: "౨ రోజులకు పైగా ౧౦౧ F కంటే ఎక్కువ జ్వరం" } : g));
    expect(checkTranslation(input, te).ok).toBe(true);
  });
  it("fails on an empty translation", () => {
    const bad = good.map((g) => (g.id === "instr:m4" ? { ...g, te: "  " } : g));
    expect(checkTranslation(input, bad).ok).toBe(false);
  });
});
