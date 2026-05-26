import { NextRequest, NextResponse } from "next/server";
import { optimizeResume } from "@/lib/llm";
import { checkRateLimit } from "@/lib/rate-limit";
import { optimizeRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "今日优化次数已达上限（10 次），请明天再试" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = optimizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "请求参数无效" },
        { status: 400 },
      );
    }

    const result = await optimizeResume(
      parsed.data.resume,
      parsed.data.jd,
      {
        focus: parsed.data.focus,
        promptVariant: parsed.data.promptVariant,
      },
    );

    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器内部错误，请稍后重试";
    console.error("[optimize]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
