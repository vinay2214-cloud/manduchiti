import { foodDisplay } from "./food";
import { SLOT_ORDER } from "./scheduler";
import type { ConfirmRow, ConfirmState, FieldChange, Plan, PlanFood, PlanRow, Slot, TranslateItem, Translations } from "./types";

const SLOT_EN: Record<Slot, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };
const FIELDS = ["name", "dose", "frequency", "instructions"] as const;

// The safety gate: every suggested slot confirmed by a tap, and the paper comparison ticked.
export function canMakePlan(state: ConfirmState): boolean {
  return state.compared && state.rows.every((r) => r.schedule.status !== "suggested" || r.confirmed);
}

const blank = (s: string | null) => (s ?? "").trim() === "";
const edited = (r: ConfirmRow, f: (typeof FIELDS)[number]) => (r[f].value ?? "") !== (r[f].original ?? "");

// Only the document's own free text goes to translation: non-chip instructions, warning signs, follow-up.
export function translationItems(state: ConfirmState): TranslateItem[] {
  const items: TranslateItem[] = [];
  for (const r of state.rows) {
    const food = foodDisplay(r.instructions.value);
    if (food.kind === "text") items.push({ id: `instr:${r.id}`, text: food.text });
  }
  state.warning_signs.forEach((w, i) => {
    if (!blank(w)) items.push({ id: `warn:${i}`, text: w });
  });
  if (!blank(state.follow_up)) items.push({ id: "follow", text: state.follow_up! });
  return items;
}

function translated(t: Translations, id: string): string {
  const te = t[id];
  // Never show free text whose translation didn't pass the guard.
  if (te === undefined) throw new Error(`missing checked translation for ${id}`);
  return te;
}

function fieldChanges(r: ConfirmRow): FieldChange[] {
  const changes: FieldChange[] = FIELDS.filter((f) => edited(r, f)).map((f) => ({ field: f, original: r[f].original }));
  // A paper-given row whose times differ from the sheet's: record what the sheet said.
  const timingEdited = edited(r, "frequency") || edited(r, "instructions");
  const sameTimes = r.slots.length === r.originalSlots.length && r.slots.every((s) => r.originalSlots.includes(s));
  if (r.sheetStatus === "direct" && !timingEdited && !sameTimes) {
    changes.push({ field: "times", original: r.originalSlots.map((s) => SLOT_EN[s]).join(", ") });
  }
  return changes;
}

function slotMarker(r: ConfirmRow, slot: Slot): PlanRow["slotMarker"] {
  if (edited(r, "frequency") || edited(r, "instructions")) return "moved";
  if (r.schedule.status === "suggested") return "suggested_confirmed";
  if (!r.originalSlots.includes(slot)) return "moved";
  return null;
}

function planRow(r: ConfirmRow, t: Translations, slot?: Slot): PlanRow {
  const fd = foodDisplay(r.instructions.value);
  const food: PlanFood = fd.kind === "text" ? { kind: "text", en: fd.text, te: translated(t, `instr:${r.id}`) } : fd;
  const quantity = slot ? r.schedule.slotQuantities?.[slot] : undefined;
  return {
    id: r.id,
    name: r.name.value ?? "",
    dose: blank(r.dose.value) ? null : r.dose.value,
    ...(quantity ? { quantity } : {}),
    food,
    frequencyAsWritten: r.frequency.value,
    durationAsWritten: r.duration_as_written,
    ...(r.schedule.writtenTime ? { writtenTime: r.schedule.writtenTime } : {}),
    slotMarker: slot ? slotMarker(r, slot) : null,
    fieldChanges: fieldChanges(r),
    ...(r.schedule.status === "ask" ? { reason: r.schedule.reason } : {}),
  };
}

export function buildPlan(state: ConfirmState, translations: Translations): Plan {
  // The gate again, so no caller can build a plan around it.
  if (!canMakePlan(state)) throw new Error("plan requested before every suggestion was confirmed and the paper compared");

  const slots = SLOT_ORDER.map((slot) => ({
    slot,
    rows: state.rows
      .filter((r) => (r.schedule.status === "direct" || r.schedule.status === "suggested") && r.slots.includes(slot))
      .map((r) => planRow(r, translations, slot)),
  })).filter((s) => s.rows.length > 0);

  const asNeeded = state.rows.filter((r) => r.schedule.status === "as_needed").map((r) => planRow(r, translations));
  const ask = state.rows.filter((r) => r.schedule.status === "ask").map((r) => planRow(r, translations));

  const warningItems = state.warning_signs
    .map((en, i) => ({ en, i }))
    .filter(({ en }) => !blank(en))
    .map(({ en, i }) => ({ en, te: translated(translations, `warn:${i}`) }));

  const all = [...slots.flatMap((s) => s.rows), ...asNeeded, ...ask];
  return {
    slots,
    asNeeded,
    ask,
    warnings: warningItems.length ? { kind: "items", items: warningItems } : { kind: "fixed" },
    followUp: blank(state.follow_up)
      ? { kind: "fixed" }
      : { kind: "text", en: state.follow_up!, te: translated(translations, "follow") },
    showSuggestedLegend: all.some((r) => r.slotMarker === "suggested_confirmed"),
    showMovedLegend: all.some((r) => r.slotMarker === "moved" || r.fieldChanges.some((c) => c.field === "times")),
  };
}
