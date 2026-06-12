import type { GoldenFixture } from "../../lib/fixtures";
import type { InterviewPrepResult } from "../../lib/interview-prep/schema";
import type { OptimizeResult } from "../../lib/schema";

export type RubricDimension =
  | "structure"
  | "evidence"
  | "trackMatch"
  | "actionable"
  | "usability"
  | "sourceTrust";

export type RubricReport = {
  fixtureId: string;
  dimensions: Record<RubricDimension, number>;
  total: number;
  passed: boolean;
  notes: string[];
};

const WEIGHTS: Record<RubricDimension, number> = {
  structure: 0.15,
  evidence: 0.25,
  trackMatch: 0.2,
  actionable: 0.15,
  usability: 0.15,
  sourceTrust: 0.1,
};

function weightedTotal(dimensions: Record<RubricDimension, number>): number {
  return Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) =>
      sum + dimensions[key as RubricDimension] * weight,
    0,
  );
}

function keywordHitRate(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 3;
  const hits = keywords.filter((kw) => text.includes(kw)).length;
  const ratio = hits / keywords.length;
  if (ratio >= 0.5) return 5;
  if (ratio >= 0.3) return 4;
  if (ratio >= 0.15) return 3;
  if (ratio > 0) return 2;
  return 1;
}

export function scoreInterviewPrep(
  result: InterviewPrepResult,
  fixture: GoldenFixture,
): RubricReport {
  const notes: string[] = [];
  const questionText = result.commonQuestions
    .map((q) => `${q.question} ${q.referenceAnswer} ${q.passAnswer ?? ""} ${q.strongAnswer ?? ""}`)
    .join("\n");

  const structure =
    result.selfIntro &&
    result.projectDeepDives.length >= 1 &&
    result.commonQuestions.length >= 5 &&
    result.gapChecklist.priority1.length >= 0
      ? result.commonQuestions.length >= 8
        ? 5
        : 4
      : 2;

  const hasFabricationRisk = result.jdLineMatches.some(
    (row) =>
      row.matchLevel !== "unknown" &&
      row.resumeEvidence.includes("简历未见直接证据") === false &&
      row.resumeEvidence.length < 4,
  );
  const boundaryCount =
    result.gapChecklist.priority1.filter((g) => g.evidenceBoundary).length +
    result.jdLineMatches.filter((r) => r.evidenceBoundary).length;
  let evidence = boundaryCount > 0 ? 4 : 3;
  if (hasFabricationRisk) {
    evidence = 2;
    notes.push("部分匹配行证据偏弱");
  }
  if (boundaryCount >= 3) evidence = Math.min(5, evidence + 1);

  const trackMatch = keywordHitRate(questionText, fixture.expectedKeywords);

  const actionable =
    result.gapChecklist.priority1.some((g) => g.action.length >= 6) ||
    result.gapChecklist.priority2.some((g) => g.action.length >= 6)
      ? 4
      : 2;

  let usability =
    result.selfIntro.length <= 250 && result.selfIntro.length >= 80 ? 4 : 2;
  if (
    result.selfIntro.length <= 250 &&
    result.projectDeepDives.length >= 2 &&
    usability >= 4
  ) {
    usability = 5;
  }

  const answerQualityCount = result.commonQuestions.filter(
    (q) => q.passAnswer && q.strongAnswer,
  ).length;
  if (answerQualityCount >= 2) {
    notes.push(`含 ${answerQualityCount} 道及格/加分答法对比`);
  }

  const sourceTrust =
    result.sources.length > 0
      ? 4
      : result.searchFailed
        ? 2
        : 3;

  const dimensions = {
    structure,
    evidence,
    trackMatch,
    actionable,
    usability,
    sourceTrust,
  } as Record<RubricDimension, number>;

  const total = weightedTotal(dimensions);
  const passed = total >= 3.5 && evidence >= 3;

  return { fixtureId: fixture.id, dimensions, total, passed, notes };
}

export function scoreOptimize(
  result: OptimizeResult,
  fixture: GoldenFixture,
): RubricReport {
  const notes: string[] = [];
  const rewritten = result.sections.map((s) => s.rewritten).join("\n");

  let fabricationBlocked = false;

  if (result.evidenceAudit?.hasFabricationRisk) {
    fabricationBlocked = true;
    notes.push(
      `可信度审计未通过：${result.evidenceAudit.message}`,
    );
    if (result.evidenceAudit.fabricatedMetrics.length > 0) {
      notes.push(
        `无依据数字：${result.evidenceAudit.fabricatedMetrics.slice(0, 5).join("、")}`,
      );
    }
    if (result.evidenceAudit.retried) notes.push("已触发捏造重试");
    if (result.evidenceAudit.sanitized) notes.push("已触发确定性清洗");
  }

  const mustNotHits = (fixture.mustNot ?? []).filter((phrase) =>
    rewritten.includes(phrase),
  );
  if (mustNotHits.length > 0) {
    fabricationBlocked = true;
    notes.push(`改写含禁止虚构表述：${mustNotHits.join("、")}`);
  }

  const mustKeep = fixture.mustKeep ?? [];
  let mustKeepHits = 0;
  if (mustKeep.length > 0) {
    mustKeepHits = mustKeep.filter((phrase) => rewritten.includes(phrase)).length;
    const ratio = mustKeepHits / mustKeep.length;
    if (ratio < 0.4) {
      notes.push(
        `mustKeep 保留不足：${mustKeepHits}/${mustKeep.length}（${(ratio * 100).toFixed(0)}%）`,
      );
    } else if (ratio >= 0.7) {
      notes.push(`mustKeep 保留 ${mustKeepHits}/${mustKeep.length}`);
    }
  }

  const structure =
    result.sections.length >= 2 &&
    result.matchReport.matchScore >= 0 &&
    result.matchReport.matchScore <= 100
      ? 5
      : 2;

  const gapDetails = result.matchReport.gapDetails ?? [];
  let evidence = gapDetails.length > 0 ? 4 : 3;
  if (gapDetails.some((g) => g.evidenceBoundary === "不能写")) {
    evidence = Math.max(evidence, 4);
  }
  if (!gapDetails.length) notes.push("未返回 gapDetails，仅基础证据分");

  if (fabricationBlocked) {
    evidence = 1;
  } else if (mustNotHits.length > 0) {
    evidence = Math.min(evidence, 2);
  }

  const trackMatch = keywordHitRate(rewritten, fixture.expectedKeywords);

  const actionable =
    result.matchReport.suggestions.length >= 2 ||
    gapDetails.some((g) => g.suggestion && g.suggestion.length >= 6)
      ? 4
      : 2;

  let usability = result.sections.every((s) => s.rewritten.length > 20) ? 4 : 3;
  if (mustKeep.length > 0) {
    const keepRatio = mustKeepHits / mustKeep.length;
    if (keepRatio < 0.4) usability = Math.min(usability, 2);
    else if (keepRatio >= 0.7 && usability >= 4) usability = 5;
  }

  const sourceTrust = 3;

  const dimensions = {
    structure,
    evidence,
    trackMatch,
    actionable,
    usability,
    sourceTrust,
  } as Record<RubricDimension, number>;

  const total = weightedTotal(dimensions);
  const passed =
    total >= 3.5 && evidence >= 3 && !fabricationBlocked && mustNotHits.length === 0;

  return { fixtureId: fixture.id, dimensions, total, passed, notes };
}

export function printRubricReport(report: RubricReport) {
  console.log(`\n--- Rubric: ${report.fixtureId} ---`);
  console.log(JSON.stringify(report.dimensions, null, 2));
  console.log(`总分: ${report.total.toFixed(2)} / 5 · ${report.passed ? "PASS" : "FAIL"}`);
  if (report.notes.length > 0) {
    console.log("备注:", report.notes.join("；"));
  }
}
