export type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

function resolveApiKey(
  primary?: string,
  fallback?: string,
  fallback2?: string,
): string {
  const apiKey = primary || fallback || fallback2;
  if (!apiKey) {
    throw new Error(
      "未配置 LLM API Key，请在环境变量中设置 LLM_API_KEY",
    );
  }
  return apiKey;
}

export function getLlmConfig(): LlmConfig {
  return {
    apiKey: resolveApiKey(
      process.env.LLM_API_KEY,
      process.env.OPENAI_API_KEY,
      process.env.DEEPSEEK_API_KEY,
    ),
    baseUrl: (
      process.env.LLM_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.deepseek.com"
    ).replace(/\/$/, ""),
    model: process.env.LLM_MODEL || "deepseek-chat",
  };
}

/** 评委模型：默认与优化模型分离，可用 JUDGE_LLM_* 覆盖 */
export function getJudgeLlmConfig(): LlmConfig & { usesSeparateJudge: boolean } {
  const hasJudgeOverride =
    Boolean(process.env.JUDGE_LLM_API_KEY) ||
    Boolean(process.env.JUDGE_LLM_BASE_URL) ||
    Boolean(process.env.JUDGE_LLM_MODEL);

  if (hasJudgeOverride) {
    return {
      apiKey: resolveApiKey(
        process.env.JUDGE_LLM_API_KEY,
        process.env.LLM_API_KEY,
        process.env.OPENAI_API_KEY,
      ),
      baseUrl: (
        process.env.JUDGE_LLM_BASE_URL ||
        process.env.LLM_BASE_URL ||
        process.env.OPENAI_BASE_URL ||
        "https://api.deepseek.com"
      ).replace(/\/$/, ""),
      model: process.env.JUDGE_LLM_MODEL || process.env.LLM_MODEL || "deepseek-chat",
      usesSeparateJudge: true,
    };
  }

  const main = getLlmConfig();
  return {
    ...main,
    model: process.env.JUDGE_LLM_MODEL || main.model,
    usesSeparateJudge: Boolean(process.env.JUDGE_LLM_MODEL),
  };
}

export function getVisionModel() {
  return (
    process.env.OCR_VISION_MODEL || "Pro/Qwen/Qwen2.5-VL-7B-Instruct"
  );
}
