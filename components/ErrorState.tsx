import { ERRORS } from "@/lib/errors";
import { en } from "@/lib/strings";
import type { ErrorCode } from "@/lib/types";
import { WarningIcon } from "./Icons";

type Props = { code: ErrorCode; onRetry: (() => void) | null; onRetake: () => void; onStartOver: () => void; onBack?: () => void };

export default function ErrorState({ code, onRetry, onRetake, onStartOver, onBack }: Props) {
  const e = ERRORS[code];
  const primary = e.action === "reuse" && onRetry ? { label: en.tryAgain, run: onRetry } : { label: en.takeAnother, run: onRetake };
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 px-4 pt-12" role="alert">
        <WarningIcon className="h-10 w-10 text-turmeric" />
        <h1 className="mt-4 text-[1.5rem] leading-tight font-bold">{e.title}</h1>
        {e.tip && <p className="mt-3 text-muted">{e.tip}</p>}
      </main>
      <div className="sticky bottom-0 space-y-2 bg-paper px-4 pt-3 pb-5">
        <button type="button" onClick={primary.run} className="min-h-14 w-full rounded-full bg-turmeric text-lg font-semibold text-ink">
          {primary.label}
        </button>
        {onBack && (
          <button type="button" onClick={onBack} className="min-h-12 w-full rounded-full border-2 border-ink font-semibold">{en.backToCheck}</button>
        )}
        <button type="button" onClick={onStartOver} className="min-h-12 w-full text-sm font-semibold text-muted underline underline-offset-4">
          {en.startOver}
        </button>
      </div>
    </div>
  );
}
