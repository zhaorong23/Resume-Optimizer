import { callLlm, extractJson } from "@/lib/llm";
import { inferPmFlavor } from "./infer-role-type";
import {
  buildInterviewPrepSystemPrompt,
  buildInterviewPrepUserPrompt,
  buildResearchBriefSystemPrompt,
  buildResearchBriefUserPrompt,
} from "./prompts";
import {
  formatSnippetsForPrompt,
  runCompanyResearch,
} from "./research";
import {
  interviewPrepResultSchema,
  researchBriefSchema,
  type InterviewPrepProgressEvent,
  type InterviewPrepRequest,
  type InterviewPrepResult,
  type ResearchBrief,
} from "./schema";

async function parseJsonWithRetry<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: { parse: (data: unknown) => T },
  temperature: number,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callLlm(
        systemPrompt,
        attempt === 0
          ? userPrompt
          : `${userPrompt}\n\n上次返回的 JSON 格式有误，请严格输出合法 JSON，不要包含任何额外文字。`,
        temperature,
      );
      const parsed = JSON.parse(extractJson(raw));
      return schema.parse(parsed);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("JSON 解析失败");
}

export async function generateInterviewPrep(
  input: InterviewPrepRequest,
  onProgress?: (event: InterviewPrepProgressEvent) => void,
): Promise<InterviewPrepResult> {
  const mode = input.mode ?? "standard";
  const roleType = input.roleType ?? "pm";
  const pmFlavor =
    roleType === "pm" ? inferPmFlavor(input.jd, input.roleTitle) : "general";

  const emit = (step: string, message: string) => {
    onProgress?.({ type: "progress", step, message });
  };

  emit("research", "正在调研公司与面经…");
  const searchResult = await runCompanyResearch({
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    productName: input.productName,
    mode,
  });

  const searchContext = formatSnippetsForPrompt(searchResult.snippets);
  const combinedNotes = [
    input.supplementaryNotes,
    searchResult.failed
      ? "（联网搜索不可用或结果为空，请基于简历、JD 和通用知识生成，并标注未验证来源）"
      : searchResult.fromCache
        ? "（搜索结果来自缓存）"
        : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  emit("synthesis", "正在合成调研摘要…");
  const researchBrief = await parseJsonWithRetry<ResearchBrief>(
    buildResearchBriefSystemPrompt(),
    buildResearchBriefUserPrompt({
      companyName: input.companyName,
      roleTitle: input.roleTitle,
      searchContext,
      supplementaryNotes: combinedNotes || undefined,
    }),
    researchBriefSchema,
    0.3,
  );

  emit("generate", "正在生成面试准备材料…");
  const result = await parseJsonWithRetry<InterviewPrepResult>(
    buildInterviewPrepSystemPrompt(mode, roleType, input.modules, pmFlavor),
    buildInterviewPrepUserPrompt({
      resume: input.resume,
      jd: input.jd,
      companyName: input.companyName,
      roleTitle: input.roleTitle,
      mode,
      searchContext,
      researchBriefJson: JSON.stringify(researchBrief, null, 2),
      optimizeResult: input.optimizeResult,
      supplementaryNotes: combinedNotes || undefined,
    }),
    interviewPrepResultSchema,
    0.4,
  );

  const withMeta: InterviewPrepResult = {
    ...result,
    mode,
    searchFailed: searchResult.failed,
    disclaimer:
      result.disclaimer ||
      "面试准备材料基于简历、JD 与公开信息生成，请核实事实并补充个人细节。",
  };

  onProgress?.({ type: "result", data: withMeta });
  return withMeta;
}
