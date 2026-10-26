import type { ConfirmRow, Field, Slot } from "@/lib/types";
import SlotChips from "./SlotChips";
import { WarningIcon } from "./Icons";

type FieldName = "name" | "dose" | "frequency" | "instructions";
type Props = {
  row: ConfirmRow;
  index: number;
  onEdit: (field: FieldName, value: string) => void;
  onToggle: (slot: Slot) => void;
  onConfirm: () => void;
};

const LABELS: Record<FieldName, string> = { name: "Medicine", dose: "Dose", frequency: "How often", instructions: "Instructions" };

function Input({ id, label, field, onChange, large }: { id: string; label: string; field: Field; onChange: (v: string) => void; large?: boolean }) {
  const changed = (field.value ?? "") !== (field.original ?? "");
  return (
    <label className="block" htmlFor={id}>
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</span>
      <input id={id} value={field.value ?? ""} placeholder={field.original === null ? "Not written on the sheet" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 block min-h-12 w-full rounded-[var(--radius-input)] border-2 bg-card px-3 ${large ? "text-[1.375rem] font-semibold" : "text-base"} ${
          changed ? "border-turmeric" : "border-muted/25"}`} />
      {changed && <span className="mt-1 block text-sm text-muted">Sheet said: {field.original ?? "(blank)"}</span>}
    </label>
  );
}

export default function MedicineCard({ row, index, onEdit, onToggle, onConfirm }: Props) {
  const status = row.schedule.status;
  const hasChips = status === "direct" || status === "suggested";
  const ask = status === "ask";
  return (
    <article id={`card-${row.id}`} className="rise scroll-mt-4 scroll-mb-40 rounded-[var(--radius-card)] bg-card p-4 shadow-[var(--shadow-soft)]" style={{ "--i": index } as React.CSSProperties}>
      {row.unsure && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-bg px-3 py-1 text-sm font-semibold text-ink ring-1 ring-turmeric">
          <WarningIcon className="h-4 w-4" label="Unsure" /> Check this against the paper
        </p>
      )}
      <div className="space-y-3">
        <Input id={`${row.id}-name`} label={LABELS.name} field={row.name} onChange={(v) => onEdit("name", v)} large />
        <div className="grid grid-cols-2 gap-3">
          <Input id={`${row.id}-dose`} label={LABELS.dose} field={row.dose} onChange={(v) => onEdit("dose", v)} />
          <Input id={`${row.id}-freq`} label={LABELS.frequency} field={row.frequency} onChange={(v) => onEdit("frequency", v)} />
        </div>
        <Input id={`${row.id}-instr`} label={LABELS.instructions} field={row.instructions} onChange={(v) => onEdit("instructions", v)} />
      </div>
      {(row.duration_as_written || row.schedule.writtenTime) && (
        <p className="mt-3 text-sm text-muted">
          {row.duration_as_written && <>Duration: {row.duration_as_written}</>}
          {row.duration_as_written && row.schedule.writtenTime && " · "}
          {row.schedule.writtenTime && <>Time on the sheet: {row.schedule.writtenTime}</>}
        </p>
      )}
      {hasChips && <SlotChips row={row} onToggle={onToggle} onConfirm={onConfirm} />}
      {ask && (
        <div className="mt-4 rounded-[var(--radius-input)] bg-paper p-3 text-sm">
          <p className="font-semibold">{row.schedule.reason}</p>
          <p className="mt-1 text-muted">No time is given for this one. If this was misread, retake the photo.</p>
        </div>
      )}
      <p className="mt-4 border-t border-muted/15 pt-3 text-sm text-muted">
        <span className="font-semibold">From the paper:</span> {row.source_text}
      </p>
    </article>
  );
}
