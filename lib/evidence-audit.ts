import type { OptimizeResult } from "./schema";

/** 从文本中提取可能为「成果量化」的片段 */
const METRIC_PATTERN =
  /\d+(?:[.,]\d+)?(?:%|％|万|倍|x|X|min|小时|分钟|天|周|月|年|W|w|\+|人|次|条|篇|家|个)?/g;

function normalizeDigits(value: string): string {
  return value.replace(/[,，\s]/g, "").toLowerCase();
}

export function extractMetricSnippets(text: string): string[] {
  const matches = text.match(METRIC_PATTERN) ?? [];
  return [...new Set(matches.map((m) => m.trim()).filter((m) => m.length >= 2))];
}

function metricExistsInSource(metric: string, source: string): boolean {
  const core = metric.replace(/[%％万倍xXmin小时分钟天周月年Ww\+人次条篇家个]/gi, "");
  if (!core || !/\d/.test(core)) return true;
  const normalizedCore = normalizeDigits(core);
  const normalizedSource = normalizeDigits(source);
  return normalizedSource.includes(normalizedCore);
}

export type EvidenceAudit = {
  fabricatedMetrics: string[];
  hasFabricationRisk: boolean;
  message: string;
  /** 是否因捏造风险触发过自动重试 */
  retried?: boolean;
  /** 重试后是否消除了捏造风险（或明显减轻） */
  retryImproved?: boolean;
  /** 是否经过确定性清洗（无依据数字→占位、缺口泄漏行移除） */
  sanitized?: boolean;
  sanitizedCount?: number;
};

export function fabricationSeverity(audit: EvidenceAudit): number {
  return audit.fabricatedMetrics.length + (audit.hasFabricationRisk ? 10 : 0);
}

export function buildFabricationCorrectionPrompt(
  baseUserPrompt: string,
  audit: EvidenceAudit,
): string {
  const metricLines =
    audit.fabricatedMetrics.length > 0
      ? audit.fabricatedMetrics.map((m) => `- ${m}`).join("\n")
      : "（无单独列出的数字，但存在缺口泄漏或夸大）";

  return `${baseUserPrompt}

【系统自动复检：上次改写存在捏造/夸大风险，必须修正后重新输出完整 JSON】
问题摘要：${audit.message}

无依据或可疑量化示例：
${metricLines}

修正要求（必须全部遵守）：
1. 删除或改写所有无法在原文找到的数字化表述；改为 [待补充：具体指标] 或直接删掉该成果句
2. matchReport.gapDetails 标为「不能写」的条目，不得出现在 sections.rewritten 的正向声称中
3. 不得新增公司、项目、工具栈、职务；只重组原文已有信息
4. 仍输出完整 JSON（jdAnalysis、matchReport、sections、disclaimer），结构与字段不变`;
}

export function buildRewriteFabricationCorrectionPrompt(
  baseRewriteUserPrompt: string,
  audit: EvidenceAudit,
): string {
  const metricLines =
    audit.fabricatedMetrics.length > 0
      ? audit.fabricatedMetrics.map((m) => `- ${m}`).join("\n")
      : "（存在缺口泄漏或夸大）";

  return `${baseRewriteUserPrompt}

【改写复检：上次 sections 存在捏造风险，仅重新输出 sections + disclaimer JSON】
问题：${audit.message}

可疑内容：
${metricLines}

修正要求：
1. 删除或改写无依据数字为 [待补充：具体指标]
2. 「不能写」缺口不得出现在 rewritten
3. 不得新增公司/项目/工具；只重组 original
4. 输出 JSON：{ "sections": [...], "disclaimer": "..." }`;
}

export function auditOptimizeEvidence(
  resume: string,
  result: OptimizeResult,
): EvidenceAudit {
  const sourceText = [
    resume,
    ...result.sections.map((s) => s.original),
  ].join("\n");

  const rewrittenText = result.sections.map((s) => s.rewritten).join("\n");
  const rewrittenMetrics = extractMetricSnippets(rewrittenText);

  const fabricatedMetrics = rewrittenMetrics.filter(
    (metric) =>
      !metric.includes("待补充") &&
      !metricExistsInSource(metric, sourceText),
  );

  const forbiddenGaps = (result.matchReport.gapDetails ?? []).filter(
    (g) => g.evidenceBoundary === "不能写",
  );

  const gapLeakCount = forbiddenGaps.filter((gap) => {
    const keyword = gap.content.slice(0, Math.min(8, gap.content.length));
    return keyword.length >= 4 && rewrittenText.includes(keyword);
  }).length;

  const hasFabricationRisk =
    fabricatedMetrics.length > 0 || gapLeakCount > 0;

  const parts: string[] = [];
  if (fabricatedMetrics.length > 0) {
    parts.push(
      `改写中 ${fabricatedMetrics.length} 处量化数据无法在原文中找到依据`,
    );
  }
  if (gapLeakCount > 0) {
    parts.push(`${gapLeakCount} 处标注「不能写」的缺口仍出现在改写中`);
  }

  return {
    fabricatedMetrics: fabricatedMetrics.slice(0, 12),
    hasFabricationRisk,
    message: hasFabricationRisk
      ? parts.join("；") + "。请核对后再使用，或重新生成。"
      : "未发现明显捏造数字；仍请逐条核对改写内容。",
  };
}
