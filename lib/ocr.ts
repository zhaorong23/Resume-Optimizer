export type OcrProvider = "local" | "cloud";

/**
 * OCR 引擎选择：
 * - local: 本地 Tesseract（适合本地开发，免费）
 * - cloud: SiliconFlow 视觉模型（适合 Vercel 等 Serverless 部署）
 * - auto（默认）: Vercel 环境用 cloud，其他用 local
 */
export function getOcrProvider(): OcrProvider {
  const setting = process.env.OCR_PROVIDER?.toLowerCase();

  if (setting === "local") return "local";
  if (setting === "cloud") return "cloud";

  // auto
  if (process.env.VERCEL === "1" || process.env.VERCEL === "true") {
    return "cloud";
  }

  return "local";
}

export async function ocrImageBuffer(
  buffer: Buffer,
  mimeType?: string,
): Promise<string> {
  const provider = getOcrProvider();

  if (provider === "cloud") {
    const { ocrImageBufferCloud } = await import("./ocr-cloud");
    return ocrImageBufferCloud(buffer, mimeType ?? "image/png");
  }

  const { ocrImageBufferLocal } = await import("./ocr-local");
  return ocrImageBufferLocal(buffer);
}

export async function ocrPdfBuffer(buffer: Buffer): Promise<string> {
  const provider = getOcrProvider();

  if (provider === "cloud") {
    const { ocrPdfBufferCloud } = await import("./ocr-cloud");
    return ocrPdfBufferCloud(buffer);
  }

  const { ocrPdfBufferLocal } = await import("./ocr-local");
  return ocrPdfBufferLocal(buffer);
}

export function getOcrProviderLabel(): string {
  return getOcrProvider() === "cloud" ? "云端 OCR" : "本地 OCR";
}
