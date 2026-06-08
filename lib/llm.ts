import { getPromptVariant } from "./prompts";
import { getLlmConfig } from "./llm-config";
import { optimizeResultSchema, type OptimizeResult } from "./schema";

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
): Promise<string> {
  const { apiKey, baseUrl, model } = getConfig();
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
};

export async function optimizeResume(
  resume: string,
  jd: string,
  options?: OptimizeOptions | string,
): Promise<OptimizeResult> {
  const focus = typeof options === "string" ? options : options?.focus;
  const promptVariant =
    typeof options === "string" ? undefined : options?.promptVariant;

  const variant = getPromptVariant(promptVariant);
  const userPrompt = variant.buildUserPrompt(resume, jd, focus);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callLlm(
        variant.systemPrompt,
        attempt === 0
          ? userPrompt
          : `${userPrompt}\n\n上次返回的 JSON 格式有误，请严格输出合法 JSON，不要包含任何额外文字。`,
        variant.temperature,
      );
      const parsed = JSON.parse(extractJson(raw));
      return optimizeResultSchema.parse(parsed);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("简历优化失败");
}
