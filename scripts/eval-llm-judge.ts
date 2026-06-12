/**
 * 用独立评委模型对盲评样本包打分（替代/辅助人工盲评）
 * 用法: npm run eval:judge
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { EvalManifestBlind, HumanScoresFile } from "../lib/eval/types";
import { scoreSampleWithJudge } from "../lib/eval/judge";
import { getJudgeLlmConfig } from "../lib/llm-config";
import { loadEnv } from "./lib/env";

async function main() {
  loadEnv();

  const blindPath = resolve(
    process.cwd(),
    "public/eval-samples/manifest-blind.json",
  );
  if (!existsSync(blindPath)) {
    console.error(
      "未找到 public/eval-samples/manifest-blind.json，请先运行 npm run eval:generate",
    );
    process.exit(1);
  }

  const manifest = JSON.parse(
    readFileSync(blindPath, "utf-8"),
  ) as EvalManifestBlind;
  const judgeConfig = getJudgeLlmConfig();

  console.log(
    `LLM 评委打分 · 批次 ${manifest.batchId} · ${manifest.samples.length} 条`,
  );
  console.log(
    `评委模型: ${judgeConfig.model} @ ${judgeConfig.baseUrl}${
      judgeConfig.usesSeparateJudge ? "（独立配置）" : "（与优化模型相同，建议在 .env 配置 JUDGE_LLM_*）"
    }\n`,
  );

  const scores = [];
  for (const sample of manifest.samples) {
    console.log(`[${sample.opaqueId}] 评委打分中…`);
    const entry = await scoreSampleWithJudge(sample, judgeConfig);
    scores.push(entry);
    const dimAvg =
      Object.values(entry.dimensions).reduce((a, b) => a + b, 0) /
      Object.values(entry.dimensions).length;
    console.log(
      `  均分 ${dimAvg.toFixed(1)} · ${entry.passed ? "PASS" : "FAIL"} · ${entry.notes}`,
    );
  }

  const outFile: HumanScoresFile = {
    batchId: manifest.batchId,
    exportedAt: new Date().toISOString(),
    scorer: "llm-judge",
    judgeModel: judgeConfig.model,
    judgeBaseUrl: judgeConfig.baseUrl,
    scores,
  };

  const outPath = resolve(
    process.cwd(),
    "public/eval-samples/llm-judge-scores.json",
  );
  writeFileSync(outPath, JSON.stringify(outFile, null, 2), "utf-8");

  const scriptsOut = resolve(process.cwd(), "scripts/output/eval-samples");
  if (!existsSync(scriptsOut)) mkdirSync(scriptsOut, { recursive: true });
  writeFileSync(
    resolve(scriptsOut, `llm-judge-scores-${manifest.batchId}.json`),
    JSON.stringify(outFile, null, 2),
    "utf-8",
  );

  console.log(`\n已写入 ${outPath}`);
  console.log("下一步: npm run dev → http://localhost:3000/eval/compare");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
