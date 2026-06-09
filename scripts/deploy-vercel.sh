#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Installing Vercel CLI..."
  npm install -g vercel@54.10.2
fi

if [[ ! -f "${ROOT}/.vercel/project.json" ]]; then
  echo "Linking Vercel project..."
  vercel link --yes
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

read_env() {
  local key="$1"
  local value
  value="$(grep -E "^${key}=" "$ENV_FILE" | tail -1 | cut -d= -f2-)"
  printf '%s' "$value"
}

add_env() {
  local key="$1"
  local value="$2"
  printf '%s' "$value" | vercel env add "$key" production preview development --force 2>/dev/null || \
    printf '%s' "$value" | vercel env add "$key" production --force
}

LLM_API_KEY="$(read_env LLM_API_KEY)"
: "${LLM_API_KEY:?LLM_API_KEY missing in .env.local}"

LLM_BASE_URL="$(read_env LLM_BASE_URL)"
LLM_MODEL="$(read_env LLM_MODEL)"
TAVILY_API_KEY="$(read_env TAVILY_API_KEY)"
INTERVIEW_PREP_RATE_LIMIT="$(read_env INTERVIEW_PREP_RATE_LIMIT)"
SEARCH_CACHE_TTL_SECONDS="$(read_env SEARCH_CACHE_TTL_SECONDS)"
OCR_VISION_MODEL="$(read_env OCR_VISION_MODEL)"

add_env LLM_API_KEY "$LLM_API_KEY"
add_env LLM_BASE_URL "${LLM_BASE_URL:-https://api.siliconflow.cn}"
add_env LLM_MODEL "${LLM_MODEL:-deepseek-ai/DeepSeek-V3}"
add_env OCR_PROVIDER "cloud"
add_env OCR_ENABLED "true"
add_env OCR_MAX_PAGES "5"
add_env OCR_VISION_MODEL "${OCR_VISION_MODEL:-Pro/Qwen/Qwen2.5-VL-7B-Instruct}"

if [[ -n "$TAVILY_API_KEY" ]]; then
  add_env TAVILY_API_KEY "$TAVILY_API_KEY"
fi
add_env INTERVIEW_PREP_RATE_LIMIT "${INTERVIEW_PREP_RATE_LIMIT:-3}"
add_env SEARCH_CACHE_TTL_SECONDS "${SEARCH_CACHE_TTL_SECONDS:-86400}"

echo "Deploying to production..."
vercel deploy --prod --yes
