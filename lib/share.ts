import { plan as S, type Lang } from "./strings";
import type { Plan, PlanRow } from "./types";

// Plain-text plan for a WhatsApp message: same order and same markers as the screen, nothing dropped.
function line(r: PlanRow, lang: Lang): string {
  const changes = r.fieldChanges
    .filter((c) => c.field !== "times")
    .map((c) => `${S.changedByFamily[lang]}; ${S.sheetSaid[lang]} ${c.original ?? "—"}`);
  const marker = r.slotMarker ? [r.slotMarker === "moved" ? S.markerMoved[lang] : S.markerChosen[lang]] : [];
  const notes = [...changes, ...marker];
  const dose = r.dose ? ` ${r.dose}` : ` — ${S.missingDose[lang]}`;
  const qty = r.quantity ? ` ×${r.quantity}` : "";
  return `• ${r.name}${dose}${qty}${notes.length ? ` (${notes.join(", ")})` : ""}`;
}

export function shareText(plan: Plan, lang: Lang): string {
  const out: string[] = [`*${S.title[lang]}*`, ""];
  for (const { slot, rows } of plan.slots) out.push(`*${S[slot][lang]}*`, ...rows.map((r) => line(r, lang)), "");
  if (plan.asNeeded.length) out.push(`*${S.onlyIfNeeded[lang]}*`, ...plan.asNeeded.map((r) => line(r, lang)), "");
  if (plan.ask.length) out.push(`*${S.askHeading[lang]}*`, ...plan.ask.map((r) => line(r, lang)), "");
  out.push(`*⚠ ${S.warningHeading[lang]}*`);
  if (plan.warnings.kind === "fixed") out.push(S.noWarnings[lang]);
  else out.push(...plan.warnings.items.map((w) => `• ${lang === "te" ? w.te : w.en}`));
  out.push("", `*${S.followUpHeading[lang]}*`);
  out.push(plan.followUp.kind === "fixed" ? S.noFollowUp[lang] : lang === "te" ? plan.followUp.te : plan.followUp.en);
  out.push("", S.footer[lang]);
  return out.join("\n");
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
