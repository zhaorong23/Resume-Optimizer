import { OCR_MAX_PAGES } from "./resume-text-utils";

export async function renderPdfPages(buffer: Buffer): Promise<Buffer[]> {
  const { getDocumentProxy, renderPageAsImage } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const pageCount = Math.min(pdf.numPages, OCR_MAX_PAGES);

  if (pageCount === 0) {
    throw new Error("PDF 没有可识别的页面");
  }

  const pages: Buffer[] = [];

  for (let page = 1; page <= pageCount; page++) {
    const imageBuffer = await renderPageAsImage(pdf, page, {
      scale: 2,
      canvasImport: () => import("@napi-rs/canvas"),
    });
    pages.push(Buffer.from(imageBuffer));
  }

  return pages;
}
