import { z } from "zod";
import { extractJson, callLlm } from "../llm";
import type { LlmConfig } from "../llm-config";
import { getJudgeLlmConfig } from "../llm-config";
import { RUBRIC_DIMENSION_META, RUBRIC_DIMENSIONS } from "./constants";
import type { BlindEvalSample, HumanScoreEntry } from "./types";
import type { RubricDimension } from "../../scripts/lib/rubric";

const judgeDimensionsSchema = z.object({
  structure: z.number().min(1).max(5),
  evidence: z.number().min(1).max(5),
  trackMatch: z.number().min(1).max(5),
  actionable: z.number().min(1).max(5),
  usability: z.number().min(1).max(5),
  sourceTrust: z.number().min(1).max(5),
});

const judgeResponseSchema = z.object({
  dimensions: judgeDimensionsSchema,
  passed: z.boolean(),
  notes: z.string(),
});

const JUDGE_SYSTEM_PROMPT = `你是一名严格的简历优化产出评审员（产品经理/产品运营校招场景）。
请根据给定的 JD、原始简历与 AI 优化产出，按六个维度打 1-5 分（整数），并判断总评是否通过。

评分标准：
${RUBRIC_DIMENSIONS.map(
  (d) =>
    `- ${d}（${RUBRIC_DIMENSION_META[d].label}）：${RUBRIC_DIMENSION_META[d].hint}`,
).join("\n")}

总评通过（passed=true）条件：加权总分 ≥ 3.5 且 evidence ≥ 3。
权重：structure 15%、evidence 25%、trackMatch 20%、actionable 15%、usability 15%、sourceTrust 10%。

硬性规则：
1. 若改写虚构简历中不存在的公司、项目或夸大数字，evidence 必须 ≤ 2，passed=false。
2. 若 JD 为产品运营但改写满篇 PRD/Agent，trackMatch 应 ≤ 2。
3. 若 gapDetails 标注「不能写」但改写仍写入，evidence 必须 ≤ 2。
4. sourceTrust 对无联网来源的简历优化，通常给 3 分即可，除非匹配表明显自相矛盾。

只输出 JSON：
{
  "dimensions": { "structure": 1-5, "evidence": 1-5, "trackMatch": 1-5, "actionable": 1-5, "usability": 1-5, "sourceTrust": 1-5 },
  "passed": true/false,
  "notes": "50字内说明主要扣分点"
}`;

function formatSampleForJudge(sample: BlindEvalSample): string {
  const { output } = sample;
  const gaps =
    output.matchReport.gapDetails
      ?.map(
        (g) =>
          `- [${g.evidenceBoundary}] ${g.content}${g.suggestion ? ` → ${g.suggestion}` : ""}`,
      )
      .join("\n") ?? "（无 gapDetails）";

  const sections = output.sections
    .map((s) => `### ${s.title}\n${s.rewritten}`)
    .join("\n\n");

  return `赛道：${sample.trackLabel}

## JD
${sample.jd}

## 原始简历
${sample.resume}

## 优化产出
匹配分：${output.matchReport.matchScore}
已匹配：${output.matchReport.matched.join("；") || "无"}
缺口：${output.matchReport.gaps.join("；") || "无"}

### Gap 清单
${gaps}

### 改写正文
${sections}`;
}

async function callJudgeLlm(
  userPrompt: string,
  config: LlmConfig,
): Promise<string> {
  return callLlm(JUDGE_SYSTEM_PROMPT, userPrompt, 0.2, config);
}

export async function scoreSampleWithJudge(
  sample: BlindEvalSample,
  config?: LlmConfig,
): Promise<HumanScoreEntry> {
  const llmConfig = config ?? getJudgeLlmConfig();
  const userPrompt = formatSampleForJudge(sample);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callJudgeLlm(
        attempt === 0
          ? userPrompt
          : `${userPrompt}\n\n上次 JSON 无效，请严格输出合法 JSON。`,
        llmConfig,
      );
      const parsed = judgeResponseSchema.parse(JSON.parse(extractJson(raw)));
      return {
        opaqueId: sample.opaqueId,
        dimensions: parsed.dimensions as Record<RubricDimension, number>,
        passed: parsed.passed,
        notes: parsed.notes,
        scoredAt: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error(`评委打分失败：${sample.opaqueId}`);
}
