import { shareText, whatsappUrl } from "@/lib/share";
import type { Lang } from "@/lib/strings";
import type { Plan } from "@/lib/types";
import T from "./T";

export default function ShareBar({ plan, lang }: { plan: Plan; lang: Lang }) {
  return (
    <div data-print-hide className="grid grid-cols-2 gap-3">
      <a href={whatsappUrl(shareText(plan, lang))} target="_blank" rel="noopener noreferrer"
        className="flex min-h-12 items-center justify-center rounded-full border-2 border-ink px-3 text-center font-semibold">
        <T k="shareWhatsApp" />
      </a>
      <button type="button" onClick={() => window.print()}
        className="flex min-h-12 items-center justify-center rounded-full border-2 border-ink px-3 font-semibold">
        <T k="print" />
      </button>
    </div>
  );
}
