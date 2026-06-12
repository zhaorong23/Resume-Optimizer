import { z } from "zod";
import { evidenceBoundarySchema } from "@/lib/evidence-boundary";
import { optimizeResultSchema } from "@/lib/schema";

export const roleTypeSchema = z.enum(["pm", "ops"]);
export const interviewRoundSchema = z.enum(["hr", "biz", "final", "all"]);
export const prepModeSchema = z.enum(["quick", "standard", "deep"]);
export const prepModuleSchema = z.enum([
  "intro",
  "star",
  "gaps",
  "questions",
  "reverse",
  "research",
  "design",
]);

export const sourceSchema = z.object({
  title: z.string(),
  url: z.string(),
});

export const companyResearchSchema = z.object({
  overview: z.string(),
  background: z.array(
    z.object({ label: z.string(), value: z.string() }),
  ),
  productFeatures: z.array(z.string()),
  competitors: z.array(
    z.object({ name: z.string(), comparison: z.string() }),
  ),
  teamCulture: z.array(z.string()),
  interviewStyle: z.string(),
  hotTopics: z.array(
    z.object({
      title: z.string(),
      url: z.string().optional(),
      note: z.string(),
    }),
  ),
});

export const jdLineMatchSchema = z.object({
  jdRequirement: z.string(),
  resumeEvidence: z.string(),
  matchLevel: z.enum(["strong", "medium", "weak", "unknown"]),
  evidenceBoundary: evidenceBoundarySchema.optional(),
  gapOrRisk: z.string(),
  interviewStrategy: z.string(),
});

export const projectDeepDiveSchema = z.object({
  projectName: z.string(),
  star: z.object({
    situation: z.string(),
    task: z.string(),
    action: z.string(),
    result: z.string(),
  }),
  followUps: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
});

export const interviewQuestionSchema = z.object({
  question: z.string(),
  referenceAnswer: z.string(),
  passAnswer: z.string().optional(),
  strongAnswer: z.string().optional(),
  source: z.enum(["面经", "专项", "通用"]),
  examiningPoint: z.string().optional(),
});

export const gapItemSchema = z.object({
  content: z.string(),
  action: z.string(),
  evidenceBoundary: evidenceBoundarySchema.optional(),
});

export const interviewPrepResultSchema = z.object({
  jdOriginal: z.string(),
  companyResearch: companyResearchSchema,
  jdIntent: z.string(),
  responsibilityInterpretations: z.array(
    z.object({
      original: z.string(),
      interpretation: z.string(),
    }),
  ),
  jdLineMatches: z.array(jdLineMatchSchema),
  selfIntro: z.string(),
  projectDeepDives: z.array(projectDeepDiveSchema),
  commonQuestions: z.array(interviewQuestionSchema),
  designObservations: z.object({
    highlights: z.array(
      z.object({ observation: z.string(), judgment: z.string() }),
    ),
    challenges: z.array(z.string()),
  }),
  reverseQuestions: z.array(z.string()),
  gapChecklist: z.object({
    priority1: z.array(gapItemSchema),
    priority2: z.array(gapItemSchema),
    priority3: z.array(gapItemSchema),
  }),
  sources: z.array(sourceSchema),
  mode: prepModeSchema,
  searchFailed: z.boolean().optional(),
  disclaimer: z.string(),
});

export const researchBriefSchema = z.object({
  companyOverview: z.string(),
  productPositioning: z.string(),
  interviewStyleSummary: z.string(),
  keyFacts: z.array(z.string()),
  competitorNames: z.array(z.string()),
});

export const interviewPrepRequestSchema = z.object({
  resume: z.string().min(50, "简历内容至少需要 50 个字符"),
  jd: z.string().min(30, "JD 内容至少需要 30 个字符"),
  companyName: z.string().min(2, "请填写目标公司名称"),
  roleTitle: z.string().optional(),
  productName: z.string().optional(),
  roleType: roleTypeSchema.optional(),
  interviewRound: interviewRoundSchema.optional(),
  mode: prepModeSchema.optional(),
  optimizeResult: optimizeResultSchema.optional(),
  supplementaryNotes: z.string().optional(),
  modules: z.array(prepModuleSchema).optional(),
  stream: z.boolean().optional(),
});

export type RoleType = z.infer<typeof roleTypeSchema>;
export type PrepMode = z.infer<typeof prepModeSchema>;
export type PrepModule = z.infer<typeof prepModuleSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type CompanyResearch = z.infer<typeof companyResearchSchema>;
export type JdLineMatch = z.infer<typeof jdLineMatchSchema>;
export type ProjectDeepDive = z.infer<typeof projectDeepDiveSchema>;
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type GapItem = z.infer<typeof gapItemSchema>;
export type InterviewPrepResult = z.infer<typeof interviewPrepResultSchema>;
export type ResearchBrief = z.infer<typeof researchBriefSchema>;
export type InterviewPrepRequest = z.infer<typeof interviewPrepRequestSchema>;

export type InterviewPrepProgressEvent =
  | { type: "progress"; step: string; message: string }
  | { type: "result"; data: InterviewPrepResult }
  | { type: "error"; message: string };
