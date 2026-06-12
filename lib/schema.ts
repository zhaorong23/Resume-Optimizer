import { z } from "zod";
import { evidenceBoundarySchema } from "./evidence-boundary";
import { listPromptVariants } from "./prompts";

const promptVariantIds = listPromptVariants().map((v) => v.id) as [
  string,
  ...string[],
];

export const jdAnalysisSchema = z.object({
  roleTitle: z.string(),
  hardSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  keywords: z.array(z.string()),
  responsibilities: z.array(z.string()),
  priority: z.string(),
});

export const gapDetailSchema = z.object({
  content: z.string(),
  evidenceBoundary: evidenceBoundarySchema,
  suggestion: z.string().optional(),
});

export const matchReportSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matched: z.array(z.string()),
  gaps: z.array(z.string()),
  gapDetails: z.array(gapDetailSchema).optional(),
  suggestions: z.array(z.string()),
  keywordCoverage: z.number().min(0).max(100).optional(),
});

export const resumeSectionSchema = z.object({
  title: z.string(),
  original: z.string(),
  rewritten: z.string(),
});

export const evidenceAuditSchema = z.object({
  fabricatedMetrics: z.array(z.string()),
  hasFabricationRisk: z.boolean(),
  message: z.string(),
  retried: z.boolean().optional(),
  retryImproved: z.boolean().optional(),
  sanitized: z.boolean().optional(),
  sanitizedCount: z.number().optional(),
});

export const optimizeAnalyzeSchema = z.object({
  jdAnalysis: jdAnalysisSchema,
  matchReport: matchReportSchema,
  disclaimer: z.string().optional(),
});

export const optimizeRewriteSchema = z.object({
  sections: z.array(resumeSectionSchema),
  disclaimer: z.string(),
});

export const optimizeResultSchema = z.object({
  jdAnalysis: jdAnalysisSchema,
  matchReport: matchReportSchema,
  sections: z.array(resumeSectionSchema),
  disclaimer: z.string(),
  evidenceAudit: evidenceAuditSchema.optional(),
});

export type JdAnalysis = z.infer<typeof jdAnalysisSchema>;
export type GapDetail = z.infer<typeof gapDetailSchema>;
export type MatchReport = z.infer<typeof matchReportSchema>;
export type ResumeSection = z.infer<typeof resumeSectionSchema>;
export type EvidenceAudit = z.infer<typeof evidenceAuditSchema>;
export type OptimizeAnalyzeResult = z.infer<typeof optimizeAnalyzeSchema>;
export type OptimizeRewriteResult = z.infer<typeof optimizeRewriteSchema>;
export type OptimizeResult = z.infer<typeof optimizeResultSchema>;

export const optimizeRequestSchema = z.object({
  resume: z.string().min(50, "简历内容至少需要 50 个字符"),
  jd: z.string().min(30, "JD 内容至少需要 30 个字符"),
  focus: z.string().optional(),
  promptVariant: z.enum(promptVariantIds).optional(),
  stream: z.boolean().optional(),
});

export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>;
