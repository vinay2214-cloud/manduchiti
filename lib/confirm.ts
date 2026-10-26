import { schedule, SLOT_ORDER } from "./scheduler";
import type { ConfirmRow, ConfirmState, Extraction, Slot } from "./types";

type EditableField = "name" | "dose" | "frequency" | "instructions";

export function buildConfirmState(extraction: Extraction): ConfirmState {
  const rows: ConfirmRow[] = extraction.medicines.map((m) => {
    const sched = schedule(m.frequency_as_written, m.instructions_as_written);
    return {
      id: m.id,
      source_text: m.source_text,
      unsure: m.unsure || sched.unsure,
      name: { original: m.name, value: m.name },
      dose: { original: m.dose_as_written, value: m.dose_as_written },
      frequency: { original: m.frequency_as_written, value: m.frequency_as_written },
      instructions: { original: m.instructions_as_written, value: m.instructions_as_written },
      duration_as_written: m.duration_as_written ?? sched.durationAsWritten ?? null,
      sheetStatus: sched.status,
      schedule: sched,
      originalSlots: sched.slots,
      slots: sched.slots,
      confirmed: false,
    };
  });
  return { rows, warning_signs: extraction.warning_signs, follow_up: extraction.follow_up, compared: false };
}

function updateRow(state: ConfirmState, id: string, fn: (r: ConfirmRow) => ConfirmRow): ConfirmState {
  return { ...state, rows: state.rows.map((r) => (r.id === id ? fn(r) : r)) };
}

export function editField(state: ConfirmState, id: string, field: EditableField, value: string): ConfirmState {
  return updateRow(state, id, (r) => {
    const next: ConfirmRow = { ...r, [field]: { ...r[field], value } };
    // Timing edits re-run the scheduler, except on rows the sheet itself left unclear:
    // those stay in Ask so an edit can't become a side door to a slot.
    if ((field === "frequency" || field === "instructions") && r.sheetStatus !== "ask") {
      const sched = schedule(next.frequency.value, next.instructions.value);
      return { ...next, schedule: sched, slots: sched.slots, confirmed: false };
    }
    return next;
  });
}

export function toggleSlot(state: ConfirmState, id: string, slot: Slot): ConfirmState {
  return updateRow(state, id, (r) => {
    if (r.schedule.status !== "direct" && r.schedule.status !== "suggested") return r;
    const has = r.slots.includes(slot);
    if (has && r.slots.length === 1) return r; // never drop a medicine off the plan by removing its last slot
    const slots = has ? r.slots.filter((s) => s !== slot) : SLOT_ORDER.filter((s) => s === slot || r.slots.includes(s));
    // A confirmation is for specific times, so changing them asks for it again.
    return { ...r, slots, confirmed: r.schedule.status === "suggested" ? false : r.confirmed };
  });
}

export function confirmRow(state: ConfirmState, id: string): ConfirmState {
  return updateRow(state, id, (r) => (r.schedule.status === "suggested" ? { ...r, confirmed: true } : r));
}

const SLOT_EN: Record<Slot, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };

// The confirm tap names exactly the times it confirms.
export function confirmLabel(row: ConfirmRow): string {
  if (row.schedule.status !== "suggested") return "";
  const times = row.slots.map((s) => SLOT_EN[s]).join(", ");
  return row.confirmed ? `Confirmed: ${times}` : `Tap to confirm: ${times}`;
}

export function setCompared(state: ConfirmState, compared: boolean): ConfirmState {
  return { ...state, compared };
}
