import type { ConfirmRow, Slot } from "@/lib/types";
import { SLOT_ORDER } from "@/lib/scheduler";
import { CheckIcon, CloudSunIcon, MoonIcon, SunIcon, SunsetIcon } from "./Icons";

export const SLOT_META: Record<Slot, { en: string; color: string; Icon: typeof SunIcon }> = {
  morning: { en: "Morning", color: "var(--color-morning)", Icon: SunIcon },
  afternoon: { en: "Afternoon", color: "var(--color-afternoon)", Icon: CloudSunIcon },
  evening: { en: "Evening", color: "var(--color-evening)", Icon: SunsetIcon },
  night: { en: "Night", color: "var(--color-night)", Icon: MoonIcon },
};

type Props = { row: ConfirmRow; onToggle: (slot: Slot) => void; onConfirm: () => void };

export default function SlotChips({ row, onToggle, onConfirm }: Props) {
  const suggested = row.schedule.status === "suggested";
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="When to take it">
        {SLOT_ORDER.map((slot) => {
          const { en, color, Icon } = SLOT_META[slot];
          const on = row.slots.includes(slot);
          const qty = row.schedule.slotQuantities?.[slot];
          return (
            <button key={slot} type="button" aria-pressed={on} onClick={() => onToggle(slot)}
              className={`flex min-h-12 items-center gap-1.5 rounded-full border-2 px-3 text-sm font-semibold ${on ? "text-ink" : "border-muted/30 text-muted"}`}
              style={on ? { borderColor: color, background: `color-mix(in srgb, ${color} 18%, white)` } : undefined}>
              <span style={{ color: on ? color : undefined }}><Icon className="h-5 w-5" /></span>
              {en}{qty ? `: ${qty}` : ""}
            </button>
          );
        })}
      </div>
      {suggested && (
        <button type="button" onClick={onConfirm} disabled={row.confirmed} aria-pressed={row.confirmed}
          className={`mt-3 flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink ${
            row.confirmed ? "bg-card ring-2 ring-ink" : "bg-amber-bg ring-2 ring-turmeric"}`}>
          {row.confirmed ? (<><CheckIcon className="h-5 w-5" label="Confirmed" /> Times confirmed by you</>) : "Suggested, please confirm"}
        </button>
      )}
    </div>
  );
}
