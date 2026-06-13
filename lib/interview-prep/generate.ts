import { ZodError } from "zod";
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
import {
  normalizeInterviewPrepPayload,
  normalizeResearchBriefPayload,
} from "./normalize";

function formatZodRetryHint(error: ZodError): string {
  const details = error.issues
    .slice(0, 5)
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "根对象";
      return `- 字段 ${path}：${issue.message}`;
    })
    .join("\n");
  return `上次 JSON 未通过校验，请修正以下字段后重新输出合法 JSON（不要 markdown 代码块）：\n${details}`;
}

function toUserFacingParseError(error: Error): Error {
  if (error instanceof ZodError) {
    return new Error("生成结果格式异常，请重试；若仍失败可稍后再试。");
  }
  if (error.message.includes("JSON")) {
    return new Error("模型返回格式异常，请重试。");
  }
  return error;
}

async function parseJsonWithRetry<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: { parse: (data: unknown) => T },
  temperature: number,
  normalize?: (data: unknown) => unknown,
  maxAttempts = 3,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const raw = await callLlm(
        systemPrompt,
        attempt === 0
          ? userPrompt
          : `${userPrompt}\n\n${
              lastError instanceof ZodError
                ? formatZodRetryHint(lastError)
                : "上次返回的 JSON 格式有误，请严格输出合法 JSON，不要包含任何额外文字。"
            }`,
        temperature,
      );
      const parsed = JSON.parse(extractJson(raw));
      const normalized = normalize ? normalize(parsed) : parsed;
      return schema.parse(normalized);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError instanceof ZodError) {
        console.error(
          "[interview-prep] schema validation failed:",
          JSON.stringify(lastError.issues),
        );
      }
    }
  }

  throw toUserFacingParseError(lastError ?? new Error("JSON 解析失败"));
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
    normalizeResearchBriefPayload,
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
    normalizeInterviewPrepPayload,
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
