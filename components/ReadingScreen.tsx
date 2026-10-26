import { CheckIcon } from "./Icons";

// done = how many steps have finished; the next one is in progress.
export default function ReadingScreen({ steps, done }: { steps: string[]; done: number }) {
  return (
    <main className="px-4 pt-10" aria-live="polite">
      <ol className="space-y-4">
        {steps.map((label, i) => {
          const state = i < done ? "done" : i === done ? "active" : "waiting";
          return (
            <li key={label} className="flex items-center gap-3 text-lg">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                state === "done" ? "border-ink bg-ink text-paper" : state === "active" ? "border-turmeric" : "border-muted/40"}`}>
                {state === "done" ? <CheckIcon className="h-5 w-5" label="Done" /> : null}
              </span>
              <span className={state === "waiting" ? "text-muted" : "font-semibold"}>{label}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-10 space-y-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[var(--radius-card)] bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="skeleton h-5 w-2/3 rounded" />
            <div className="skeleton mt-3 h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
