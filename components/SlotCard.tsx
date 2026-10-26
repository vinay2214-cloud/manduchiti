import type { PlanRow, Slot } from "@/lib/types";
import { plan as S } from "@/lib/strings";
import { SLOT_META } from "./SlotChips";
import PlanRowView from "./PlanRowView";

export default function SlotCard({ slot, rows, index }: { slot: Slot; rows: PlanRow[]; index: number }) {
  const { color, Icon } = SLOT_META[slot];
  return (
    <section className="rise overflow-hidden rounded-[var(--radius-card)] bg-card shadow-[var(--shadow-soft)]" style={{ "--i": index } as React.CSSProperties}>
      {/* Ink text on a tinted header keeps contrast above 4.5:1; the colour is never the only cue. */}
      <h2 className="flex items-center gap-3 px-4 py-3" style={{ background: `color-mix(in srgb, ${color} 22%, white)`, borderTop: `6px solid ${color}` }}>
        <Icon className="h-8 w-8 text-ink" label={S[slot].en} />
        <span lang="te" className="section-h font-bold">{S[slot].te}</span>
        <span lang="en" className="text-base font-semibold">{S[slot].en}</span>
      </h2>
      <ul className="divide-y divide-muted/15 px-4 py-4">
        {rows.map((r) => <PlanRowView key={r.id} row={r} slot={slot} />)}
      </ul>
    </section>
  );
}
