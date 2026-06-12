/**
 * 捏造率测量（支持变体对比与弱匹配冒烟）
 *
 * 用法:
 *   npm run measure:fabrication
 *   npm run measure:fabrication -- --weak-smoke
 *   npm run measure:fabrication -- --variant baseline
 *   npm run measure:fabrication -- --variants baseline,concise --limit 5
 *   npm run measure:fabrication -- OPT_PM_A_JDONG
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import {
  GOLDEN_FIXTURES,
  getWeakFixtureSmokeSet,
  WEAK_FIXTURE_SMOKE_IDS,
} from "../lib/fixtures";
import { optimizeResume } from "../lib/llm";
import { listPromptVariants } from "../lib/prompts";
import { loadEnv } from "./lib/env";

type Row = {
  id: string;
  hasRisk: boolean;
  metricCount: number;
  retried: boolean;
  sanitized: boolean;
  error?: string;
};

type VariantReport = {
  promptVariant: string;
  rows: Row[];
  summary: {
    total: number;
    pass: number;
    risk: number;
    sanitized: number;
    errors: number;
    riskRate: string;
  };
  weakSmoke?: {
    total: number;
    pass: number;
    risk: number;
    riskRate: string;
  };
};

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = GOLDEN_FIXTURES.length;
  let filterId: string | undefined;
  let weakSmoke = false;
  let variants: string[] = ["baseline"];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = Number.parseInt(args[++i], 10);
    } else if (args[i] === "--weak-smoke") {
      weakSmoke = true;
    } else if (args[i] === "--variant" && args[i + 1]) {
      variants = [args[++i]];
    } else if (args[i] === "--variants" && args[i + 1]) {
      variants = args[++i].split(",").map((v) => v.trim());
    } else if (!args[i].startsWith("--")) {
      filterId = args[i];
    }
  }

  const allVariantIds = listPromptVariants().map((v) => v.id);
  for (const v of variants) {
    if (!allVariantIds.includes(v)) {
      throw new Error(
        `未知变体 "${v}"，可选：${allVariantIds.join(", ")}`,
      );
    }
  }

  let fixtures = weakSmoke ? getWeakFixtureSmokeSet() : GOLDEN_FIXTURES;
  if (filterId) {
    fixtures = fixtures.filter((f) => f.id === filterId);
    if (fixtures.length === 0) {
      throw new Error(`未找到 fixture: ${filterId}`);
    }
  } else if (!weakSmoke) {
    fixtures = fixtures.slice(0, limit);
  }

  return { fixtures, variants, weakSmoke };
}

async function measureVariant(
  fixtures: typeof GOLDEN_FIXTURES,
  promptVariant: string,
): Promise<VariantReport> {
  const rows: Row[] = [];

  for (const fixture of fixtures) {
    process.stdout.write(`  ${fixture.id} … `);
    try {
      const result = await optimizeResume(fixture.resume, fixture.jd, {
        promptVariant,
      });
      const audit = result.evidenceAudit;
      rows.push({
        id: fixture.id,
        hasRisk: audit?.hasFabricationRisk ?? false,
        metricCount: audit?.fabricatedMetrics.length ?? 0,
        retried: audit?.retried ?? false,
        sanitized: audit?.sanitized ?? false,
      });
      console.log(
        audit?.hasFabricationRisk ? "RISK" : "OK",
        audit?.sanitized ? "(sanitized)" : "",
        audit?.retried ? "(retried)" : "",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      rows.push({
        id: fixture.id,
        hasRisk: true,
        metricCount: 0,
        retried: false,
        sanitized: false,
        error: message,
      });
      console.log(`ERROR: ${message.slice(0, 60)}`);
    }
  }

  const ok = rows.filter((r) => !r.hasRisk && !r.error);
  const risk = rows.filter((r) => r.hasRisk && !r.error);
  const errors = rows.filter((r) => r.error);
  const sanitized = rows.filter((r) => r.sanitized);
  const weakRows = rows.filter((r) =>
    (WEAK_FIXTURE_SMOKE_IDS as readonly string[]).includes(r.id),
  );
  const weakOk = weakRows.filter((r) => !r.hasRisk && !r.error);

  return {
    promptVariant,
    rows,
    summary: {
      total: rows.length,
      pass: ok.length,
      risk: risk.length,
      sanitized: sanitized.length,
      errors: errors.length,
      riskRate:
        rows.length > 0
          ? `${((risk.length / rows.length) * 100).toFixed(1)}%`
          : "0%",
    },
    weakSmoke:
      weakRows.length > 0
        ? {
            total: weakRows.length,
            pass: weakOk.length,
            risk: weakRows.length - weakOk.length,
            riskRate: `${(((weakRows.length - weakOk.length) / weakRows.length) * 100).toFixed(1)}%`,
          }
        : undefined,
  };
}

async function main() {
  loadEnv();
  const { fixtures, variants, weakSmoke } = parseArgs();

  console.log(
    `捏造率测量 · ${fixtures.length} 条 fixture · 变体 ${variants.join(", ")}${weakSmoke ? " · 弱匹配冒烟" : ""}\n`,
  );

  const reports: VariantReport[] = [];
  for (const variant of variants) {
    console.log(`\n=== ${variant} ===`);
    reports.push(await measureVariant(fixtures, variant));
  }

  console.log("\n--- 汇总 ---");
  for (const report of reports) {
    const s = report.summary;
    console.log(
      `${report.promptVariant}: 通过 ${s.pass}/${s.total} · 风险率 ${s.riskRate} · 清洗 ${s.sanitized} · 失败 ${s.errors}`,
    );
    if (report.weakSmoke) {
      const w = report.weakSmoke;
      console.log(
        `  弱匹配子集: 通过 ${w.pass}/${w.total} · 风险率 ${w.riskRate}`,
      );
    }
  }

  const outDir = resolve(process.cwd(), "public/eval-samples");
  mkdirSync(outDir, { recursive: true });
  const fileName =
    variants.length === 1
      ? `fabrication-${variants[0]}${weakSmoke ? "-weak-smoke" : ""}.json`
      : "fabrication-variants-compare.json";
  const outPath = resolve(outDir, fileName);
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        weakSmoke,
        weakFixtureIds: [...WEAK_FIXTURE_SMOKE_IDS],
        reports,
      },
      null,
      2,
    ),
  );
  console.log(`\n已写入 ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
