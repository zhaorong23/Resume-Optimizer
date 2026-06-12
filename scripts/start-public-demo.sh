#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-3000}"
TUNNEL="${TUNNEL:-auto}"

ensure_dev_server() {
  if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}"; then
    echo "本地服务已在运行: http://localhost:${PORT}"
    return
  fi

  echo "本地服务未启动，正在后台启动 npm run dev ..."
  cd "$ROOT"
  nohup npm run dev > /tmp/resume-optimizer-dev.log 2>&1 &
  for _ in $(seq 1 30); do
    if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}"; then
      echo "本地服务已就绪: http://localhost:${PORT}"
      return
    fi
    sleep 1
  done
  echo "本地服务启动失败，请查看 /tmp/resume-optimizer-dev.log"
  exit 1
}

print_cpolar_manual() {
  echo ""
  echo "=== cpolar 手动安装（推荐国内访问）==="
  echo "1. 浏览器打开 https://www.cpolar.com/download 下载 Mac 客户端"
  echo "2. 注册后在仪表盘复制 Authtoken"
  echo "3. 终端执行: cpolar authtoken <你的token>"
  echo "4. 启动穿透: cpolar http ${PORT}"
  echo ""
}

start_cpolar() {
  if ! command -v cpolar >/dev/null 2>&1; then
    print_cpolar_manual
    echo "未检测到 cpolar，改用 localtunnel ..."
    start_localtunnel
    return
  fi
  echo "正在启动 cpolar 穿透（端口 ${PORT}）..."
  echo "复制终端里的 https://xxx.cpolar.top 链接发给国内用户。"
  exec cpolar http "$PORT"
}

start_cloudflared() {
  if ! command -v cloudflared >/dev/null 2>&1; then
    echo "未检测到 cloudflared，请执行: brew install cloudflared"
    start_localtunnel
    return
  fi
  echo "正在启动 cloudflared 穿透（端口 ${PORT}）..."
  echo "无需 IP 确认页；复制终端里的 https://xxx.trycloudflare.com 链接即可分享。"
  exec cloudflared tunnel --url "http://127.0.0.1:${PORT}"
}

start_localtunnel() {
  echo "正在启动 localtunnel（端口 ${PORT}）..."
  TUNNEL_IP="$(curl -s --max-time 8 https://loca.lt/mytunnelpassword 2>/dev/null || true)"
  if [[ -z "$TUNNEL_IP" ]]; then
    TUNNEL_IP="（获取失败，请在本机打开 https://loca.lt/mytunnelpassword ）"
  fi
  echo ""
  echo "=== localtunnel 确认页「隧道密码」==="
  echo "  ${TUNNEL_IP}"
  echo "访客首次打开 *.loca.lt 链接时，在页面输入上面的公网 IP（不是你的本机 192.168.x.x）。"
  echo "同一 WiFi/网络填一次后 7 天内不再提示；换网络或换隧道链接需重新填写。"
  echo "分享给他人时请同时发：链接 + 这个 IP。"
  echo ""
  cd "$ROOT"
  npx --yes localtunnel --port "$PORT"
}

ensure_dev_server

case "$TUNNEL" in
  cpolar) start_cpolar ;;
  cloudflared|cf) start_cloudflared ;;
  localtunnel|lt) start_localtunnel ;;
  auto)
    if command -v cpolar >/dev/null 2>&1; then
      start_cpolar
    elif command -v cloudflared >/dev/null 2>&1; then
      start_cloudflared
    else
      print_cpolar_manual
      start_localtunnel
    fi
    ;;
  *)
    echo "未知 TUNNEL=$TUNNEL，可选: auto | cpolar | cloudflared | localtunnel"
    exit 1
    ;;
esac
