/**
 * 检查二：面试准备 AI 样例 + Rubric 打分
 * 用法: npm run test:interview-prep [fixture-id]
 * fixture-id 可选:
 *   GOLDEN_PM | GOLDEN_PM_GROWTH | GOLDEN_OPS
 *   OPT_PM_A_JDONG … OPT_PM_C_XIAOMI（9 条 PM 3×3）
 *   OPT_OPS_A_BAIDU | OPT_OPS_B_QIJI | OPT_OPS_A_QIJI | OPT_OPS_B_BAIDU
 *   all（默认 CORE）| all-pm（9 条 PM）| all-ops（5 条运营）| all-full（全部 16 条）
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  GOLDEN_FIXTURES,
  GOLDEN_PM,
  OPS_EVAL_FIXTURES,
  PM_EVAL_FIXTURES,
  type GoldenFixture,
} from "../lib/fixtures";
import { generateInterviewPrep } from "../lib/interview-prep/generate";
import { buildInterviewPrepMarkdown } from "../lib/interview-prep/markdown";
import { ZHIPU_DEMO } from "../lib/demo-presets";
import { loadEnv } from "./lib/env";
import { printRubricReport, scoreInterviewPrep } from "./lib/rubric";

const ZHIPU_RESUME = `北京爱奇艺科技有限公司 | 电商产品经理 | 2026.01 - 2026.05
【成毅庆生任务解锁组件（0-1）】主导设计任务解锁组件，三档解锁福利+进度反馈；协调数藏/乐趣/电商三方。活动延长至30天，30万人领取皮肤，带动120W+ GMV。

北京搜狐互联网信息服务有限公司 | 用户增长产品经理 | 2025.09 - 2025.12
【有声书和短剧福利活动】搭建阶梯激励矩阵（新手+日签+深度任务），次月新用户留存+9.26%，人均VV+11.60%，时长+4.17%。

校园项目：AI 简历 JD 优化助手 MVP — ToC 任务型 Agent，支持简历解析、JD匹配、Prompt变体评测对比。
低成本森林资源 AI 自动化调查 — 定义 L1/L2/L3 评测体系，产品视角方案选型与迭代。`;

function resolveFixture(id: string): GoldenFixture {
  if (id === "GOLDEN_PM") {
    return {
      ...GOLDEN_PM,
      resume: ZHIPU_RESUME,
      companyName: ZHIPU_DEMO.companyName,
      roleTitle: ZHIPU_DEMO.roleTitle,
      jd: ZHIPU_DEMO.jd,
    };
  }
  const found = GOLDEN_FIXTURES.find((f) => f.id === id);
  if (!found) throw new Error(`未知 fixture: ${id}`);
  return found;
}

function legacyKeywordCheck(markdown: string, goldenPath: string | null) {
  if (!goldenPath || !existsSync(goldenPath)) return 0;
  const golden = readFileSync(goldenPath, "utf-8");
  const keywords = ["Agent", "评测", "留存", "GMV", "清言", "智谱"];
  return keywords.filter((kw) => golden.includes(kw) && markdown.includes(kw))
    .length;
}

async function runFixture(fixture: GoldenFixture) {
  console.log(`\n生成面试准备：${fixture.id}（quick）…`);

  const result = await generateInterviewPrep(
    {
      resume: fixture.resume,
      jd: fixture.jd,
      companyName: fixture.companyName,
      roleTitle: fixture.roleTitle,
      mode: "quick",
      roleType: fixture.roleType,
    },
    (event) => {
      if (event.type === "progress") {
        console.log(`[${event.step}] ${event.message}`);
      }
    },
  );

  const markdown = buildInterviewPrepMarkdown(
    result,
    fixture.companyName,
    fixture.roleTitle,
  );

  const outDir = resolve(process.cwd(), "scripts/output");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(
    outDir,
    `interview-prep-${fixture.id.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`,
  );
  writeFileSync(outPath, markdown, "utf-8");

  const rubric = scoreInterviewPrep(result, fixture);
  printRubricReport(rubric);

  if (fixture.id === "GOLDEN_PM") {
    const goldenPath = resolve(outDir, "interview-智谱清言-AI产品实习.md");
    const keywordHits = legacyKeywordCheck(markdown, goldenPath);
    console.log(`智谱关键词命中: ${keywordHits}/6`);
  }

  console.log(`自我介绍字数: ${result.selfIntro.length}`);
  console.log(`高频题数: ${result.commonQuestions.length}`);
  console.log(
    `及格/加分答法题数: ${result.commonQuestions.filter((q) => q.passAnswer && q.strongAnswer).length}`,
  );
  console.log(`已保存: ${outPath}`);

  return rubric;
}

function resolveFixtures(arg: string): GoldenFixture[] {
  if (arg === "all") {
    return [
      resolveFixture("GOLDEN_PM"),
      resolveFixture("GOLDEN_PM_GROWTH"),
      resolveFixture("GOLDEN_OPS"),
    ];
  }
  if (arg === "all-pm") {
    return PM_EVAL_FIXTURES;
  }
  if (arg === "all-ops") {
    return [resolveFixture("GOLDEN_OPS"), ...OPS_EVAL_FIXTURES];
  }
  if (arg === "all-full") {
    return GOLDEN_FIXTURES.map((f) =>
      f.id === "GOLDEN_PM" ? resolveFixture("GOLDEN_PM") : f,
    );
  }
  return [resolveFixture(arg)];
}

async function main() {
  loadEnv();

  const arg = process.argv[2] ?? "all";
  const fixtures = resolveFixtures(arg);

  const reports = [];
  for (const fixture of fixtures) {
    reports.push(await runFixture(fixture));
  }

  const outDir = resolve(process.cwd(), "scripts/output");
  mkdirSync(outDir, { recursive: true });
  const reportPath = resolve(
    outDir,
    `rubric-interview-${new Date().toISOString().slice(0, 10)}.json`,
  );
  writeFileSync(reportPath, JSON.stringify(reports, null, 2), "utf-8");
  console.log(`\nRubric 报告: ${reportPath}`);

  const allPassed = reports.every((r) => r.passed);
  if (!allPassed) {
    console.error("\n检查二未达标：存在 FAIL 样例");
    process.exit(1);
  }
  console.log("\n检查二通过 ✓");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
