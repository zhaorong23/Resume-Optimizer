/**
 * 针对 AI 产品经理实习生 JD 的简历优化
 * 用法: npx tsx scripts/optimize-intern-resume.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { optimizeResume } from "../lib/llm";
import { loadEnv } from "./lib/env";

const RESUME = `北京爱奇艺科技有限公司 | 电商产品经理 | 2026.01 - 2026.05
工作内容：负责电商运营后台组件建设、相关数据报表迭代优化、订单归因分析，核心业务是围绕 IP衍生品和场景购物的"内容电商"，北极星指标为季度 GMV与订单量

【成毅庆生任务解锁组件（0-1）】
背景：爱奇艺首个明星庆生活动，需通过粉丝庆生打卡带动 IP 商品销售。
动作：本人主导设计任务解锁组件，支持三档解锁福利、进度条蛋糕动态展示、生日祝福弹幕等自定义配置；协调数藏、乐趣、电商三方需求，确保组件可复用于其他艺人活动。
结果：活动因出圈延长至 30天，累计 30 万人领取庆生皮肤，带动 120W+ GMV，形成"庆生互动→曝光引流→商品转化"漏斗。

【电商短视频监控报表优化】
背景：运营此前筛选未挂车视频需跨人跑 SQL，效率低下。
动作：本人新增"视频发布时间""未挂车视频"两个筛选维度，梳理达人/商家数据口径差异（存在商达一体情况），协调 BI 团队对齐口径。
结果：运营现可直观筛选未挂车视频并督促商家挂车，带动销售转化。

北京搜狐互联网信息服务有限公司 | 用户增长产品经理 | 2025.09 - 2025.12
工作内容：负责搜狐视频 APP 的 H5 端，使用 SQL 监测分析增长活动数据，并提出优化建议实现用户增长

【有声书和短剧福利活动】
目标：利用有声和短剧低 CAC 特性，在固定预算内规模化获取高质量新用户，并通过激励手段提升频道内的人均播放时长和人均 VV
动作：搭建阶梯式激励模型，将单一任务拆解为"新手任务+每日签到+累计时长/个数任务"的矩阵，引导用户深度消费；策划基于社交关系的裂变红包方案，建立"拉新-留存-再裂变"的自驱动链路，通过 0.5 元超低提现门槛降低用户认知阻力，提升转化率
结果：活动上线后，频道人均播放时长提升 4.17%，人均 VV 增长 11.60%；通过"7 天一周期"的任务循环，成功培养用户习惯，次月新用户留存率提升 9.26%

校园项目经历
低成本森林资源 AI 自动化调查方案 | 项目负责人 | 2025.09 - 至今
• 场景与需求定义：针对森林调查人工低效痛点，定义首版 AI 方案 MVP——消费级影像 + 多视图重建，在样地输出树参数；限定中低密度森林场景
• AI 方案调研与选型：对比传统 SfM+MVS、学习式 MVS、NeRF/3DGS 等路线，确定「Baseline 保证可评估 + 领域数据微调」路线
• 领域数据产品从 0 到 1：规划 4 块样地采集，设计拍摄 SOP 与 Ground Truth 评测集
• 评估体系与迭代：设计 L1 重建质量 → L2 业务指标 → L3 效率/成本三层 Metrics，建立迭代闭环
• 验证结果：调查效率提升 200%，设备成本降幅 >99%`;

const JD = `AI 产品经理实习生

岗位描述
我们正在寻找一位 AI 产品经理实习生，参与 AI Agent / AI 助手类产品的需求设计与迭代。你将围绕用户在真实场景中的任务需求，参与产品功能规划、用户体验优化、需求文档撰写、数据分析与上线复盘，帮助团队探索 AI 产品在 ToC 场景下的核心价值与增长机会。

工作内容
1. 参与 AI 产品的需求调研、功能设计和产品迭代，协助完成 PRD、流程图、交互说明等产品文档。
2. 结合用户反馈、行为数据和任务内容，分析用户使用场景、需求特征和体验问题，提出产品优化建议。
3. 参与新用户引导、任务推荐、用户激活、留存提升等增长方向的产品设计与效果复盘。
4. 跟进 AI Agent、Chatbot、效率工具、内容工具等方向的竞品和行业动态，输出有参考价值的分析结论。
5. 协同研发、设计、算法、运营等团队推进需求落地，并参与功能验收和上线后的效果跟踪。

岗位要求
1. 本科及以上学历在读，产品、计算机、交互设计、心理学、传播、商科等相关背景均可。
2. 对 AI 产品有强兴趣，日常愿意主动体验各类 AI Agent、Chatbot、AI 助手、效率工具等产品，并能形成自己的产品判断。
3. 有 ToC 产品经验优先，理解用户体验、用户激活、留存、转化、新手引导、推荐分发等基础产品逻辑。
4. 具备较好的需求拆解和文档表达能力，能够把模糊问题整理成清晰的产品方案。
5. 有一定数据意识，能够基于用户行为、漏斗转化、留存、任务内容等信息发现问题并提出假设。
6. 沟通推进能力强，责任心强，能够主动跟进问题，和研发、设计、算法、运营等角色高效协作。
7. 加分项：有 AI 产品、移动端 App、效率工具、内容社区、用户增长、用户研究、数据分析相关项目经历；熟悉 SQL 或数据分析工具更佳。

实习要求
每周至少实习 4 天，能够稳定实习 3 个月及以上，6 个月优先；尽快到岗优先。`;

const FOCUS = `突出 ToC 用户增长（激活、留存、任务设计）、0-1 产品设计与 PRD、数据分析与 SQL、跨团队协作；将森林项目改写为 AI 产品方案视角并压缩；强化与 AI Agent/助手类产品的方法论关联；面向 AI 产品经理实习生岗位，不要虚构未提供的经历`;

function buildMarkdown(result: Awaited<ReturnType<typeof optimizeResume>>) {
  const lines = [
    "# 优化后简历（AI 产品经理实习生）",
    "",
    `> 匹配度：${result.matchReport.matchScore}/100`,
    "",
    "## 匹配优势",
    ...result.matchReport.matched.map((m) => `- ${m}`),
    "",
    "## 待补缺口",
    ...result.matchReport.gaps.map((g) => `- ${g}`),
    "",
    "## 改进建议",
    ...result.matchReport.suggestions.map((s) => `- ${s}`),
    "",
    "---",
    "",
    ...result.sections.flatMap((s) => [`## ${s.title}`, "", s.rewritten, ""]),
    "",
    "---",
    result.disclaimer,
  ];
  return lines.join("\n");
}

async function main() {
  loadEnv();
  console.log("正在根据 AI 产品经理实习生 JD 优化简历...\n");

  const result = await optimizeResume(RESUME, JD, {
    focus: FOCUS,
    promptVariant: "baseline",
  });

  console.log(`匹配分：${result.matchReport.matchScore}/100\n`);
  console.log("=== 改写模块 ===\n");
  for (const section of result.sections) {
    console.log(`【${section.title}】\n${section.rewritten}\n`);
  }

  const outDir = resolve(process.cwd(), "scripts/output");
  mkdirSync(outDir, { recursive: true });
  const mdPath = resolve(outDir, "optimized-intern-resume.md");
  writeFileSync(mdPath, buildMarkdown(result), "utf-8");
  console.log(`\n完整报告已保存: ${mdPath}`);
}

main().catch((err) => {
  console.error("优化失败:", err.message);
  process.exit(1);
});
