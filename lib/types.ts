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
