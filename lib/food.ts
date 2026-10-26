import type { FoodDisplay } from "./types";

// A chip only for these exact meanings. Anything else is shown as written, never rounded to a chip.
const CHIPS: Record<string, "before" | "after" | "with"> = {
  "before food": "before",
  "before meals": "before",
  "a/c": "before",
  "after food": "after",
  "after meals": "after",
  "p/c": "after",
  "with food": "with",
  "with meals": "with",
};

export function foodDisplay(instructions: string | null): FoodDisplay {
  const text = (instructions ?? "").trim();
  if (!text) return { kind: "none" };
  const key = text.toLowerCase().replace(/\s+/g, " ").replace(/[.;]+$/, "");
  const chip = CHIPS[key];
  return chip ? { kind: "chip", chip } : { kind: "text", text };
}
