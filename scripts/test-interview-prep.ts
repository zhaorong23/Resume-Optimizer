/**
 * 智谱清言 golden sample 面试准备质量验证
 * 用法: npx tsx scripts/test-interview-prep.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { generateInterviewPrep } from "../lib/interview-prep/generate";
import { buildInterviewPrepMarkdown } from "../lib/interview-prep/markdown";
import { ZHIPU_DEMO } from "../lib/demo-presets";
import { loadEnv } from "./lib/env";

const RESUME = `北京爱奇艺科技有限公司 | 电商产品经理 | 2026.01 - 2026.05
【成毅庆生任务解锁组件（0-1）】主导设计任务解锁组件，三档解锁福利+进度反馈；协调数藏/乐趣/电商三方。活动延长至30天，30万人领取皮肤，带动120W+ GMV。

北京搜狐互联网信息服务有限公司 | 用户增长产品经理 | 2025.09 - 2025.12
【有声书和短剧福利活动】搭建阶梯激励矩阵（新手+日签+深度任务），次月新用户留存+9.26%，人均VV+11.60%，时长+4.17%。

校园项目：AI 简历 JD 优化助手 MVP — ToC 任务型 Agent，支持简历解析、JD匹配、Prompt变体评测对比。
低成本森林资源 AI 自动化调查 — 定义 L1/L2/L3 评测体系，产品视角方案选型与迭代。`;

function scoreResult(markdown: string, goldenPath: string | null) {
  const checks = {
    hasSelfIntro: /## 三、定制版自我介绍/.test(markdown),
    hasStar: /## 四、项目深挖/.test(markdown),
    hasGapP1: /优先级 1/.test(markdown),
    hasSourcesSection: /## 来源链接/.test(markdown),
    introLengthOk:
      (markdown.match(/## 三、定制版自我介绍[\s\S]*?(?=## )/)?.[0]?.length ??
        0) < 600,
    goldenKeywordHits: 0,
  };

  if (goldenPath && existsSync(goldenPath)) {
    const golden = readFileSync(goldenPath, "utf-8");
    const keywords = ["Agent", "评测", "留存", "GMV", "清言", "智谱"];
    checks.goldenKeywordHits = keywords.filter((kw) =>
      golden.includes(kw) && markdown.includes(kw),
    ).length;
  }

  return checks;
}

async function main() {
  loadEnv();

  console.log("生成智谱清言面试准备（quick 模式）…\n");

  const result = await generateInterviewPrep(
    {
      resume: RESUME,
      jd: ZHIPU_DEMO.jd,
      companyName: ZHIPU_DEMO.companyName,
      roleTitle: ZHIPU_DEMO.roleTitle,
      productName: ZHIPU_DEMO.productName,
      mode: "quick",
      roleType: "pm",
    },
    (event) => {
      if (event.type === "progress") {
        console.log(`[${event.step}] ${event.message}`);
      }
    },
  );

  const markdown = buildInterviewPrepMarkdown(
    result,
    ZHIPU_DEMO.companyName,
    ZHIPU_DEMO.roleTitle,
  );

  const outDir = resolve(process.cwd(), "scripts/output");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(
    outDir,
    `interview-prep-zhipu-${new Date().toISOString().slice(0, 10)}.md`,
  );
  writeFileSync(outPath, markdown, "utf-8");

  const goldenPath = resolve(outDir, "interview-智谱清言-AI产品实习.md");
  const scores = scoreResult(markdown, goldenPath);

  console.log("\n--- 质量检查 ---");
  console.log(JSON.stringify(scores, null, 2));
  console.log(`\n自我介绍字数: ${result.selfIntro.length}`);
  console.log(`项目深挖数: ${result.projectDeepDives.length}`);
  console.log(`高频题数: ${result.commonQuestions.length}`);
  console.log(`来源数: ${result.sources.length}`);
  console.log(`Gap P1: ${result.gapChecklist.priority1.length}`);
  console.log(`\n已保存: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
