/**
 * 检查二：简历优化 AI 样例 + Rubric 打分
 * 用法: npm run test:prompt [variant-id] [fixture-id]
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { GOLDEN_FIXTURES, GOLDEN_PM } from "../lib/fixtures";
import { optimizeResume } from "../lib/llm";
import { listPromptVariants } from "../lib/prompts";
import { loadEnv } from "./lib/env";
import { printRubricReport, scoreOptimize } from "./lib/rubric";

async function main() {
  loadEnv();

  const variantId = process.argv[2];
  const fixtureId = process.argv[3] ?? "GOLDEN_PM";
  const variants = listPromptVariants();

  if (variantId && !variants.find((v) => v.id === variantId)) {
    console.error(
      `未知变体 "${variantId}"，可选：${variants.map((v) => v.id).join(", ")}`,
    );
    process.exit(1);
  }

  const fixture =
    GOLDEN_FIXTURES.find((f) => f.id === fixtureId) ?? GOLDEN_PM;
  const variant = variantId ?? "baseline";

  console.log(`检查二：简历优化 · 变体 ${variant} · ${fixture.id}\n`);

  const result = await optimizeResume(fixture.resume, fixture.jd, {
    promptVariant: variant,
  });

  const rubric = scoreOptimize(result, fixture);
  printRubricReport(rubric);

  if (result.evidenceAudit) {
    console.log(
      "\n可信度:",
      result.evidenceAudit.hasFabricationRisk ? "有风险" : "通过",
      result.evidenceAudit.retried ? "· 已重试" : "",
      result.evidenceAudit.sanitized ? "· 已清洗" : "",
    );
  }

  console.log("\n匹配分:", result.matchReport.matchScore);
  console.log("改写模块数:", result.sections.length);
  if (result.matchReport.gapDetails?.length) {
    console.log(
      "gapDetails:",
      result.matchReport.gapDetails
        .map((g) => `${g.content}（${g.evidenceBoundary}）`)
        .join("；"),
    );
  }

  const outDir = resolve(process.cwd(), "scripts/output");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const reportPath = resolve(
    outDir,
    `rubric-optimize-${fixture.id.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`,
  );
  writeFileSync(reportPath, JSON.stringify(rubric, null, 2), "utf-8");
  console.log(`\nRubric 报告: ${reportPath}`);

  if (!rubric.passed) {
    console.error("\n检查二未达标");
    process.exit(1);
  }
  console.log("\n检查二通过 ✓");
}

main().catch((err) => {
  console.error("测试失败:", err.message);
  process.exit(1);
});
