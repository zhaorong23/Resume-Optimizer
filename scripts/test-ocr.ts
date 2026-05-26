/**
 * OCR 功能测试
 * 用法: npm run test:ocr
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { ocrImageBuffer } from "../lib/ocr";
import { loadEnv } from "./lib/env";

async function main() {
  loadEnv();

  const { createCanvas } = await import("@napi-rs/canvas");
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 800, 400);
  ctx.fillStyle = "#000000";
  ctx.font = "32px sans-serif";
  ctx.fillText("张三 | AI产品经理", 40, 60);
  ctx.fillText("3年互联网产品经验，熟悉 LLM 应用落地", 40, 120);
  ctx.fillText("负责 AI 简历优化工具从 0 到 1 产品规划", 40, 180);

  const pngBuffer = canvas.toBuffer("image/png");
  const outDir = resolve(process.cwd(), "scripts/output");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "ocr-test.png"), pngBuffer);

  console.log("开始 OCR 测试...\n");
  const text = await ocrImageBuffer(pngBuffer);
  console.log("识别结果:\n", text);
  console.log("\nOCR 测试通过 ✓");
}

main().catch((err) => {
  console.error("OCR 测试失败:", err.message);
  process.exit(1);
});
