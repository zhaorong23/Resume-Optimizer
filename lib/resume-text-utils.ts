export const MIN_RESUME_TEXT_LENGTH = 50;

export const OCR_MAX_PAGES = Number(process.env.OCR_MAX_PAGES ?? 5);

export const OCR_ENABLED = process.env.OCR_ENABLED !== "false";

export type ParseMethod = "text" | "ocr";

export type ParseResumeResult = {
  text: string;
  method: ParseMethod;
};

export function normalizeResumeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countCjkChars(text: string): number {
  return (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
}

/** 判断直接提取的文本是否足够用于简历优化 */
export function hasEnoughExtractedText(text: string): boolean {
  const normalized = normalizeResumeText(text);
  if (normalized.length >= MIN_RESUME_TEXT_LENGTH) {
    return true;
  }

  // 短文本但中文含量尚可时仍尝试继续（避免误判）
  return normalized.length >= 30 && countCjkChars(normalized) >= 20;
}

export function assertEnoughResumeText(text: string) {
  if (text.length >= MIN_RESUME_TEXT_LENGTH) {
    return;
  }

  throw new Error(
    "未能从文件中提取足够文本（至少 50 字）。请确认文件清晰可读，或改为粘贴文本",
  );
}
