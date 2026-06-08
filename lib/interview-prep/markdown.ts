import { formatMatchLevel } from "./format";
import type { InterviewPrepResult } from "./schema";

export function buildInterviewPrepMarkdown(
  result: InterviewPrepResult,
  companyName: string,
  roleTitle?: string,
): string {
  const title = roleTitle
    ? `面试准备：${roleTitle}（${companyName}）`
    : `面试准备（${companyName}）`;

  const lines: string[] = [
    `# ${title}`,
    "",
    `> 模式：${result.mode} · 生成时间：${new Date().toLocaleDateString("zh-CN")}`,
    "",
    "---",
    "",
    "## 零、JD 原文",
    "",
    result.jdOriginal,
    "",
    "## 一、公司与产品调研",
    "",
    result.companyResearch.overview,
    "",
    "### 1.1 公司背景",
    "",
    ...result.companyResearch.background.map(
      (row) => `- **${row.label}**：${row.value}`,
    ),
    "",
    "### 1.2 产品核心特性",
    "",
    ...result.companyResearch.productFeatures.map((item) => `- ${item}`),
    "",
    "### 1.3 竞品格局",
    "",
    ...result.companyResearch.competitors.map(
      (item) => `- **${item.name}**：${item.comparison}`,
    ),
    "",
    "### 1.4 团队文化信号",
    "",
    ...result.companyResearch.teamCulture.map((item) => `- ${item}`),
    "",
    "### 1.5 热点话题",
    "",
    ...result.companyResearch.hotTopics.map((item) =>
      item.url
        ? `- [${item.title}](${item.url}) — ${item.note}`
        : `- ${item.title} — ${item.note}`,
    ),
    "",
    "### 1.6 面经风格",
    "",
    result.companyResearch.interviewStyle,
    "",
    "## 二、JD 深度解读",
    "",
    "### 2.1 核心意图",
    "",
    result.jdIntent,
    "",
    "### 2.2 职责白话解读",
    "",
    ...result.responsibilityInterpretations.flatMap((item) => [
      `**JD 原文**：${item.original}`,
      `**白话解读**：${item.interpretation}`,
      "",
    ]),
    "### 2.3 逐条匹配分析",
    "",
    "| JD 要求 | 简历依据 | 匹配度 | gap / 风险 | 面试策略 |",
    "|---------|---------|--------|-----------|----------|",
    ...result.jdLineMatches.map(
      (row) =>
        `| ${row.jdRequirement} | ${row.resumeEvidence} | ${formatMatchLevel(row.matchLevel)} | ${row.gapOrRisk} | ${row.interviewStrategy} |`,
    ),
    "",
    "## 三、定制版自我介绍",
    "",
    result.selfIntro,
    "",
    "## 四、项目深挖问答",
    "",
  ];

  for (const project of result.projectDeepDives) {
    lines.push(`### ${project.projectName}`, "");
    lines.push(
      `- **情境**：${project.star.situation}`,
      `- **任务**：${project.star.task}`,
      `- **行动**：${project.star.action}`,
      `- **结果**：${project.star.result}`,
      "",
      "**追问预案：**",
      "",
    );
    for (const followUp of project.followUps) {
      lines.push(`- **Q**：${followUp.question}`, `  **A**：${followUp.answer}`, "");
    }
  }

  lines.push(
    "## 五、高频面试问题",
    "",
    ...result.commonQuestions.flatMap((q) => [
      `### ${q.question}`,
      `> 来源：${q.source}${q.examiningPoint ? ` · 考察：${q.examiningPoint}` : ""}`,
      "",
      q.referenceAnswer,
      "",
    ]),
    "## 六、产品设计思考",
    "",
    "### 亮点观察",
    "",
    ...result.designObservations.highlights.map(
      (item) => `- **${item.observation}** — ${item.judgment}`,
    ),
    "",
    "### 潜在挑战",
    "",
    ...result.designObservations.challenges.map((item) => `- ${item}`),
    "",
    "## 七、反问清单",
    "",
    ...result.reverseQuestions.map((item, i) => `${i + 1}. ${item}`),
    "",
    "## 附、Gap 清单",
    "",
    "### 优先级 1 — 必须补",
    "",
    ...result.gapChecklist.priority1.map(
      (item) => `- [ ] ${item.content} → ${item.action}`,
    ),
    "",
    "### 优先级 2 — 争取补",
    "",
    ...result.gapChecklist.priority2.map(
      (item) => `- [ ] ${item.content} → ${item.action}`,
    ),
    "",
    "### 优先级 3 — 了解即可",
    "",
    ...result.gapChecklist.priority3.map(
      (item) => `- [ ] ${item.content} → ${item.action}`,
    ),
    "",
    "## 来源链接",
    "",
    ...(result.sources.length > 0
      ? result.sources.map((s) => `- [${s.title}](${s.url})`)
      : ["- （无联网来源，内容基于简历与 JD 推断）"]),
    "",
    "---",
    "",
    result.disclaimer,
  );

  return lines.join("\n");
}
