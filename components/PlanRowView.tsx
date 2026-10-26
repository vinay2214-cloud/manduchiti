import { plan as S } from "@/lib/strings";
import type { PlanRow, Slot } from "@/lib/types";
import T, { Bi } from "./T";

const SLOT_KEYS: Record<string, Slot> = { Morning: "morning", Afternoon: "afternoon", Evening: "evening", Night: "night" };
const CHIP_KEY = { before: "chipBefore", after: "chipAfter", with: "chipWith" } as const;

// "Morning, Night" (what the sheet's times were) shown in the reader's language.
function timesOriginal(original: string | null) {
  const slots = (original ?? "").split(", ").map((s) => SLOT_KEYS[s]).filter(Boolean);
  return <Bi te={slots.map((s) => S[s].te).join(", ")} en={slots.map((s) => S[s].en).join(", ")} />;
}

export default function PlanRowView({ row, slot }: { row: PlanRow; slot?: Slot }) {
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <p lang="en" className="med-name font-semibold">{row.name}</p>
      <p className="te-body mt-0.5">
        {row.dose ? <span lang="en" className="font-semibold">{row.dose}</span> : <span className="text-warn"><T k="missingDose" /></span>}
        {row.quantity && slot && (
          <span className="ml-2 rounded-full bg-paper px-2 py-0.5 text-base font-semibold">
            <T k={slot} />: {row.quantity}
          </span>
        )}
      </p>

      {row.food.kind === "chip" && (
        <p className="mt-2">
          <span className="te-body inline-block rounded-full bg-paper px-3 py-1 font-semibold ring-1 ring-ink/20"><T k={CHIP_KEY[row.food.chip]} /></span>
        </p>
      )}
      {row.food.kind === "text" && (
        <p className="mt-2">
          <span className="te-body block"><Bi te={row.food.te} en={row.food.en} /></span>
          <span lang="en" data-swap="te" className="block text-sm text-muted">{row.food.en}</span>
        </p>
      )}

      <p className="mt-2 text-sm text-muted">
        <T k="asWritten" /> <span lang="en">{[row.frequencyAsWritten, row.durationAsWritten].filter(Boolean).join(" ") || "—"}</span>
        {row.writtenTime && (<> · <T k="timeOnSheet" /> <span lang="en">{row.writtenTime}</span></>)}
      </p>

      {row.slotMarker && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-bg px-3 py-1 text-sm font-semibold ring-1 ring-turmeric">
          <span aria-hidden>✱</span> <T k={row.slotMarker === "moved" ? "markerMoved" : "markerChosen"} />
        </p>
      )}
      {row.fieldChanges.map((c) => (
        <p key={c.field} className="mt-2 rounded-[var(--radius-input)] bg-amber-bg px-3 py-2 text-sm">
          <span className="font-semibold"><T k={c.field === "times" ? "markerMoved" : "changedByFamily"} /></span>
          <span className="block text-muted">
            <T k="sheetSaid" />{" "}
            {c.field === "times" ? timesOriginal(c.original) : <span lang="en">{c.original ?? "—"}</span>}
          </span>
        </p>
      ))}
    </li>
  );
}
