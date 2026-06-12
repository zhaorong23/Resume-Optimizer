import type { EvidenceBoundary } from "@/lib/evidence-boundary";

export const MATCH_LEVEL_LABELS = {
  strong: "✅强",
  medium: "⚠️中",
  weak: "❌弱",
  unknown: "—",
} as const;

export function formatMatchLevel(
  level: keyof typeof MATCH_LEVEL_LABELS,
): string {
  return MATCH_LEVEL_LABELS[level];
}

export function formatEvidenceBoundary(boundary: EvidenceBoundary): string {
  return boundary;
}
