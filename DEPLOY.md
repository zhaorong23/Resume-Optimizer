# Vercel 部署指南

> 自定义域名（腾讯云 + Cloudflare）：见仓库根目录 [DEPLOY-CF.md](../DEPLOY-CF.md)  
> 正式域名：`www.resume-optimization.top`（作品集）、`app.resume-optimization.top`（本应用）

## 方式一：网页导入（推荐，约 5 分钟）

1. 打开 [vercel.com/new](https://vercel.com/new)，用 GitHub 登录
2. Import 仓库 `zhaorong23/Resume-Optimizer`
3. 在 **Environment Variables** 添加（Production + Preview）：

| 变量 | 值 |
|------|-----|
| `LLM_API_KEY` | SiliconFlow Key |
| `LLM_BASE_URL` | `https://api.siliconflow.cn` |
| `LLM_MODEL` | `deepseek-ai/DeepSeek-V3` |
| `OCR_PROVIDER` | `cloud` |
| `OCR_ENABLED` | `true` |
| `OCR_MAX_PAGES` | `5` |
| `OCR_VISION_MODEL` | `Pro/Qwen/Qwen2.5-VL-7B-Instruct` |
| `TAVILY_API_KEY` | Tavily Key |
| `INTERVIEW_PREP_RATE_LIMIT` | `0`（0 = 不限制面试准备次数） |
| `SEARCH_CACHE_TTL_SECONDS` | `86400` |

4. 点击 **Deploy**，完成后复制 `https://xxx.vercel.app` 链接分享

## 方式二：CLI 一键脚本

```bash
# 1. 在 https://vercel.com/account/tokens 创建 Token
export VERCEL_TOKEN=你的token

# 2. 登录并部署
cd resume-optimizer
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

## 方式三：国内穿透 Demo（cpolar / localtunnel）

Vercel 默认域名在国内可能打不开。可本地启动穿透，把 `localhost:3000` 暴露为公网 HTTPS：

```bash
cd resume-optimizer
npm run demo:public
```

- **cpolar**（国内更稳）：从 [cpolar.com/download](https://www.cpolar.com/download) 安装客户端 → `cpolar authtoken <token>` → `TUNNEL=cpolar npm run demo:public`
- **cloudflared**（无 IP 确认页）：`brew install cloudflared` 后 `TUNNEL=cloudflared npm run demo:public`，输出 `https://xxx.trycloudflare.com`
- **localtunnel**（零安装备用）：输出 `https://xxx.loca.lt`，并打印「隧道密码」（你电脑的公网 IPv4）

**localtunnel 确认页**：访客首次打开链接会要求输入 IP，填启动穿透那台机器的公网 IP（脚本会打印；或在本机打开 https://loca.lt/mytunnelpassword 查看）。分享时务必 **链接 + IP 一起发**。国内对外演示更推荐 cpolar，无此步骤。

注意：穿透链接在进程结束后失效；演示时保持电脑不休眠。

## 方式四：GitHub Actions 自动部署

在 GitHub 仓库 Settings → Secrets 添加：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`（Vercel 项目 Settings → General）
- `VERCEL_PROJECT_ID`（同上）

推送到 `main` 后自动部署。

## 部署后验证

1. 打开首页
2. 粘贴简历 + JD → 开始优化
3. 填写公司名 → 生成面试准备
4. 上传 PDF/图片测试 OCR
