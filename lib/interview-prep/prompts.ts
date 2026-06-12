import { readFileSync } from "fs";
import { join } from "path";
import { TRUTH_BOUNDARY_PROMPT_RULE } from "@/lib/evidence-boundary";
import type { OptimizeResult } from "@/lib/schema";
import type { PmFlavor } from "./infer-role-type";
import type { PrepMode, PrepModule, RoleType } from "./schema";

const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  pm: "产品经理（PM）",
  ops: "产品运营",
};

const SECTION_HEADERS = {
  pm: "## A：产品经理（PM）",
  growth: "## B：PM 增长方向（子集）",
  ops: "## C：产品运营",
  general: "## 通用动机类",
} as const;

const INTERVIEW_PREP_JSON_SCHEMA = `{
  "jdOriginal": "JD 原文",
  "companyResearch": {
    "overview": "公司与产品 5 行以内速览",
    "background": [{ "label": "维度", "value": "内容" }],
    "productFeatures": ["核心功能"],
    "competitors": [{ "name": "竞品", "comparison": "差异" }],
    "teamCulture": ["团队文化信号"],
    "interviewStyle": "面试风格总结 3-5 句",
    "hotTopics": [{ "title": "话题", "url": "可选URL", "note": "说明" }]
  },
  "jdIntent": "JD 核心意图一段话",
  "responsibilityInterpretations": [{ "original": "JD 原文职责", "interpretation": "白话解读" }],
  "jdLineMatches": [{
    "jdRequirement": "JD 要求",
    "resumeEvidence": "简历依据；无则写「简历未见直接证据」",
    "matchLevel": "strong|medium|weak|unknown",
    "evidenceBoundary": "可以写|谨慎写|不能写",
    "gapOrRisk": "缺口或风险",
    "interviewStrategy": "面试策略"
  }],
  "selfIntro": "定制自我介绍，≤250字，口语化",
  "projectDeepDives": [{
    "projectName": "项目名",
    "star": { "situation": "", "task": "", "action": "", "result": "" },
    "followUps": [{ "question": "追问", "answer": "参考答法" }]
  }],
  "commonQuestions": [{
    "question": "题目",
    "referenceAnswer": "参考回答要点",
    "passAnswer": "及格答法（可选，至少2道核心题必填）",
    "strongAnswer": "加分答法（可选，至少2道核心题必填）",
    "source": "面经|专项|通用",
    "examiningPoint": "考察点"
  }],
  "designObservations": {
    "highlights": [{ "observation": "亮点", "judgment": "你的判断" }],
    "challenges": ["潜在挑战"]
  },
  "reverseQuestions": ["反问 5-8 条"],
  "gapChecklist": {
    "priority1": [{ "content": "gap", "action": "补课方式", "evidenceBoundary": "可以写|谨慎写|不能写" }],
    "priority2": [{ "content": "gap", "action": "补课方式", "evidenceBoundary": "可以写|谨慎写|不能写" }],
    "priority3": [{ "content": "gap", "action": "补课方式", "evidenceBoundary": "可以写|谨慎写|不能写" }]
  },
  "sources": [{ "title": "来源标题", "url": "真实URL" }],
  "mode": "quick|standard|deep",
  "disclaimer": "声明"
}`;

const RESEARCH_BRIEF_SCHEMA = `{
  "companyOverview": "公司定位与规模",
  "productPositioning": "产品定位",
  "interviewStyleSummary": "面经风格 3-5 句",
  "keyFacts": ["关键事实"],
  "competitorNames": ["主要竞品"]
}`;

function extractSection(content: string, header: string): string {
  const start = content.indexOf(header);
  if (start === -1) return "";

  const nextHeader = content.indexOf("\n## ", start + header.length);
  return content
    .slice(start, nextHeader === -1 ? undefined : nextHeader)
    .trim();
}

export function loadRoleTypesExcerpt(
  roleType: RoleType = "pm",
  pmFlavor: PmFlavor = "general",
): string {
  try {
    const filePath = join(
      process.cwd(),
      "lib/interview-prep/references/role-types.md",
    );
    const content = readFileSync(filePath, "utf-8");
    const sections: string[] = [];

    if (roleType === "pm") {
      const pmSection = extractSection(content, SECTION_HEADERS.pm);
      if (pmSection) sections.push(pmSection);
      if (pmFlavor === "growth") {
        const growthSection = extractSection(content, SECTION_HEADERS.growth);
        if (growthSection) sections.push(growthSection);
      }
    } else {
      const opsSection = extractSection(content, SECTION_HEADERS.ops);
      if (opsSection) sections.push(opsSection);
    }

    const generalSection = extractSection(content, SECTION_HEADERS.general);
    if (generalSection) sections.push(generalSection);

    return sections.join("\n\n").trim();
  } catch {
    return "";
  }
}

export function getModeQuestionCounts(mode: PrepMode): {
  projectCount: number;
  questionCount: number;
  reverseCount: number;
} {
  switch (mode) {
    case "quick":
      return { projectCount: 2, questionCount: 10, reverseCount: 5 };
    case "deep":
      return { projectCount: 3, questionCount: 15, reverseCount: 10 };
    default:
      return { projectCount: 3, questionCount: 12, reverseCount: 8 };
  }
}

export function buildResearchBriefSystemPrompt(): string {
  return `你是资深求职顾问，擅长从搜索结果中提炼公司与面试关键信息。
规则：
1. 只使用提供的搜索摘要，不得捏造融资额、用户数等具体数字
2. 无法从摘要确认的信息不要写入
3. 输出合法 JSON，不要 markdown 代码块

输出结构：
${RESEARCH_BRIEF_SCHEMA}`;
}

export function buildResearchBriefUserPrompt(input: {
  companyName: string;
  roleTitle?: string;
  searchContext: string;
  supplementaryNotes?: string;
}): string {
  return `目标公司：${input.companyName}
目标岗位：${input.roleTitle ?? "未指定"}

搜索摘要：
${input.searchContext}

${input.supplementaryNotes ? `用户补充资料：\n${input.supplementaryNotes}` : ""}

请提炼调研摘要 JSON。`;
}

export function buildInterviewPrepSystemPrompt(
  mode: PrepMode,
  roleType: RoleType = "pm",
  modules?: PrepModule[],
  pmFlavor: PmFlavor = "general",
): string {
  const counts = getModeQuestionCounts(mode);
  const roleExcerpt = loadRoleTypesExcerpt(roleType, pmFlavor);
  const moduleNote =
    modules && modules.length > 0
      ? `\n仅生成以下模块相关内容，其余字段可填简短占位或空数组：${modules.join(", ")}`
      : "";

  return `你是资深 HR 与产品面试教练，帮助求职者准备针对具体公司+岗位的面试。

生成规则：
1. **证据驱动**：JD 逐条匹配必须先引用简历具体经历再下判断；无证据写「简历未见直接证据」，matchLevel 用 unknown
2. **不虚构**：不得捏造简历中没有的公司、项目、数据；参考回答基于简历真实内容
3. **来源标注**：companyResearch 与面经题须引用搜索摘要中的 URL 写入 sources；无 URL 的推断在对应字段注明「基于搜索摘要，未验证原文」
4. 自我介绍 ≤250 字，口语化，突出与岗位最相关的 3 段经历
5. 项目深挖 ${counts.projectCount} 个，每个含完整 STAR + 2-3 条追问预案
6. 高频题约 ${counts.questionCount} 条：面经题 + 岗位专项题（来源标注 面经/专项/通用）
7. 反问 ${counts.reverseCount} 条，覆盖产品方向、团队、成长、决策文化
8. Gap 清单分 priority1/2/3，每项含具体补课行动，并标注 evidenceBoundary（可以写/谨慎写/不能写）
9. jdLineMatches 每行须含 evidenceBoundary，与 matchLevel 一致（strong→可以写，medium→谨慎写，weak/unknown 且无证据→不能写）
10. 至少 2 道与 JD/简历最相关的高频题须填写 passAnswer（及格答法）与 strongAnswer（加分答法）；其余题可仅 referenceAnswer

${TRUTH_BOUNDARY_PROMPT_RULE}

${mode === "quick" ? "速准版：竞品可简写，hotTopics 可 2-3 条。" : ""}
${mode === "deep" ? "深研版：竞品对比要详细，反问 10 条，延伸阅读写入 hotTopics。" : ""}

岗位方向专项题库（第五章注入）：
${roleExcerpt || "（未加载专项题库，使用通用产品题）"}
${moduleNote}

输出必须是合法 JSON：
${INTERVIEW_PREP_JSON_SCHEMA}`;
}

export function buildInterviewPrepUserPrompt(input: {
  resume: string;
  jd: string;
  companyName: string;
  roleTitle?: string;
  mode: PrepMode;
  searchContext: string;
  researchBriefJson: string;
  optimizeResult?: OptimizeResult;
  supplementaryNotes?: string;
}): string {
  const optimizeBlock = input.optimizeResult
    ? `
已有简历优化分析（请保持一致，勿重复矛盾）：
- 岗位：${input.optimizeResult.jdAnalysis.roleTitle}
- 匹配分：${input.optimizeResult.matchReport.matchScore}
- 已匹配：${input.optimizeResult.matchReport.matched.join("；")}
- Gap：${input.optimizeResult.matchReport.gaps.join("；")}
- 关键词：${input.optimizeResult.jdAnalysis.keywords.join("、")}
`
    : "";

  return `目标公司：${input.companyName}
目标岗位：${input.roleTitle ?? "未指定"}
模式：${input.mode}

JD 原文：
${input.jd}

简历：
${input.resume}
${optimizeBlock}

调研摘要（Step 1）：
${input.researchBriefJson}

搜索摘要：
${input.searchContext}

${input.supplementaryNotes ? `用户补充资料：\n${input.supplementaryNotes}` : ""}

请生成完整面试准备 JSON。jdOriginal 保留 JD 原文。mode 字段填 "${input.mode}"。`;
}

export function getRoleTypeLabel(roleType?: RoleType): string {
  return roleType ? ROLE_TYPE_LABELS[roleType] : ROLE_TYPE_LABELS.pm;
}
