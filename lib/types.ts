export type Slot = "morning" | "afternoon" | "evening" | "night";

export type ExtractedMedicine = {
  id: string;
  name: string;
  dose_as_written: string | null;
  frequency_as_written: string | null;
  instructions_as_written: string | null;
  duration_as_written: string | null;
  source_text: string;
  unsure: boolean;
};

export type ExtractionProblem = "blurry" | "not_document" | "no_medicines";

export type Extraction = {
  document_ok: boolean;
  problem?: ExtractionProblem;
  medicines: ExtractedMedicine[];
  warning_signs: string[];
  follow_up: string | null;
};

export type ErrorCode = "blurry" | "not_document" | "no_medicines" | "busy" | "invalid" | "too_large";

export type ScheduleStatus = "direct" | "suggested" | "ask" | "as_needed";

export type ScheduleResult = {
  status: ScheduleStatus;
  slots: Slot[];
  slotQuantities?: Partial<Record<Slot, string>>;
  writtenTime?: string;
  durationAsWritten?: string;
  unsure: boolean;
  reason: string;
};

export type Field = { original: string | null; value: string | null };

export type ConfirmRow = {
  id: string;
  source_text: string;
  unsure: boolean;
  name: Field;
  dose: Field;
  frequency: Field;
  instructions: Field;
  duration_as_written: string | null;
  sheetStatus: ScheduleStatus; // status from the sheet's own text; Ask rows never leave Ask
  schedule: ScheduleResult; // recomputed when the frequency or instructions are edited
  originalSlots: Slot[]; // scheduler slots for the sheet's own text
  slots: Slot[]; // current chips
  confirmed: boolean; // required when schedule.status === "suggested"
};

export type ConfirmState = {
  rows: ConfirmRow[];
  warning_signs: string[];
  follow_up: string | null;
  compared: boolean;
};

export type FoodDisplay =
  | { kind: "chip"; chip: "before" | "after" | "with" }
  | { kind: "text"; text: string }
  | { kind: "none" };

// Free text from the document, sent to /api/telugu and checked by the translation guard.
export type TranslateItem = { id: string; text: string };
export type TranslatedItem = { id: string; te: string };
export type Translations = Record<string, string>;

export type SlotMarker = "suggested_confirmed" | "moved" | null;
export type FieldChange = { field: "name" | "dose" | "frequency" | "instructions" | "times"; original: string | null };

export type PlanFood =
  | { kind: "chip"; chip: "before" | "after" | "with" }
  | { kind: "text"; en: string; te: string }
  | { kind: "none" };

export type PlanRow = {
  id: string;
  name: string; // English as written (or as edited)
  dose: string | null; // null → "Not written on the sheet…"
  quantity?: string; // "2" for a 2-0-1 pattern, shown on that slot only
  food: PlanFood;
  frequencyAsWritten: string | null;
  durationAsWritten: string | null;
  writtenTime?: string;
  slotMarker: SlotMarker;
  fieldChanges: FieldChange[];
  reason?: string; // Ask rows only
};

export type Plan = {
  slots: { slot: Slot; rows: PlanRow[] }[]; // non-empty slots only, in day order
  asNeeded: PlanRow[];
  ask: PlanRow[];
  warnings: { kind: "fixed" } | { kind: "items"; items: { en: string; te: string }[] };
  followUp: { kind: "fixed" } | { kind: "text"; en: string; te: string };
  showSuggestedLegend: boolean;
  showMovedLegend: boolean;
};
