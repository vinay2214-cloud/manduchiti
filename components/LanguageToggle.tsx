import type { Lang } from "@/lib/strings";

export default function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex rounded-full bg-card p-1 shadow-[var(--shadow-soft)]" role="group" aria-label="Language">
      {(["te", "en"] as Lang[]).map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => onChange(l)}
          className={`min-h-11 min-w-12 rounded-full px-3 text-sm font-semibold ${lang === l ? "bg-ink text-paper" : "text-ink"}`}>
          {l === "te" ? "తెలుగు" : "English"}
        </button>
      ))}
    </div>
  );
}
