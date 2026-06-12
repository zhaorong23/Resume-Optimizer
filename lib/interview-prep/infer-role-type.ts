export type PmFlavor = "general" | "growth";

const GROWTH_KEYWORDS = [
  "增长",
  "用增",
  "留存",
  "aarrr",
  "拉新",
  "促活",
  "获客",
  "cac",
  "dau",
  "mau",
];

export function inferPmFlavor(jd?: string, roleTitle?: string): PmFlavor {
  const text = `${roleTitle ?? ""} ${jd ?? ""}`.toLowerCase();
  return GROWTH_KEYWORDS.some((keyword) => text.includes(keyword))
    ? "growth"
    : "general";
}

export function getPmFlavorLabel(flavor: PmFlavor): string | null {
  return flavor === "growth" ? "增长向" : null;
}

export function getRoleTrackLabel(
  roleType: "pm" | "ops",
  pmFlavor?: PmFlavor,
): string {
  if (roleType === "ops") return "产品运营";
  const suffix = getPmFlavorLabel(pmFlavor ?? "general");
  return suffix ? `产品经理 · ${suffix}` : "产品经理";
}
