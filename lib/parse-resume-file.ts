import {
  getResumeFileExtension,
  validateResumeFileMeta,
} from "./resume-file-constants";
import {
  assertEnoughResumeText,
  hasEnoughExtractedText,
  normalizeResumeText,
  OCR_ENABLED,
  type ParseMethod,
  type ParseResumeResult,
} from "./resume-text-utils";

async function parsePdfWithTextExtraction(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const { text } = await extractText(new Uint8Array(buffer), {
    mergePages: true,
  });
  return normalizeResumeText(text);
}

async function parsePdf(buffer: Buffer): Promise<ParseResumeResult> {
  const directText = await parsePdfWithTextExtraction(buffer);

  if (hasEnoughExtractedText(directText)) {
    return { text: directText, method: "text" };
  }

  if (!OCR_ENABLED) {
    throw new Error(
      "该 PDF 可能是扫描版，未能提取文字。请粘贴文本或上传可搜索的 PDF",
    );
  }

  const { ocrPdfBuffer } = await import("./ocr");
  const ocrText = await ocrPdfBuffer(buffer);
  return { text: ocrText, method: "ocr" };
}

async function parseDocx(buffer: Buffer): Promise<ParseResumeResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const text = normalizeResumeText(result.value);
  assertEnoughResumeText(text);
  return { text, method: "text" };
}

async function parseDoc(buffer: Buffer): Promise<ParseResumeResult> {
  const WordExtractor = (await import("word-extractor")).default;
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  const text = normalizeResumeText(doc.getBody());
  assertEnoughResumeText(text);
  return { text, method: "text" };
}

async function parseImage(
  buffer: Buffer,
  filename: string,
): Promise<ParseResumeResult> {
  if (!OCR_ENABLED) {
    throw new Error("OCR 功能未启用，请粘贴文本或上传 Word/PDF");
  }

  const ext = getResumeFileExtension(filename);
  const mimeType =
    ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";

  const { ocrImageBuffer } = await import("./ocr");
  const text = await ocrImageBuffer(buffer, mimeType);
  return { text, method: "ocr" };
}

export async function parseResumeFile(
  buffer: Buffer,
  filename: string,
): Promise<ParseResumeResult> {
  validateResumeFileMeta({ name: filename, size: buffer.length });

  const ext = getResumeFileExtension(filename);

  switch (ext) {
    case "pdf":
      return parsePdf(buffer);
    case "docx":
      return parseDocx(buffer);
    case "doc":
      return parseDoc(buffer);
    case "png":
    case "jpg":
    case "jpeg":
      return parseImage(buffer, filename);
    default:
      throw new Error("不支持的文件格式，请上传 PDF、Word 或图片（PNG/JPG）");
  }
}

export type { ParseMethod, ParseResumeResult };
