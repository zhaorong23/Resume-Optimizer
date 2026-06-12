import { NextRequest, NextResponse } from "next/server";
import { optimizeResume, optimizeResumeWithEvents } from "@/lib/llm";
import { checkRateLimit } from "@/lib/rate-limit";
import { optimizeRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

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

    const input = parsed.data;

    if (input.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (payload: unknown) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
            );
          };

          try {
            await optimizeResumeWithEvents(
              input.resume,
              input.jd,
              {
                focus: input.focus,
                promptVariant: input.promptVariant,
              },
              send,
            );
            controller.close();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "优化失败，请稍后重试";
            send({ type: "error", message });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-RateLimit-Remaining": String(remaining),
        },
      });
    }

    const result = await optimizeResume(input.resume, input.jd, {
      focus: input.focus,
      promptVariant: input.promptVariant,
    });

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
