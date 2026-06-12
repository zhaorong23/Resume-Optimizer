/** 正式域名（腾讯云注册 + Cloudflare DNS） */
export const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL?.trim() ||
  "https://www.resume-optimization.top";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://app.resume-optimization.top";
