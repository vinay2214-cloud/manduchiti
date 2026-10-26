import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildConfirmState, confirmRow, editField, setCompared } from "@/lib/confirm";
import { buildPlan, translationItems } from "@/lib/plan";
import { shareText, whatsappUrl } from "@/lib/share";
import { plan as S } from "@/lib/strings";
import type { ConfirmState, Extraction } from "@/lib/types";

const fixture = (n: string) => JSON.parse(readFileSync(path.join(__dirname, "fixtures", `${n}.json`), "utf8")) as Extraction;
function planFor(n: string, edit: (s: ConfirmState) => ConfirmState = (s) => s) {
  let st = edit(buildConfirmState(fixture(n)));
  for (const r of st.rows) if (r.schedule.status === "suggested") st = confirmRow(st, r.id);
  st = setCompared(st, true);
  return buildPlan(st, Object.fromEntries(translationItems(st).map((i) => [i.id, `TE:${i.text}`])));
}

describe("WhatsApp share text", () => {
  const p = planFor("sample2_ambiguous");
  const te = shareText(p, "te");

  it("lists every slot's medicines with the dose as written, in day order", () => {
    expect(te.indexOf(S.morning.te)).toBeLessThan(te.indexOf(S.night.te));
    expect(te).toContain("Tab Telmisartan 40 mg");
    expect(te).toContain("Tab Azithromycin 500 mg");
  });
  it("includes Only if needed and Ask, and the missing-dose line instead of a dose", () => {
    expect(te).toContain(S.onlyIfNeeded.te);
    expect(te).toContain("Tab Paracetamol 650 mg");
    expect(te).toContain(S.askHeading.te);
    expect(te).toContain(`Inj Insulin (see chart) — ${S.missingDose.te}`);
  });
  it("always includes the warning signs (or the fixed line), the follow-up and the safety footer", () => {
    expect(te).toContain(S.warningHeading.te);
    expect(te).toContain("TE:Blue lips");
    expect(te).toContain("TE:Review in 1 week with chest X-ray.");
    expect(te.trim().endsWith(S.footer.te)).toBe(true);
    const p4 = shareText(planFor("sample4_coverage"), "te");
    expect(p4).toContain(S.noWarnings.te);
    expect(p4).toContain(S.noFollowUp.te);
  });
  it("marks family changes, never silently", () => {
    const edited = shareText(planFor("sample1_clean", (s) => editField(s, s.rows[0].id, "dose", "250 mg")), "te");
    expect(edited).toContain(`Tab Metformin 250 mg (${S.changedByFamily.te}; ${S.sheetSaid.te} 500 mg, ${S.markerChosen.te})`);
    expect(edited).toContain(S.markerChosen.te);
  });
  it("English mode uses the English labels", () => {
    const en = shareText(p, "en");
    expect(en).toContain("Morning");
    expect(en).toContain(S.footer.en);
    expect(en).not.toContain(S.footer.te);
  });
  it("builds a wa.me link with the text fully encoded and short enough to open", () => {
    for (const n of ["sample1_clean", "sample2_ambiguous", "sample3_photo_style", "sample4_coverage"]) {
      const url = whatsappUrl(shareText(planFor(n), "te"));
      expect(url.startsWith("https://wa.me/?text=")).toBe(true);
      expect(decodeURIComponent(url.slice("https://wa.me/?text=".length))).toBe(shareText(planFor(n), "te"));
      expect(url.length, n).toBeLessThan(8000);
    }
  });
});
