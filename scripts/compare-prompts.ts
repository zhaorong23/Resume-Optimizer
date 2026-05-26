/**
 * 多 Prompt 变体对比脚本
 *
 * 用法:
 *   npm run compare:prompts                         # 对比全部 5 个变体
 *   npm run compare:prompts -- baseline concise     # 只对比指定变体
 *   npm run compare:prompts -- --focus "突出数据"     # 自定义优化侧重
 */

import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { optimizeResume } from "../lib/llm";
import { SAMPLE_RESUME, SAMPLE_JD, SAMPLE_FOCUS } from "../lib/fixtures";
import { listPromptVariants, type PromptVariant } from "../lib/prompts";
import type { OptimizeResult } from "../lib/schema";
import { loadEnv } from "./lib/env";

type CompareResult = {
  variant: PromptVariant;
  result?: OptimizeResult;
  error?: string;
  durationMs: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const variants: string[] = [];
  let focus = SAMPLE_FOCUS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--focus" && args[i + 1]) {
      focus = args[++i];
    } else if (!args[i].startsWith("--")) {
      variants.push(args[i]);
    }
  }

  const allVariants = listPromptVariants();
  const selected =
    variants.length > 0
      ? allVariants.filter((v) => variants.includes(v.id))
      : allVariants;

  if (selected.length === 0) {
    throw new Error(
      `未找到指定变体。可选：${allVariants.map((v) => v.id).join(", ")}`,
    );
  }

  return { selected, focus };
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSectionHtml(section: OptimizeResult["sections"][number]) {
  return [
    '<div class="section">',
    `<h4>${escapeHtml(section.title)}</h4>`,
    '<div class="diff">',
    `<div class="orig"><label>原文</label><pre>${escapeHtml(section.original)}</pre></div>`,
    `<div class="rewr"><label>改写</label><pre>${escapeHtml(section.rewritten)}</pre></div>`,
    "</div>",
    "</div>",
  ].join("");
}

function buildCardHtml({ variant, result, error, durationMs }: CompareResult) {
  if (error) {
    return [
      '<section class="card error">',
      `<h2>${escapeHtml(variant.name)} <span class="tag">${variant.id}</span></h2>`,
      `<p class="desc">${escapeHtml(variant.description)}</p>`,
      `<p class="err">失败 (${durationMs}ms): ${escapeHtml(error)}</p>`,
      "</section>",
    ].join("");
  }

  const summary =
    result!.sections.find((s) => s.title.includes("总结"))?.rewritten ??
    result!.sections[0]?.rewritten ??
    "";

  const keywordCoverage = result!.matchReport.keywordCoverage;
  const keywordMetric =
    keywordCoverage != null
      ? `<div class="metric"><span class="num">${keywordCoverage}</span><span>关键词覆盖</span></div>`
      : "";

  return [
    '<section class="card">',
    `<h2>${escapeHtml(variant.name)} <span class="tag">${variant.id}</span></h2>`,
    `<p class="desc">${escapeHtml(variant.description)} · temp=${variant.temperature} · ${durationMs}ms</p>`,
    '<div class="metrics">',
    `<div class="metric"><span class="num">${result!.matchReport.matchScore}</span><span>匹配分</span></div>`,
    keywordMetric,
    `<div class="metric"><span class="num">${result!.sections.length}</span><span>改写模块</span></div>`,
    "</div>",
    `<div class="summary"><label>个人总结改写</label><pre>${escapeHtml(summary)}</pre></div>`,
    `<details><summary>查看全部模块对比</summary>${result!.sections.map(buildSectionHtml).join("")}</details>`,
    `<details><summary>匹配报告</summary><pre>${escapeHtml(JSON.stringify(result!.matchReport, null, 2))}</pre></details>`,
    "</section>",
  ].join("");
}

function buildHtmlReport(results: CompareResult[], focus: string) {
  const cards = results.map(buildCardHtml).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Prompt 对比报告</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; padding: 2rem; }
    h1 { margin-bottom: .5rem; }
    .meta { color: #71717a; margin-bottom: 2rem; font-size: .875rem; }
    .grid { display: grid; gap: 1.5rem; }
    .card { background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e4e4e7; }
    .card.error { border-color: #fecaca; background: #fef2f2; }
    h2 { font-size: 1.125rem; margin-bottom: .5rem; }
    .tag { font-size: .75rem; background: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 999px; font-weight: normal; }
    .desc { color: #71717a; font-size: .8125rem; margin-bottom: 1rem; }
    .metrics { display: flex; gap: 1.5rem; margin-bottom: 1rem; }
    .metric { text-align: center; }
    .metric .num { display: block; font-size: 1.5rem; font-weight: 700; color: #4338ca; }
    .metric span:last-child { font-size: .75rem; color: #71717a; }
    .summary { background: #eef2ff; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .summary label, .section label { font-size: .6875rem; text-transform: uppercase; color: #71717a; font-weight: 600; }
    pre { white-space: pre-wrap; font-size: .8125rem; line-height: 1.6; margin-top: .25rem; }
    details { margin-top: .75rem; }
    details summary { cursor: pointer; font-size: .875rem; color: #4338ca; margin-bottom: .5rem; }
    .section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f4f4f5; }
    .diff { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-top: .5rem; }
    .orig { background: #f4f4f5; padding: .75rem; border-radius: 8px; }
    .rewr { background: #eef2ff; padding: .75rem; border-radius: 8px; }
    .err { color: #dc2626; font-size: .875rem; }
  </style>
</head>
<body>
  <h1>Prompt 变体对比报告</h1>
  <p class="meta">优化侧重：${escapeHtml(focus)} · 生成时间：${new Date().toLocaleString("zh-CN")}</p>
  <div class="grid">${cards}</div>
</body>
</html>`;
}

async function main() {
  loadEnv();
  const { selected, focus } = parseArgs();

  console.log(`对比 ${selected.length} 个 Prompt 变体...\n`);
  console.log(`优化侧重：${focus}\n`);

  const results: CompareResult[] = [];

  for (const variant of selected) {
    process.stdout.write(`▶ ${variant.name} (${variant.id})... `);
    const start = Date.now();

    try {
      const result = await optimizeResume(SAMPLE_RESUME, SAMPLE_JD, {
        focus,
        promptVariant: variant.id,
      });
      const durationMs = Date.now() - start;
      results.push({ variant, result, durationMs });

      const summary =
        result.sections.find((s) => s.title.includes("总结"))?.rewritten ??
        result.sections[0]?.rewritten ??
        "";
      console.log(`✓ 匹配 ${result.matchReport.matchScore} 分 (${durationMs}ms)`);
      console.log(`  改写预览: ${summary.slice(0, 80)}...\n`);
    } catch (err) {
      const durationMs = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      results.push({ variant, error: message, durationMs });
      console.log(`✗ 失败: ${message}\n`);
    }
  }

  const outDir = resolve(process.cwd(), "scripts/output");
  mkdirSync(outDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const htmlPath = resolve(outDir, `compare-${timestamp}.html`);
  writeFileSync(htmlPath, buildHtmlReport(results, focus), "utf-8");

  console.log("=".repeat(50));
  console.log("对比摘要：");
  console.log("-".repeat(50));
  for (const { variant, result, error, durationMs } of results) {
    if (error) {
      console.log(`  ${variant.id.padEnd(16)} ✗ ${error}`);
    } else {
      const kw = result!.matchReport.keywordCoverage;
      const kwStr = kw != null ? ` · 关键词 ${kw}%` : "";
      console.log(
        `  ${variant.id.padEnd(16)} 匹配 ${result!.matchReport.matchScore} 分${kwStr} · ${durationMs}ms`,
      );
    }
  }
  console.log("-".repeat(50));
  console.log(`\nHTML 报告已保存: ${htmlPath}`);
  console.log("在浏览器中打开该文件即可并排查看各 Prompt 效果。\n");
}

main().catch((err) => {
  console.error("对比失败:", err.message);
  process.exit(1);
});
