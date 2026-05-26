import { getLlmConfig, getVisionModel } from "./llm-config";
import {
  assertEnoughResumeText,
  normalizeResumeText,
} from "./resume-text-utils";

const OCR_PROMPT = `请识别图片中的全部简历文字（中文和英文），按阅读顺序原样输出。
要求：
- 只输出简历正文，不要任何解释或标题
- 保持原有段落和换行
- 看不清的字用 [?] 标记，不要编造内容`;

async function recognizeImageWithVision(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const { apiKey, baseUrl } = getLlmConfig();
  const model = getVisionModel();
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text", text: OCR_PROMPT },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`云端 OCR 请求失败 (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("云端 OCR 未返回识别结果");
  }

  return content.trim();
}

export async function ocrImageBufferCloud(
  buffer: Buffer,
  mimeType = "image/png",
): Promise<string> {
  const text = await recognizeImageWithVision(buffer, mimeType);
  const normalized = normalizeResumeText(text);
  assertEnoughResumeText(normalized);
  return normalized;
}

export async function ocrPdfBufferCloud(buffer: Buffer): Promise<string> {
  const { renderPdfPages } = await import("./pdf-pages");
  const pages = await renderPdfPages(buffer);

  const pageTexts: string[] = [];
  for (const pageBuffer of pages) {
    const text = await recognizeImageWithVision(pageBuffer, "image/png");
    const normalized = normalizeResumeText(text);
    if (normalized) {
      pageTexts.push(normalized);
    }
  }

  const merged = normalizeResumeText(pageTexts.join("\n\n"));
  assertEnoughResumeText(merged);
  return merged;
}
