import { NextRequest, NextResponse } from "next/server";
import { parseResumeFile } from "@/lib/parse-resume-file";
import { getOcrProvider } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "请上传简历文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, method } = await parseResumeFile(buffer, file.name);

    return NextResponse.json({
      text,
      filename: file.name,
      charCount: text.length,
      parseMethod: method,
      ocrProvider: method === "ocr" ? getOcrProvider() : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "文件解析失败，请稍后重试";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
