#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Installing Vercel CLI..."
  npm install -g vercel@54.10.2
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "请先登录 Vercel（浏览器完成授权）..."
  vercel login
fi

ENV_FILE="${ROOT}/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "缺少 .env.local，请按 .env.example 创建后再运行。"
  exit 1
fi

add_env() {
  local key="$1"
  local value="$2"
  printf '%s' "$value" | vercel env add "$key" production preview development --force 2>/dev/null || \
    printf '%s' "$value" | vercel env add "$key" production --force
}

# shellcheck disable=SC1090
source <(grep -v '^#' "$ENV_FILE" | grep '=' | sed 's/^/export /')

: "${LLM_API_KEY:?LLM_API_KEY missing in .env.local}"

add_env LLM_API_KEY "$LLM_API_KEY"
add_env LLM_BASE_URL "${LLM_BASE_URL:-https://api.siliconflow.cn}"
add_env LLM_MODEL "${LLM_MODEL:-deepseek-ai/DeepSeek-V3}"
add_env OCR_PROVIDER "cloud"
add_env OCR_ENABLED "true"
add_env OCR_MAX_PAGES "5"
add_env OCR_VISION_MODEL "${OCR_VISION_MODEL:-Pro/Qwen/Qwen2.5-VL-7B-Instruct}"

if [[ -n "${TAVILY_API_KEY:-}" ]]; then
  add_env TAVILY_API_KEY "$TAVILY_API_KEY"
fi
add_env INTERVIEW_PREP_RATE_LIMIT "${INTERVIEW_PREP_RATE_LIMIT:-3}"
add_env SEARCH_CACHE_TTL_SECONDS "${SEARCH_CACHE_TTL_SECONDS:-86400}"

echo "Deploying to production..."
vercel deploy --prod --yes
