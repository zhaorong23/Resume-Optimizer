import type { GoldenFixture } from "../fixtures";
import {
  GOLDEN_PM,
  OPS_EVAL_FIXTURES,
  PM_EVAL_FIXTURES,
} from "../fixtures";
import { ZHIPU_DEMO } from "../demo-presets";

/** 与 test-interview-prep 一致的真实简历，用于评测 */
export const ZHIPU_EVAL_RESUME = `北京爱奇艺科技有限公司 | 电商产品经理 | 2026.01 - 2026.05
【成毅庆生任务解锁组件（0-1）】主导设计任务解锁组件，三档解锁福利+进度反馈；协调数藏/乐趣/电商三方。活动延长至30天，30万人领取皮肤，带动120W+ GMV。

北京搜狐互联网信息服务有限公司 | 用户增长产品经理 | 2025.09 - 2025.12
【有声书和短剧福利活动】搭建阶梯激励矩阵（新手+日签+深度任务），次月新用户留存+9.26%，人均VV+11.60%，时长+4.17%。

校园项目：AI 简历 JD 优化助手 MVP — ToC 任务型 Agent，支持简历解析、JD匹配、Prompt变体评测对比。
低成本森林资源 AI 自动化调查 — 定义 L1/L2/L3 评测体系，产品视角方案选型与迭代。`;

export function resolveGoldenPmEval(): GoldenFixture {
  return {
    ...GOLDEN_PM,
    resume: ZHIPU_EVAL_RESUME,
    companyName: ZHIPU_DEMO.companyName,
    roleTitle: ZHIPU_DEMO.roleTitle,
    jd: ZHIPU_DEMO.jd,
    mustKeep: ["Agent", "GMV", "留存", "评测", "爱奇艺", "搜狐"],
    mustNot: ["智谱清言实习已入职"],
    matchTier: "strong",
  };
}

/** 盲评主集：智谱真实 PM + 9 PM 配对 + 4 OPS 配对 = 14 条 */
export function getEvalOptimizeFixtures(): GoldenFixture[] {
  return [
    resolveGoldenPmEval(),
    ...PM_EVAL_FIXTURES,
    ...OPS_EVAL_FIXTURES,
  ];
}
