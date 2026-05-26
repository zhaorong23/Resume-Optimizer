/**
 * Prompt 验证脚本
 * 用法: npm run test:prompt [variant-id]
 */

import { optimizeResume } from "../lib/llm";
import { SAMPLE_RESUME, SAMPLE_JD, SAMPLE_FOCUS } from "../lib/fixtures";
import { listPromptVariants } from "../lib/prompts";
import { loadEnv } from "./lib/env";

async function main() {
  loadEnv();

  const variantId = process.argv[2];
  const variants = listPromptVariants();

  if (variantId && !variants.find((v) => v.id === variantId)) {
    console.error(`未知变体 "${variantId}"，可选：${variants.map((v) => v.id).join(", ")}`);
    process.exit(1);
  }

  const variant = variantId ?? "baseline";
  console.log(`测试 Prompt 变体: ${variant}\n`);

  const result = await optimizeResume(SAMPLE_RESUME, SAMPLE_JD, {
    focus: SAMPLE_FOCUS,
    promptVariant: variant,
  });

  console.log("JD 解读:", JSON.stringify(result.jdAnalysis, null, 2));
  console.log("\n匹配报告:", JSON.stringify(result.matchReport, null, 2));
  console.log("\n改写模块数:", result.sections.length);
  console.log("\n首个改写示例:");
  console.log(result.sections[0]?.rewritten);
  console.log("\n测试通过 ✓");
}

main().catch((err) => {
  console.error("测试失败:", err.message);
  process.exit(1);
});
