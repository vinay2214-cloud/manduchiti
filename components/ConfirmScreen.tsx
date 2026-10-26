"use client";

import { canMakePlan } from "@/lib/plan";
import { confirmRow, editField, setCompared, toggleSlot } from "@/lib/confirm";
import type { ConfirmState } from "@/lib/types";
import MedicineCard from "./MedicineCard";

type Props = { state: ConfirmState; onChange: (s: ConfirmState) => void; onMakePlan: () => void; onStartOver: () => void };

export default function ConfirmScreen({ state, onChange, onMakePlan, onStartOver }: Props) {
  const groups = [
    { key: "timed", title: null, hint: null, rows: state.rows.filter((r) => r.schedule.status === "direct" || r.schedule.status === "suggested") },
    { key: "as_needed", title: "Only if needed", hint: "Taken only when the sheet's reason applies.", rows: state.rows.filter((r) => r.schedule.status === "as_needed") },
    { key: "ask", title: "Ask your doctor or pharmacist", hint: "The sheet doesn't give a clear time for these, so they get no time on the plan.", rows: state.rows.filter((r) => r.schedule.status === "ask") },
  ];
  const pending = state.rows.filter((r) => r.schedule.status === "suggested" && !r.confirmed).length;
  const ready = canMakePlan(state);
  let i = 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 px-4 pt-6 pb-6">
        <button type="button" onClick={onStartOver} className="min-h-12 text-sm font-semibold text-muted underline underline-offset-4">Start over</button>
        <h1 className="mt-2 text-[1.625rem] leading-tight font-bold">Check with the paper</h1>
        <p className="mt-3 rounded-[var(--radius-input)] bg-amber-bg p-3 font-semibold ring-1 ring-turmeric">
          Compare this with the paper before continuing.
        </p>

        {groups.map((g) => g.rows.length > 0 && (
          <section key={g.key} className="mt-6" aria-label={g.title ?? "Medicines"}>
            {g.title && <h2 className="text-xl font-bold">{g.title}</h2>}
            {g.hint && <p className="mt-1 mb-3 text-sm text-muted">{g.hint}</p>}
            <div className="space-y-4">
              {g.rows.map((row) => (
                <MedicineCard key={row.id} row={row} index={i++}
                  onEdit={(field, v) => onChange(editField(state, row.id, field, v))}
                  onToggle={(slot) => onChange(toggleSlot(state, row.id, slot))}
                  onConfirm={() => onChange(confirmRow(state, row.id))} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <div className="sticky bottom-0 space-y-3 border-t border-muted/15 bg-paper px-4 pt-3 pb-5">
        <label className="flex min-h-12 items-center gap-3 font-semibold">
          <input type="checkbox" checked={state.compared} onChange={(e) => onChange(setCompared(state, e.target.checked))}
            className="h-6 w-6 accent-[var(--color-ink)]" />
          I compared this with the paper
        </label>
        <button type="button" disabled={!ready} onClick={onMakePlan}
          className="min-h-14 w-full rounded-full bg-turmeric text-lg font-semibold text-ink disabled:bg-muted/20 disabled:text-muted">
          Looks right, make the plan
        </button>
        {!ready && (
          <p className="text-center text-sm text-muted" aria-live="polite">
            {pending > 0 ? `Confirm the suggested times on ${pending} medicine${pending > 1 ? "s" : ""}` : "Tick the box after comparing with the paper"}
          </p>
        )}
      </div>
    </div>
  );
}
