export function getLlmConfig() {
  const apiKey =
    process.env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error(
      "未配置 LLM API Key，请在环境变量中设置 LLM_API_KEY",
    );
  }

  const baseUrl = (
    process.env.LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.deepseek.com"
  ).replace(/\/$/, "");

  const model = process.env.LLM_MODEL || "deepseek-chat";

  return { apiKey, baseUrl, model };
}

export function getVisionModel() {
  return (
    process.env.OCR_VISION_MODEL || "Pro/Qwen/Qwen2.5-VL-7B-Instruct"
  );
}
