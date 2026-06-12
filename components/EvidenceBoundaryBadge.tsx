import type { EvidenceBoundary } from "@/lib/evidence-boundary";
import { cn } from "@/lib/utils";

const STYLES: Record<EvidenceBoundary, string> = {
  可以写: "border-primary-border bg-primary-soft text-primary-muted",
  谨慎写: "border-amber-200 bg-amber-50 text-amber-800",
  不能写: "border-rose-200 bg-rose-50 text-rose-700",
};

export function EvidenceBoundaryBadge({
  boundary,
}: {
  boundary: EvidenceBoundary;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        STYLES[boundary],
      )}
    >
      {boundary}
    </span>
  );
}
