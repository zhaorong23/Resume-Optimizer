# Vercel 部署指南

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
| `INTERVIEW_PREP_RATE_LIMIT` | `3` |
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

## 方式三：GitHub Actions 自动部署

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
