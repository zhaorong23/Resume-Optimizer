import { z } from "zod";
import { evidenceBoundarySchema } from "@/lib/evidence-boundary";

function coerceToString(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((part) => (typeof part === "string" ? part.trim() : String(part)))
      .filter(Boolean)
      .join("；");
  }
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

function coerceToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[；;\n]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeResearchBriefPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const record = { ...(data as Record<string, unknown>) };

  record.companyOverview = coerceToString(record.companyOverview);
  record.productPositioning = coerceToString(record.productPositioning);
  record.interviewStyleSummary = coerceToString(record.interviewStyleSummary);
  record.keyFacts = coerceToStringArray(record.keyFacts);
  record.competitorNames = coerceToStringArray(record.competitorNames);

  return record;
}

export function normalizeInterviewPrepPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const record = { ...(data as Record<string, unknown>) };

  record.jdOriginal = coerceToString(record.jdOriginal);
  record.jdIntent = coerceToString(record.jdIntent);
  record.selfIntro = coerceToString(record.selfIntro);
  record.disclaimer = coerceToString(record.disclaimer);

  if (record.companyResearch && typeof record.companyResearch === "object") {
    const research = {
      ...(record.companyResearch as Record<string, unknown>),
    };
    research.overview = coerceToString(research.overview);
    research.interviewStyle = coerceToString(research.interviewStyle);
    record.companyResearch = research;
  }

  return record;
}

export const relaxedEvidenceBoundarySchema = z.preprocess((value) => {
  if (value === "可以写" || value === "谨慎写" || value === "不能写") return value;
  return undefined;
}, evidenceBoundarySchema.optional());

export const matchLevelSchema = z.preprocess((value) => {
  if (
    value === "strong" ||
    value === "medium" ||
    value === "weak" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}, z.enum(["strong", "medium", "weak", "unknown"]));

export const questionSourceSchema = z.preprocess((value) => {
  if (value === "面经" || value === "专项" || value === "通用") return value;
  if (typeof value === "string") {
    if (value.includes("面经")) return "面经";
    if (value.includes("专项")) return "专项";
  }
  return "通用";
}, z.enum(["面经", "专项", "通用"]));

export const prepModeCoercedSchema = z.preprocess((value) => {
  if (value === "quick" || value === "standard" || value === "deep") return value;
  return "standard";
}, z.enum(["quick", "standard", "deep"]));
