"use client";

import { useState } from "react";
import type { Lang } from "@/lib/strings";
import type { Plan } from "@/lib/types";
import LanguageToggle from "./LanguageToggle";
import TextSizeToggle from "./TextSizeToggle";
import SlotCard from "./SlotCard";
import WarningPanel from "./WarningPanel";
import PlanRowView from "./PlanRowView";
import T, { Bi } from "./T";

type Props = { plan: Plan; onBack: () => void; onStartOver: () => void };

export default function PlanScreen({ plan, onBack, onStartOver }: Props) {
  const [lang, setLang] = useState<Lang>("te");
  const date = new Date();
  const fmt = (l: string) => new Intl.DateTimeFormat(l, { day: "numeric", month: "long", year: "numeric" }).format(date);
  let i = 0;

  return (
    <div data-lang={lang} lang={lang} className="flex min-h-dvh flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 text-sm">
        <button type="button" onClick={onBack} className="min-h-12 font-semibold text-muted underline underline-offset-4">Back to checking</button>
        <button type="button" onClick={onStartOver} className="min-h-12 font-semibold text-muted underline underline-offset-4">Start over</button>
      </div>
      <header className="px-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TextSizeToggle />
          <LanguageToggle lang={lang} onChange={setLang} />
        </div>
        <h1 className="page-title mt-4 leading-tight font-bold"><T k="title" /></h1>
        <p className="mt-1 text-muted"><Bi te={fmt("te-IN")} en={fmt("en-IN")} /></p>
      </header>

      <main className="flex-1 space-y-5 px-4 pt-5 pb-8">
        {plan.slots.map((s) => <SlotCard key={s.slot} slot={s.slot} rows={s.rows} index={i++} />)}

        {plan.asNeeded.length > 0 && (
          <section className="rounded-[var(--radius-card)] bg-card p-4 shadow-[var(--shadow-soft)]">
            <h2 className="section-h font-bold"><T k="onlyIfNeeded" /></h2>
            <ul className="mt-3 divide-y divide-muted/15">{plan.asNeeded.map((r) => <PlanRowView key={r.id} row={r} />)}</ul>
          </section>
        )}

        {plan.ask.length > 0 && (
          <section className="rounded-[var(--radius-card)] border-2 border-dashed border-muted/40 bg-card p-4">
            <h2 className="section-h leading-snug font-bold"><T k="askHeading" /></h2>
            <p className="te-body mt-1 text-muted"><T k="askHint" /></p>
            <ul className="mt-3 divide-y divide-muted/15">{plan.ask.map((r) => <PlanRowView key={r.id} row={r} />)}</ul>
          </section>
        )}

        <WarningPanel warnings={plan.warnings} />

        <section className="rounded-[var(--radius-card)] bg-card p-4 shadow-[var(--shadow-soft)]">
          <h2 className="section-h font-bold"><T k="followUpHeading" /></h2>
          {plan.followUp.kind === "fixed" ? (
            <p className="te-body mt-2"><T k="noFollowUp" /></p>
          ) : (
            <p className="te-body mt-2">
              <Bi te={plan.followUp.te} en={plan.followUp.en} />
              <span lang="en" data-swap="te" className="block text-sm text-muted">{plan.followUp.en}</span>
            </p>
          )}
        </section>

        {(plan.showSuggestedLegend || plan.showMovedLegend) && (
          <section className="space-y-2 text-base">
            {plan.showSuggestedLegend && <p><span aria-hidden>✱ </span><T k="legendChosen" /></p>}
            {plan.showMovedLegend && <p><span aria-hidden>✱ </span><T k="legendMoved" /></p>}
          </section>
        )}
      </main>

      <footer className="sticky bottom-0 border-t-2 border-turmeric bg-amber-bg px-4 py-3 text-center font-semibold">
        <T k="footer" />
      </footer>
    </div>
  );
}
