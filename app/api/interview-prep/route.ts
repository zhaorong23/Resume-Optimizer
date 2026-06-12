import { NextRequest, NextResponse } from "next/server";
import { generateInterviewPrep } from "@/lib/interview-prep/generate";
import { interviewPrepRequestSchema } from "@/lib/interview-prep/schema";
import { checkRateLimit, getDailyLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, remaining } = checkRateLimit(ip, "interview-prep");

    const dailyLimit = getDailyLimit("interview-prep");
    if (!allowed && dailyLimit > 0) {
      return NextResponse.json(
        {
          error: `今日面试准备次数已达上限（${dailyLimit} 次），请明天再试`,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = interviewPrepRequestSchema.safeParse(body);

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
            await generateInterviewPrep(input, (event) => {
              send(event);
            });
            controller.close();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "面试准备生成失败";
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

    const result = await generateInterviewPrep(input);

    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "服务器内部错误，请稍后重试";
    console.error("[interview-prep]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
