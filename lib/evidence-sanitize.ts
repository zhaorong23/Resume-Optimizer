import {
  auditOptimizeEvidence,
  extractMetricSnippets,
  type EvidenceAudit,
} from "./evidence-audit";
import type { OptimizeResult } from "./schema";

const METRIC_PLACEHOLDER = "[待补充：具体指标]";

function normalizeDigits(value: string): string {
  return value.replace(/[,，\s]/g, "").toLowerCase();
}

function metricExistsInSource(metric: string, source: string): boolean {
  const core = metric.replace(/[%％万倍xXmin小时分钟天周月年Ww\+人次条篇家个]/gi, "");
  if (!core || !/\d/.test(core)) return true;
  return normalizeDigits(source).includes(normalizeDigits(core));
}

/** 注入 user prompt 的数字白名单块（不改 system prompt） */
export function buildMetricWhitelistBlock(resume: string): string {
  const metrics = extractMetricSnippets(resume).filter((m) => m.length >= 2);
  if (metrics.length === 0) {
    return `## 原文允许使用的数字（白名单）
（原文未发现可量化数字；sections.rewritten **禁止新增**任何具体数字，请用 ${METRIC_PLACEHOLDER}）`;
  }

  const max = 40;
  const listed = metrics
    .slice(0, max)
    .map((m) => `- ${m}`)
    .join("\n");
  const tail =
    metrics.length > max
      ? `\n（另有 ${metrics.length - max} 项，仍以全文简历为准）`
      : "";

  return `## 原文允许使用的数字（白名单）
sections.rewritten 中出现的每个数字必须与本列表或上文简历全文一致；不在白名单内的数字禁止写入，请用 ${METRIC_PLACEHOLDER}：
${listed}${tail}`;
}

function sanitizeRewrittenText(
  sourceText: string,
  rewritten: string,
  forbiddenGapKeywords: string[],
): { text: string; metricsReplaced: number; linesRemoved: number } {
  let text = rewritten;
  let metricsReplaced = 0;

  const metrics = extractMetricSnippets(text)
    .filter((m) => !m.includes("待补充") && !metricExistsInSource(m, sourceText))
    .sort((a, b) => b.length - a.length);

  for (const metric of metrics) {
    if (!text.includes(metric)) continue;
    const parts = text.split(metric);
    if (parts.length > 1) {
      metricsReplaced += parts.length - 1;
      text = parts.join(METRIC_PLACEHOLDER);
    }
  }

  let linesRemoved = 0;
  if (forbiddenGapKeywords.length > 0) {
    const lines = text.split("\n");
    const kept = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      const leaks = forbiddenGapKeywords.some(
        (kw) => kw.length >= 4 && line.includes(kw),
      );
      if (leaks) {
        linesRemoved += 1;
        return false;
      }
      return true;
    });
    text =
      kept.length > 0
        ? kept.join("\n")
        : "（与缺口相关的无证据表述已省略，请结合匹配报告中的 gap 清单自行补充）";
  }

  return { text, metricsReplaced, linesRemoved };
}

export type SanitizeStats = {
  metricsReplaced: number;
  linesRemoved: number;
};

export function sanitizeOptimizeResult(
  resume: string,
  result: OptimizeResult,
): { result: OptimizeResult; stats: SanitizeStats } {
  const sourceText = [
    resume,
    ...result.sections.map((s) => s.original),
  ].join("\n");

  const forbiddenGapKeywords = (result.matchReport.gapDetails ?? [])
    .filter((g) => g.evidenceBoundary === "不能写")
    .map((g) => g.content.slice(0, Math.min(8, g.content.length)))
    .filter((kw) => kw.length >= 4);

  let metricsReplaced = 0;
  let linesRemoved = 0;

  const sections = result.sections.map((section) => {
    const cleaned = sanitizeRewrittenText(
      sourceText,
      section.rewritten,
      forbiddenGapKeywords,
    );
    metricsReplaced += cleaned.metricsReplaced;
    linesRemoved += cleaned.linesRemoved;
    return { ...section, rewritten: cleaned.text };
  });

  return {
    result: { ...result, sections },
    stats: { metricsReplaced, linesRemoved },
  };
}

export function applySanitizeIfNeeded(
  resume: string,
  result: OptimizeResult,
  auditMeta?: Pick<EvidenceAudit, "retried" | "retryImproved">,
): OptimizeResult {
  let audit = auditOptimizeEvidence(resume, result);
  if (!audit.hasFabricationRisk) {
    return { ...result, evidenceAudit: { ...audit, ...auditMeta } };
  }

  const { result: sanitizedResult, stats } = sanitizeOptimizeResult(
    resume,
    result,
  );
  const afterSanitize = auditOptimizeEvidence(resume, sanitizedResult);
  const evidenceAudit: EvidenceAudit = {
    ...afterSanitize,
    ...auditMeta,
    sanitized: stats.metricsReplaced > 0 || stats.linesRemoved > 0,
    sanitizedCount: stats.metricsReplaced + stats.linesRemoved,
  };

  if (evidenceAudit.sanitized) {
    const parts: string[] = [];
    if (stats.metricsReplaced > 0) {
      parts.push(`已自动将 ${stats.metricsReplaced} 处无依据数字替换为 ${METRIC_PLACEHOLDER}`);
    }
    if (stats.linesRemoved > 0) {
      parts.push(`已移除 ${stats.linesRemoved} 行与「不能写」缺口相关的无证据表述`);
    }
    const prefix = parts.join("；");
    evidenceAudit.message = evidenceAudit.hasFabricationRisk
      ? `${prefix}。仍有问题：${evidenceAudit.message}`
      : `${prefix}。当前未发现明显捏造。`;
  }

  return { ...sanitizedResult, evidenceAudit };
}
