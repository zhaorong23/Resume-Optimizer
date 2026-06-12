import type { RubricDimension } from "../../scripts/lib/rubric";

export const HUMAN_SCORES_STORAGE_KEY = "resume-optimizer-human-scores-v1";

export const RUBRIC_DIMENSION_META: Record<
  RubricDimension,
  { label: string; hint: string }
> = {
  structure: {
    label: "结构完整",
    hint: "JD 解读、匹配表、改写分段是否齐全可读",
  },
  evidence: {
    label: "证据忠实",
    hint: "是否虚构经历；可以写/谨慎写/不能写是否合理",
  },
  trackMatch: {
    label: "赛道匹配",
    hint: "改写是否贴合 JD（PM 勿写成运营话术等）",
  },
  actionable: {
    label: "可执行建议",
    hint: "gap 与建议是否具体、能照着改",
  },
  usability: {
    label: "可用性",
    hint: "改写后能否直接用于投递",
  },
  sourceTrust: {
    label: "来源可信",
    hint: "对简历优化可侧重匹配表是否自洽（无联网来源时给 3 分即可）",
  },
};

export const RUBRIC_DIMENSIONS = Object.keys(
  RUBRIC_DIMENSION_META,
) as RubricDimension[];

export const CALIBRATION_TARGETS = {
  dimensionMaeMax: 0.8,
  passAgreementMin: 0.8,
  dimensionAlignmentMin: 0.75,
} as const;
