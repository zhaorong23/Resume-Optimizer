import { inferRoleTypeFromJd } from "./interview-prep/infer-role-type";
import {
  buildAnalyzeSystemPrompt,
  buildAnalyzeUserPrompt,
  buildRewriteSystemPrompt,
  buildRewriteUserPrompt,
  getPromptVariant,
} from "./prompts";
import { getLlmConfig, type LlmConfig } from "./llm-config";
import {
  auditOptimizeEvidence,
  buildRewriteFabricationCorrectionPrompt,
  fabricationSeverity,
} from "./evidence-audit";
import { applySanitizeIfNeeded } from "./evidence-sanitize";
import {
  optimizeAnalyzeSchema,
  optimizeRewriteSchema,
  type OptimizeAnalyzeResult,
  type OptimizeResult,
  type OptimizeRewriteResult,
} from "./schema";
import type { z } from "zod";

function getConfig() {
  return getLlmConfig();
}

export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text.trim();
}

export async function callLlm(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  config?: LlmConfig,
): Promise<string> {
  const { apiKey, baseUrl, model } = config ?? getConfig();
  const url = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM 请求失败 (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM 返回内容为空");
  }

  return content;
}

export type OptimizeOptions = {
  focus?: string;
  promptVariant?: string;
  onProgress?: (step: OptimizeProgressStep) => void;
};

export type OptimizeProgressStep = "analyze" | "rewrite" | "audit";

export type OptimizeProgressEvent =
  | { type: "progress"; step: OptimizeProgressStep; message: string }
  | { type: "result"; data: OptimizeResult }
  | { type: "error"; message: string };

async function parseFromLlm<T>(
  schema: z.ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
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

function mergeOptimizeResult(
  analyze: OptimizeAnalyzeResult,
  rewrite: OptimizeRewriteResult,
): OptimizeResult {
  return {
    jdAnalysis: analyze.jdAnalysis,
    matchReport: analyze.matchReport,
    sections: rewrite.sections,
    disclaimer:
      rewrite.disclaimer ||
      analyze.disclaimer ||
      "改写仅重组你提供的内容；含 [待补充] 处需你本人填写真实数据",
  };
}

const PROGRESS_MESSAGES: Record<OptimizeProgressStep, string> = {
  analyze: "解读 JD 与计算匹配度",
  rewrite: "生成定向改写",
  audit: "可信度检查",
};

async function runRewriteWithRetry(
  resume: string,
  jd: string,
  analyze: OptimizeAnalyzeResult,
  variantId: string,
  roleType: ReturnType<typeof inferRoleTypeFromJd>,
  temperature: number,
  focus?: string,
): Promise<{
  result: OptimizeResult;
  retried?: boolean;
  retryImproved?: boolean;
}> {
  const analyzeJson = JSON.stringify(
    {
      jdAnalysis: analyze.jdAnalysis,
      matchReport: analyze.matchReport,
    },
    null,
    2,
  );

  const rewriteSystem = buildRewriteSystemPrompt(variantId, roleType);
  const rewriteUser = buildRewriteUserPrompt(resume, jd, analyzeJson, focus);

  const firstRewrite = await parseFromLlm(
    optimizeRewriteSchema,
    rewriteSystem,
    rewriteUser,
    temperature,
  );
  let result = mergeOptimizeResult(analyze, firstRewrite);
  const firstAudit = auditOptimizeEvidence(resume, result);

  if (!firstAudit.hasFabricationRisk) {
    return { result };
  }

  const correctionPrompt = buildRewriteFabricationCorrectionPrompt(
    rewriteUser,
    firstAudit,
  );
  const retryRewrite = await parseFromLlm(
    optimizeRewriteSchema,
    rewriteSystem,
    correctionPrompt,
    Math.min(temperature, 0.2),
  );

  const retryResult = mergeOptimizeResult(analyze, retryRewrite);
  const retryAudit = auditOptimizeEvidence(resume, retryResult);
  const retryImproved =
    fabricationSeverity(retryAudit) < fabricationSeverity(firstAudit);

  return {
    result: retryImproved ? retryResult : result,
    retried: true,
    retryImproved,
  };
}

export async function optimizeResume(
  resume: string,
  jd: string,
  options?: OptimizeOptions | string,
): Promise<OptimizeResult> {
  const opts = typeof options === "string" ? { focus: options } : options;
  const focus = opts?.focus;
  const promptVariant = opts?.promptVariant;
  const onProgress = opts?.onProgress;

  const variant = getPromptVariant(promptVariant);
  const variantId = variant.id;
  const roleType = inferRoleTypeFromJd(jd);

  const emit = (step: OptimizeProgressStep) => {
    onProgress?.(step);
  };

  emit("analyze");
  const analyze = await parseFromLlm(
    optimizeAnalyzeSchema,
    buildAnalyzeSystemPrompt(variantId, roleType),
    buildAnalyzeUserPrompt(resume, jd, focus),
    variant.temperature,
  );

  emit("rewrite");
  const { result, retried, retryImproved } = await runRewriteWithRetry(
    resume,
    jd,
    analyze,
    variantId,
    roleType,
    variant.temperature,
    focus,
  );

  emit("audit");
  return applySanitizeIfNeeded(resume, result, {
    retried,
    retryImproved,
  });
}

export async function optimizeResumeWithEvents(
  resume: string,
  jd: string,
  options?: OptimizeOptions,
  onEvent?: (event: OptimizeProgressEvent) => void,
): Promise<OptimizeResult> {
  const send = (step: OptimizeProgressStep) => {
    onEvent?.({
      type: "progress",
      step,
      message: PROGRESS_MESSAGES[step],
    });
  };

  try {
    const result = await optimizeResume(resume, jd, {
      ...options,
      onProgress: send,
    });
    onEvent?.({ type: "result", data: result });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    onEvent?.({ type: "error", message });
    throw error;
  }
}
