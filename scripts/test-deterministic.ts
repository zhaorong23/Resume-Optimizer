/**
 * 检查一：发版前自动脚本（无需 API Key）
 *
 * 发版前亲手勾选清单（检查三）：
 * - [ ] 简历或 JD 太短时，按钮是灰的、点不了
 * - [ ] 走通「只优化简历」：JD 解读 → 匹配分 → 改写对比 → 能复制/下载
 * - [ ] 走通「面试准备」：填公司名 → 生成 → 各章节有内容 → 能导出 Markdown
 * - [ ] 没填公司名时，有明确提示
 * - [ ] 手机或微信里打开，首屏能看清、不用横滑
 * - [ ] 岗位方向选「产品运营」后，下方出现用户/活动/内容等提示
 * - [ ] 结果页能看到本次是「产品经理」还是「产品运营」赛道
 *
 * 完整清单见 docs/TESTING.md
 */
import { readFileSync } from "fs";
import { join } from "path";
import { evidenceBoundarySchema } from "../lib/evidence-boundary";
import { inferPmFlavor } from "../lib/interview-prep/infer-role-type";
import { loadRoleTypesExcerpt } from "../lib/interview-prep/prompts";
import {
  gapItemSchema,
  interviewQuestionSchema,
  roleTypeSchema,
} from "../lib/interview-prep/schema";
import { gapDetailSchema } from "../lib/schema";
import {
  GOLDEN_FIXTURES,
  OPS_EVAL_FIXTURES,
  OPT_OPS_A_QIJI,
  OPT_PM_A_JDONG,
  PM_EVAL_FIXTURES,
  WEAK_FIXTURE_SMOKE_IDS,
} from "../lib/fixtures";
import { scoreOptimize } from "./lib/rubric";
import {
  buildSampleComparisons,
  summarizeCalibration,
} from "../lib/eval/compare";
import type {
  EvalManifestFull,
  HumanScoresFile,
} from "../lib/eval/types";
import { getEvalOptimizeFixtures } from "../lib/eval/fixtures";
import {
  auditOptimizeEvidence,
  buildFabricationCorrectionPrompt,
  extractMetricSnippets,
  fabricationSeverity,
} from "../lib/evidence-audit";
import {
  buildMetricWhitelistBlock,
  sanitizeOptimizeResult,
} from "../lib/evidence-sanitize";

type TestCase = {
  id: string;
  title: string;
  run: () => void;
};

const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function readProjectFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf-8");
}

const tests: TestCase[] = [
  {
    id: "S-01",
    title: "roleTypeSchema 仅接受 pm/ops",
    run: () => {
      assert(roleTypeSchema.safeParse("pm").success, "pm 应通过校验");
      assert(roleTypeSchema.safeParse("ops").success, "ops 应通过校验");
      assert(!roleTypeSchema.safeParse("biz").success, "biz 应校验失败");
      assert(!roleTypeSchema.safeParse("growth").success, "growth 应校验失败");
    },
  },
  {
    id: "S-02",
    title: "增长 JD 识别为 growth flavor",
    run: () => {
      assert(
        inferPmFlavor("负责用户增长与留存优化", "增长产品经理") === "growth",
        "增长产品经理 JD 应识别为 growth",
      );
    },
  },
  {
    id: "S-03",
    title: "产品运营 JD 不误判为 growth",
    run: () => {
      assert(
        inferPmFlavor("负责用户分层与活动运营", "产品运营") === "general",
        "产品运营 JD 不应识别为 growth",
      );
    },
  },
  {
    id: "S-04",
    title: "PM 赛道注入 A 章",
    run: () => {
      const excerpt = loadRoleTypesExcerpt("pm", "general");
      assert(excerpt.includes("## A：产品经理（PM）"), "应含 PM 章节");
      assert(excerpt.includes("产品设计类"), "应含产品设计类题库");
      assert(!excerpt.includes("## C：产品运营"), "不应含运营章节");
    },
  },
  {
    id: "S-05",
    title: "运营赛道注入 C 章",
    run: () => {
      const excerpt = loadRoleTypesExcerpt("ops");
      assert(excerpt.includes("## C：产品运营"), "应含运营章节");
      assert(excerpt.includes("用户运营类"), "应含用户运营类题库");
      assert(!excerpt.includes("## A：产品经理（PM）"), "不应含 PM 章节");
    },
  },
  {
    id: "S-06",
    title: "增长向 PM 额外注入 B 章",
    run: () => {
      const excerpt = loadRoleTypesExcerpt("pm", "growth");
      assert(excerpt.includes("## B：PM 增长方向（子集）"), "应含增长子集章节");
      assert(
        excerpt.includes("AARRR") || excerpt.includes("增长思维"),
        "应含增长思维题库",
      );
    },
  },
  {
    id: "S-07",
    title: "D 章商业策略不再注入",
    run: () => {
      const pmExcerpt = loadRoleTypesExcerpt("pm", "growth");
      const opsExcerpt = loadRoleTypesExcerpt("ops");
      assert(!pmExcerpt.includes("商业策略 / BD"), "PM 题库不应含商业策略");
      assert(!opsExcerpt.includes("商业策略 / BD"), "运营题库不应含商业策略");
    },
  },
  {
    id: "S-08",
    title: "UI 文案无旧四类选项",
    run: () => {
      const resumeInput = readProjectFile("components/ResumeInput.tsx");
      assert(
        !resumeInput.includes('value="growth"'),
        "ResumeInput 不应再有 growth 选项",
      );
      assert(
        !resumeInput.includes('value="biz"'),
        "ResumeInput 不应再有 biz 选项",
      );
      assert(
        resumeInput.includes("求职赛道（影响面试高频题风格）"),
        "应有求职赛道 label",
      );
    },
  },
  {
    id: "S-10",
    title: "truth-boundary schema 与 prompt 规则",
    run: () => {
      assert(
        evidenceBoundarySchema.safeParse("可以写").success,
        "可以写 应通过",
      );
      assert(
        gapDetailSchema.safeParse({
          content: "缺 B 端经验",
          evidenceBoundary: "不能写",
        }).success,
        "gapDetail 应支持 evidenceBoundary",
      );
      assert(
        gapItemSchema.safeParse({
          content: "gap",
          action: "补课",
          evidenceBoundary: "谨慎写",
        }).success,
        "gapItem 应支持 evidenceBoundary",
      );
      const interviewPrompts = readProjectFile(
        "lib/interview-prep/prompts.ts",
      );
      const optimizePrompts = readProjectFile("lib/prompts.ts");
      const evidenceBoundaryMd = readProjectFile("lib/evidence-boundary.ts");
      assert(
        interviewPrompts.includes("TRUTH_BOUNDARY_PROMPT_RULE") &&
          interviewPrompts.includes("passAnswer"),
        "面试 prompt 应注入证据边界与答法对比规则",
      );
      assert(
        optimizePrompts.includes("gapDetails") &&
          optimizePrompts.includes("TRUTH_BOUNDARY_PROMPT_RULE"),
        "优化 prompt 应含 gapDetails 与证据边界",
      );
      assert(
        optimizePrompts.includes("先分析、后改写") ||
          evidenceBoundaryMd.includes("先分析、后改写"),
        "优化 prompt 应含先分析后改写工作流",
      );
      assert(
        evidenceBoundaryMd.includes("禁止编造任何数字"),
        "证据边界应含反捏造规则",
      );
      assert(
        evidenceBoundaryMd.includes("REWRITE_SELF_CHECK") ||
          evidenceBoundaryMd.includes("输出 JSON 前必做自检"),
        "证据边界应含输出前自检清单",
      );
    },
  },
  {
    id: "S-14",
    title: "改写后数字审计可检出捏造",
    run: () => {
      const resume = "负责活动运营，粉丝 1200+，无其他数据。";
      const audit = auditOptimizeEvidence(resume, {
        jdAnalysis: {
          roleTitle: "运营",
          hardSkills: [],
          softSkills: [],
          keywords: [],
          responsibilities: [],
          priority: "",
        },
        matchReport: {
          matchScore: 70,
          matched: [],
          gaps: [],
          suggestions: [],
        },
        sections: [
          {
            title: "经历",
            original: "粉丝 1200+",
            rewritten: "粉丝 1200+，DAU 提升 30%",
          },
        ],
        disclaimer: "",
      });
      assert(audit.hasFabricationRisk, "应检出 30% 无依据");
      assert(
        extractMetricSnippets("留存 +9.26%").length > 0,
        "应能提取百分比",
      );
      const correction = buildFabricationCorrectionPrompt("base", audit);
      assert(
        correction.includes("系统自动复检") &&
          correction.includes("30%"),
        "捏造重试 prompt 应含问题与修正要求",
      );
      assert(
        fabricationSeverity({ ...audit, fabricatedMetrics: [] }) <
          fabricationSeverity(audit),
        "severity 应在风险消除后下降",
      );
    },
  },
  {
    id: "S-15",
    title: "白名单注入与确定性清洗",
    run: () => {
      const resume = "负责活动运营，粉丝 1200+，留存提升 9.26%。";
      const whitelist = buildMetricWhitelistBlock(resume);
      assert(
        whitelist.includes("9.26%") && whitelist.includes("1200"),
        "白名单应含原文数字",
      );
      const optimizePrompts = readProjectFile("lib/prompts.ts");
      assert(
        optimizePrompts.includes("buildMetricWhitelistBlock"),
        "user prompt 应注入数字白名单",
      );

      const badResult = {
        jdAnalysis: {
          roleTitle: "运营",
          hardSkills: [],
          softSkills: [],
          keywords: [],
          responsibilities: [],
          priority: "",
        },
        matchReport: {
          matchScore: 70,
          matched: [],
          gaps: ["缺乏 B 端 SaaS 产品经验"],
          gapDetails: [
            {
              content: "主导 B 端 SaaS 产品经验",
              evidenceBoundary: "不能写" as const,
            },
          ],
          suggestions: [],
        },
        sections: [
          {
            title: "经历",
            original: "粉丝 1200+",
            rewritten:
              "粉丝 1200+，DAU 提升 30%\n主导 B 端 SaaS 产品从0到1上线",
          },
        ],
        disclaimer: "",
      };

      const { result: cleaned, stats } = sanitizeOptimizeResult(
        resume,
        badResult,
      );
      assert(stats.metricsReplaced >= 1, "应替换无依据 30%");
      assert(
        !cleaned.sections[0].rewritten.includes("30%"),
        "清洗后不应含 30%",
      );
      assert(stats.linesRemoved >= 1, "应移除缺口泄漏行");
      const after = auditOptimizeEvidence(resume, cleaned);
      assert(!after.hasFabricationRisk, "清洗后应通过审计");
    },
  },
  {
    id: "S-16",
    title: "Rubric 捏造硬门禁与两步 prompt",
    run: () => {
      assert(WEAK_FIXTURE_SMOKE_IDS.length === 3, "弱匹配冒烟应为 3 条");

      const prompts = readProjectFile("lib/prompts.ts");
      assert(
        prompts.includes("buildAnalyzeSystemPrompt") &&
          prompts.includes("buildRewriteSystemPrompt"),
        "应含 analyze/rewrite 分步 prompt",
      );

      const baseResult = {
        jdAnalysis: {
          roleTitle: "PM",
          hardSkills: [],
          softSkills: [],
          keywords: [],
          responsibilities: [],
          priority: "",
        },
        matchReport: {
          matchScore: 60,
          matched: [],
          gaps: [],
          gapDetails: [{ content: "缺口", evidenceBoundary: "不能写" as const }],
          suggestions: ["建议"],
        },
        sections: [
          {
            title: "经历",
            original: "参与需求",
            rewritten: "主导千万用户产品",
          },
        ],
        disclaimer: "",
        evidenceAudit: {
          fabricatedMetrics: [],
          hasFabricationRisk: false,
          message: "ok",
        },
      };

      const failAudit = scoreOptimize(
        {
          ...baseResult,
          evidenceAudit: {
            fabricatedMetrics: ["30%"],
            hasFabricationRisk: true,
            message: "捏造",
          },
        },
        OPT_PM_A_JDONG,
      );
      assert(!failAudit.passed, "审计有风险应 FAIL");

      const failMustNot = scoreOptimize(baseResult, OPT_PM_A_JDONG);
      assert(!failMustNot.passed, "mustNot 命中应 FAIL");
      assert(
        failMustNot.notes.some((n) => n.includes("禁止虚构")),
        "应注明 mustNot",
      );
    },
  },
  {
    id: "S-17",
    title: "运营评测 fixture 含 mustKeep/mustNot",
    run: () => {
      assert(OPS_EVAL_FIXTURES.length === 4, "运营评测应为 4 条");
      for (const fixture of OPS_EVAL_FIXTURES) {
        assert(
          (fixture.mustKeep?.length ?? 0) >= 5,
          `${fixture.id} 应配置 mustKeep`,
        );
        assert(
          (fixture.mustNot?.length ?? 0) >= 3,
          `${fixture.id} 应配置 mustNot`,
        );
        assert(
          fixture.matchTier === "strong" || fixture.matchTier === "weak",
          `${fixture.id} 应有 matchTier`,
        );
      }
      assert(
        OPT_OPS_A_QIJI.mustNot?.includes("潜空间") === true,
        "弱匹配 A×奇绩 应禁潜空间捏造",
      );
      const weakOpsMustNot = scoreOptimize(
        {
          jdAnalysis: {
            roleTitle: "运营",
            hardSkills: [],
            softSkills: [],
            keywords: [],
            responsibilities: [],
            priority: "",
          },
          matchReport: {
            matchScore: 55,
            matched: [],
            gaps: [],
            gapDetails: [],
            suggestions: [],
          },
          sections: [
            {
              title: "经历",
              original: "小红书运营",
              rewritten: "主导潜空间大模型系列活动运营",
            },
          ],
          disclaimer: "",
        },
        OPT_OPS_A_QIJI,
      );
      assert(!weakOpsMustNot.passed, "运营 mustNot 命中应 FAIL");
    },
  },
  {
    id: "S-11",
    title: "answer-quality schema 支持及格/加分答法",
    run: () => {
      assert(
        interviewQuestionSchema.safeParse({
          question: "如何提升渗透率？",
          referenceAnswer: "要点",
          passAnswer: "及格框架",
          strongAnswer: "加分案例",
          source: "专项",
        }).success,
        "interviewQuestion 应支持 passAnswer/strongAnswer",
      );
      const interviewPrompts = readProjectFile(
        "lib/interview-prep/prompts.ts",
      );
      assert(
        interviewPrompts.includes("passAnswer"),
        "面试 prompt JSON 应含 passAnswer",
      );
    },
  },
  {
    id: "S-12",
    title: "PM 评测 fixture 3×3 全交叉入库",
    run: () => {
      assert(PM_EVAL_FIXTURES.length === 9, "应有 9 条 PM 配对");
      const expectedIds = [
        "OPT_PM_A_JDONG",
        "OPT_PM_A_FEISHU",
        "OPT_PM_A_XIAOMI",
        "OPT_PM_B_JDONG",
        "OPT_PM_B_FEISHU",
        "OPT_PM_B_XIAOMI",
        "OPT_PM_C_JDONG",
        "OPT_PM_C_FEISHU",
        "OPT_PM_C_XIAOMI",
      ];
      for (const id of expectedIds) {
        const fixture = PM_EVAL_FIXTURES.find((f) => f.id === id);
        assert(fixture !== undefined, `缺少 ${id}`);
        assert(fixture!.roleType === "pm", `${id} 应为 pm 赛道`);
        assert(
          (fixture!.mustKeep?.length ?? 0) > 0,
          `${id} 应配置 mustKeep`,
        );
      }
      assert(GOLDEN_FIXTURES.length === 16, "GOLDEN_FIXTURES 应为 16 条");
    },
  },
  {
    id: "S-13",
    title: "盲评比对逻辑与评测主集",
    run: () => {
      assert(getEvalOptimizeFixtures().length === 14, "盲评主集应为 14 条");
      const manifest: EvalManifestFull = {
        batchId: "test-batch",
        generatedAt: new Date().toISOString(),
        promptVariant: "baseline",
        samples: [
          {
            opaqueId: "SAMPLE-01",
            fixtureId: "OPT_PM_C_XIAOMI",
            autoRubric: {
              fixtureId: "OPT_PM_C_XIAOMI",
              dimensions: {
                structure: 4,
                evidence: 4,
                trackMatch: 4,
                actionable: 4,
                usability: 4,
                sourceTrust: 3,
              },
              total: 3.95,
              passed: true,
              notes: [],
            },
          },
        ],
      };
      const human: HumanScoresFile = {
        batchId: "test-batch",
        exportedAt: new Date().toISOString(),
        scores: [
          {
            opaqueId: "SAMPLE-01",
            dimensions: {
              structure: 4,
              evidence: 3,
              trackMatch: 4,
              actionable: 4,
              usability: 4,
              sourceTrust: 3,
            },
            passed: true,
            notes: "",
            scoredAt: new Date().toISOString(),
          },
        ],
      };
      const comparisons = buildSampleComparisons(manifest, human);
      assert(comparisons.length === 1, "应生成 1 条比对");
      const summary = summarizeCalibration(comparisons, "test-batch");
      assert(summary.sampleCount === 1, "summary 样本数应为 1");
    },
  },
  {
    id: "S-09",
    title: "产品定位文案已更新",
    run: () => {
      const productMd = readProjectFile("PRODUCT.md");
      const layout = readProjectFile("app/layout.tsx");
      const homeClient = readProjectFile("components/HomeClient.tsx");
      const target = "产品经理 & 产品运营";
      assert(productMd.includes(target), "PRODUCT.md 应含双主线定位");
      assert(layout.includes(target), "layout metadata 应含双主线定位");
      assert(homeClient.includes(target), "首页 hero 应含双主线定位");
      assert(!homeClient.includes("商业策略"), "首页不应出现商业策略");
    },
  },
];

console.log("检查一：确定性测试\n");

for (const test of tests) {
  try {
    test.run();
    console.log(`✓ ${test.id} ${test.title}`);
  } catch (error) {
    failures.push(
      `${test.id} ${test.title}: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.log(`✗ ${test.id} ${test.title}`);
  }
}

if (failures.length > 0) {
  console.log("\n失败项：");
  for (const failure of failures) console.log(`- ${failure}`);
  process.exit(1);
}

console.log(`\n全部通过（${tests.length}/${tests.length}）`);
