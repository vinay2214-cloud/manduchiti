import type { Plan } from "@/lib/types";
import { WarningIcon } from "./Icons";
import T, { Bi } from "./T";

export default function WarningPanel({ warnings }: { warnings: Plan["warnings"] }) {
  return (
    <section className="rounded-[var(--radius-card)] border-2 border-warn bg-warn-bg p-4" aria-labelledby="warn-h">
      <h2 id="warn-h" className="section-h flex items-start gap-2 leading-snug font-bold text-warn">
        <WarningIcon className="mt-1 h-7 w-7 shrink-0" label="Warning" /> <span><T k="warningHeading" /></span>
      </h2>
      {warnings.kind === "fixed" ? (
        <p className="te-body mt-3"><T k="noWarnings" /></p>
      ) : (
        <ul className="mt-3 space-y-3">
          {warnings.items.map((w) => (
            <li key={w.en} className="te-body border-l-4 border-warn pl-3">
              <Bi te={w.te} en={w.en} />
              <span lang="en" data-swap="te" className="block text-sm text-muted">{w.en}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
