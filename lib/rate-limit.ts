const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 24 * 60 * 60 * 1000;

export function getDailyLimit(bucket: "optimize" | "interview-prep"): number {
  if (bucket === "interview-prep") {
    const configured = Number(process.env.INTERVIEW_PREP_RATE_LIMIT ?? "0");
    if (!Number.isFinite(configured) || configured <= 0) return 0;
    return configured;
  }
  return 10;
}

function getBucketKey(ip: string, bucket: "optimize" | "interview-prep"): string {
  return `${bucket}:${ip}`;
}

export function checkRateLimit(
  ip: string,
  bucket: "optimize" | "interview-prep" = "optimize",
): { allowed: boolean; remaining: number } {
  const dailyLimit = getDailyLimit(bucket);
  if (dailyLimit <= 0) {
    return { allowed: true, remaining: -1 };
  }

  const now = Date.now();
  const key = getBucketKey(ip, bucket);
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: dailyLimit - 1 };
  }

  if (record.count >= dailyLimit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: dailyLimit - record.count };
}
