/**
 * 批量生成盲评样本包（简历优化产出 + 自动 Rubric）
 * 用法: npm run eval:generate [prompt-variant]
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { getEvalOptimizeFixtures } from "../lib/eval/fixtures";
import type { EvalManifestBlind, EvalManifestFull } from "../lib/eval/types";
import { optimizeResume } from "../lib/llm";
import { scoreOptimize } from "./lib/rubric";
import { loadEnv } from "./lib/env";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function main() {
  loadEnv();

  const promptVariant = process.argv[2] ?? "baseline";
  const fixtures = getEvalOptimizeFixtures();
  const batchId = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const generatedAt = new Date().toISOString();

  console.log(
    `生成盲评样本包 · ${fixtures.length} 条 · 变体 ${promptVariant}\n`,
  );

  const shuffled = shuffle(
    fixtures.map((fixture, index) => ({
      fixture,
      opaqueId: `SAMPLE-${String(index + 1).padStart(2, "0")}`,
    })),
  );

  const blindSamples: EvalManifestBlind["samples"] = [];
  const fullSamples: EvalManifestFull["samples"] = [];

  for (const { fixture, opaqueId } of shuffled) {
    console.log(`[${opaqueId}] ${fixture.id} …`);
    const output = await optimizeResume(fixture.resume, fixture.jd, {
      promptVariant,
    });
    const autoRubric = scoreOptimize(output, fixture);

    blindSamples.push({
      opaqueId,
      trackLabel: fixture.roleType === "pm" ? "产品经理" : "产品运营",
      jd: fixture.jd,
      resume: fixture.resume,
      output,
    });

    fullSamples.push({
      opaqueId,
      fixtureId: fixture.id,
      matchTier: fixture.matchTier,
      autoRubric,
    });

    console.log(
      `  匹配分 ${output.matchReport.matchScore} · Rubric ${autoRubric.total.toFixed(2)} ${autoRubric.passed ? "PASS" : "FAIL"}`,
    );
  }

  const outDir = resolve(process.cwd(), "public/eval-samples");
  mkdirSync(outDir, { recursive: true });

  const manifestBlind: EvalManifestBlind = {
    batchId,
    generatedAt,
    promptVariant,
    sampleCount: blindSamples.length,
    samples: blindSamples,
  };

  const manifestFull: EvalManifestFull = {
    batchId,
    generatedAt,
    promptVariant,
    samples: fullSamples,
  };

  writeFileSync(
    resolve(outDir, "manifest-blind.json"),
    JSON.stringify(manifestBlind, null, 2),
    "utf-8",
  );
  writeFileSync(
    resolve(outDir, "manifest-full.json"),
    JSON.stringify(manifestFull, null, 2),
    "utf-8",
  );

  const scriptsOut = resolve(process.cwd(), "scripts/output/eval-samples");
  if (!existsSync(scriptsOut)) mkdirSync(scriptsOut, { recursive: true });
  writeFileSync(
    resolve(scriptsOut, `manifest-full-${batchId}.json`),
    JSON.stringify(manifestFull, null, 2),
    "utf-8",
  );

  console.log(`\n已写入 public/eval-samples/manifest-blind.json`);
  console.log(`已写入 public/eval-samples/manifest-full.json`);
  console.log(`批次 ID: ${batchId}`);
  console.log(`\n下一步: npm run dev → 打开 http://localhost:3000/eval`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
