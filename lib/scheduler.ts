import type { ScheduleResult, Slot } from "./types";

// Plain code, no AI. Reads the frequency and instructions exactly as written and never guesses:
// anything it can't place with certainty goes to "ask".

export const SLOT_ORDER: Slot[] = ["morning", "afternoon", "evening", "night"];

const DURATION = /\s*(x|×|for)\s*\d+\s*(day|days|week|weeks|month|months)\b.*$/i;
const AS_NEEDED = /\b(sos|prn)\b|\b(if|as|when) needed\b/i;
const PATTERN_SHAPE = /^[^\s-]+(\s*-\s*[^\s-]+)+$/;
const PATTERN_VALUE = /^([0-9]+|½|half)$/i;

const COUNTS: [RegExp, number][] = [
  [/^(od|once daily|once a day)$/i, 1],
  [/^(bd|bid|twice daily|twice a day)$/i, 2],
  [/^(tds|tid|thrice daily|three times a day)$/i, 3],
  [/^(qid|four times a day)$/i, 4],
];
const DEFAULTS: Record<number, Slot[]> = {
  1: ["morning"],
  2: ["morning", "night"],
  3: ["morning", "afternoon", "night"],
  4: ["morning", "afternoon", "evening", "night"],
};

const WORD_SLOTS: [RegExp, Slot][] = [
  [/\bmorning\b/i, "morning"],
  [/\bafternoon\b/i, "afternoon"],
  [/\bevening\b/i, "evening"],
  [/\bnight\b/i, "night"],
  [/\b(at )?bed ?time\b/i, "night"],
  [/\bhs\b/i, "night"],
  [/\bbreakfast\b/i, "morning"],
  [/\blunch\b/i, "afternoon"],
  [/\bdinner\b/i, "night"],
];
const CLOCK_12 = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi;
const CLOCK_24 = /\b(\d{1,2}):(\d{2})\b(?!\s*(am|pm))/gi;

// Words a cut-off token might be the start of. Tokens that are themselves real words are excluded.
const TIME_WORDS = ["morning", "afternoon", "evening", "night", "bedtime", "breakfast", "lunch", "dinner"];
const REAL_WORDS = new Set(["after", "even", "bed", "din", "nig"]);

function clockSlot(minutes: number): Slot {
  if (minutes >= 5 * 60 && minutes < 11 * 60) return "morning";
  if (minutes >= 11 * 60 && minutes < 16 * 60) return "afternoon";
  if (minutes >= 16 * 60 && minutes < 20 * 60) return "evening";
  return "night";
}

type Named = { slots: Set<Slot>; written: string[] };

function namedSlots(text: string): Named {
  const slots = new Set<Slot>();
  const written: string[] = [];
  for (const [re, slot] of WORD_SLOTS) {
    const m = text.match(re);
    if (m) {
      slots.add(slot);
      written.push(m[0]);
    }
  }
  for (const m of text.matchAll(CLOCK_12)) {
    const h = Number(m[1]) % 12 + (m[3].toLowerCase() === "pm" ? 12 : 0);
    if (Number(m[1]) <= 12) {
      slots.add(clockSlot(h * 60 + Number(m[2] ?? 0)));
      written.push(m[0]);
    }
  }
  for (const m of text.matchAll(CLOCK_24)) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 24 && min < 60) {
      slots.add(clockSlot(h * 60 + min));
      written.push(m[0]);
    }
  }
  return { slots, written };
}

function hasPartialTimeWord(text: string): boolean {
  return (text.toLowerCase().match(/[a-z]+/g) ?? []).some(
    (tok) => tok.length >= 3 && !REAL_WORDS.has(tok) && TIME_WORDS.some((w) => w !== tok && w.startsWith(tok)),
  );
}

type Pattern = { ok: true; slots: Slot[]; quantities: Partial<Record<Slot, string>> } | { ok: false };

function digitPattern(freq: string): Pattern | null {
  if (!PATTERN_SHAPE.test(freq)) return null;
  const parts = freq.split("-").map((p) => p.trim());
  if (parts.length !== 3 && parts.length !== 4) return { ok: false };
  if (!parts.every((p) => PATTERN_VALUE.test(p))) return { ok: false };
  const positions: Slot[] = parts.length === 3 ? ["morning", "afternoon", "night"] : SLOT_ORDER;
  const slots: Slot[] = [];
  const quantities: Partial<Record<Slot, string>> = {};
  parts.forEach((p, i) => {
    if (/^0+$/.test(p)) return;
    slots.push(positions[i]);
    if (p !== "1") quantities[positions[i]] = p.toLowerCase() === "half" ? "½" : p;
  });
  if (slots.length === 0) return { ok: false };
  return { ok: true, slots, quantities };
}

const ordered = (s: Set<Slot>) => SLOT_ORDER.filter((x) => s.has(x));
const sameSet = (a: Slot[], b: Set<Slot>) => a.length === b.size && a.every((x) => b.has(x));

export function schedule(frequency: string | null, instructions: string | null): ScheduleResult {
  const rawFreq = (frequency ?? "").trim();
  const instr = (instructions ?? "").trim();

  const duration = rawFreq.match(DURATION);
  const freq = duration ? rawFreq.slice(0, duration.index).trim() : rawFreq;
  const base = duration ? { durationAsWritten: duration[0].trim() } : {};

  const unsure = hasPartialTimeWord(`${freq} ${instr}`);
  const result = (r: Omit<ScheduleResult, "unsure">): ScheduleResult => ({ ...base, ...r, unsure });
  const ask = (reason: string) => result({ status: "ask", slots: [], reason });

  if (AS_NEEDED.test(freq)) return result({ status: "as_needed", slots: [], reason: "Only if needed" });
  if (!freq) return ask("No frequency written on the sheet");

  const fromFreq = namedSlots(freq);
  const fromInstr = namedSlots(instr);
  const named = new Set([...fromFreq.slots, ...fromInstr.slots]);
  const writtenTime = [...fromFreq.written, ...fromInstr.written].join(", ") || undefined;

  const pattern = digitPattern(freq);
  if (pattern) {
    if (!pattern.ok) return ask("The pattern on the sheet couldn't be read");
    const quantities = Object.keys(pattern.quantities).length ? { slotQuantities: pattern.quantities } : {};
    if (named.size === 0) return result({ status: "direct", slots: pattern.slots, ...quantities, reason: "Pattern on the sheet" });
    if (sameSet(pattern.slots, named))
      return result({ status: "direct", slots: pattern.slots, ...quantities, writtenTime, reason: "Pattern on the sheet" });
    return ask("Pattern and times on the sheet don't match");
  }

  const count = COUNTS.find(([re]) => re.test(freq))?.[1];
  if (count) {
    if (named.size === 0) return result({ status: "suggested", slots: DEFAULTS[count], reason: "The sheet only says how many times" });
    if (named.size === count) return result({ status: "direct", slots: ordered(named), writtenTime, reason: "Times on the sheet" });
    return ask("Count and times on the sheet don't match");
  }

  // The frequency itself names the time ("At bedtime", "8 PM", "HS").
  // Only when the frequency is nothing but times and filler; "As directed in the morning" is not.
  if (fromFreq.slots.size > 0) {
    let leftover = freq;
    for (const w of fromFreq.written) leftover = leftover.replace(w, " ");
    leftover = leftover.replace(/\b(and|daily|every|in the|at)\b|[,&/+]/gi, " ").trim();
    if (leftover === "") {
      if (!sameSet(ordered(named), fromFreq.slots)) return ask("Times on the sheet don't match");
      return result({ status: "direct", slots: ordered(named), writtenTime, reason: "Times on the sheet" });
    }
  }

  return ask("No clear timing on the sheet");
}
