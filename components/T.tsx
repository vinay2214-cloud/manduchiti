import { plan, type PlanKey } from "@/lib/strings";

// Both languages are always in the DOM; the plan's data-lang decides which one shows.
export function Bi({ te, en, className }: { te: string; en: string; className?: string }) {
  return (
    <>
      <span lang="te" data-swap="te" className={className}>{te}</span>
      <span lang="en" data-swap="en" className={className}>{en}</span>
    </>
  );
}

export default function T({ k, className }: { k: PlanKey; className?: string }) {
  return <Bi te={plan[k].te} en={plan[k].en} className={className} />;
}
