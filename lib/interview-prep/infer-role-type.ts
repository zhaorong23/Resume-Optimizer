export type OptimizeRoleType = "pm" | "ops";
export type PmFlavor = "general" | "growth";

const OPS_KEYWORDS = [
  "产品运营",
  "用户运营",
  "活动运营",
  "内容运营",
  "社群运营",
  "商业化运营",
  "活动策划",
  "用户分层",
  "促活",
  "渗透",
  "roi",
  "活动复盘",
  "运营策略",
];

const PM_KEYWORDS = [
  "产品经理",
  "prd",
  "需求分析",
  "需求文档",
  "功能设计",
  "功能规划",
  "版本迭代",
  "0-1",
  "0到1",
  "从0到1",
  "竞品分析",
  "用户研究",
  "产品规划",
];

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

function countKeywordHits(text: string, keywords: string[]): number {
  return keywords.reduce(
    (count, keyword) => (text.includes(keyword) ? count + 1 : count),
    0,
  );
}

/** 从 JD / 岗位名推断简历优化赛道（pm vs ops） */
export function inferRoleTypeFromJd(
  jd?: string,
  roleTitle?: string,
): OptimizeRoleType {
  const text = `${roleTitle ?? ""} ${jd ?? ""}`.toLowerCase();
  let opsScore = countKeywordHits(text, OPS_KEYWORDS);
  let pmScore = countKeywordHits(text, PM_KEYWORDS);

  if (text.includes("产品运营")) opsScore += 2;
  if (text.includes("产品经理")) pmScore += 2;
  if (text.includes("运营实习") || text.includes("运营专员")) opsScore += 1;
  if (text.includes("产品实习") && !text.includes("运营")) pmScore += 1;

  return opsScore > pmScore ? "ops" : "pm";
}

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
