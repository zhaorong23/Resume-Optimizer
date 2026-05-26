import {
  assertEnoughResumeText,
  normalizeResumeText,
} from "./resume-text-utils";

const OCR_LANG = "chi_sim";

async function getTesseractLangConfig() {
  const chiSim = await import("@tesseract.js-data/chi_sim");
  const config = chiSim.default ?? chiSim;
  return {
    langPath: config.langPath as string,
    gzip: Boolean(config.gzip),
  };
}

async function createOcrWorker() {
  const { createWorker } = await import("tesseract.js");
  const { langPath, gzip } = await getTesseractLangConfig();

  return createWorker(OCR_LANG, undefined, {
    langPath,
    gzip,
    logger: () => {},
  });
}

async function recognizeBuffer(
  worker: Awaited<ReturnType<typeof createOcrWorker>>,
  buffer: Buffer,
): Promise<string> {
  const { data } = await worker.recognize(buffer);
  return data.text ?? "";
}

export async function ocrImageBufferLocal(buffer: Buffer): Promise<string> {
  const worker = await createOcrWorker();

  try {
    const text = await recognizeBuffer(worker, buffer);
    const normalized = normalizeResumeText(text);
    assertEnoughResumeText(normalized);
    return normalized;
  } finally {
    await worker.terminate();
  }
}

export async function ocrPdfBufferLocal(buffer: Buffer): Promise<string> {
  const { renderPdfPages } = await import("./pdf-pages");
  const pages = await renderPdfPages(buffer);

  const worker = await createOcrWorker();
  const pageTexts: string[] = [];

  try {
    for (const pageBuffer of pages) {
      const text = await recognizeBuffer(worker, pageBuffer);
      const normalized = normalizeResumeText(text);
      if (normalized) {
        pageTexts.push(normalized);
      }
    }
  } finally {
    await worker.terminate();
  }

  const merged = normalizeResumeText(pageTexts.join("\n\n"));
  assertEnoughResumeText(merged);
  return merged;
}
