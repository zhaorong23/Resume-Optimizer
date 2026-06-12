import type { OptimizeResult } from "../schema";
import type { RubricDimension, RubricReport } from "../../scripts/lib/rubric";

export type BlindEvalSample = {
  opaqueId: string;
  trackLabel: "产品经理" | "产品运营";
  jd: string;
  resume: string;
  output: OptimizeResult;
};

export type EvalManifestBlind = {
  batchId: string;
  generatedAt: string;
  promptVariant: string;
  sampleCount: number;
  samples: BlindEvalSample[];
};

export type EvalManifestFull = {
  batchId: string;
  generatedAt: string;
  promptVariant: string;
  samples: Array<{
    opaqueId: string;
    fixtureId: string;
    matchTier?: string;
    autoRubric: RubricReport;
  }>;
};

export type HumanDimensionScores = Record<RubricDimension, number>;

export type HumanScoreEntry = {
  opaqueId: string;
  dimensions: HumanDimensionScores;
  passed: boolean;
  notes: string;
  scoredAt: string;
};

export type HumanScoresFile = {
  batchId: string;
  exportedAt: string;
  /** human=网页手打；llm-judge=评委模型脚本 */
  scorer?: "human" | "llm-judge";
  judgeModel?: string;
  judgeBaseUrl?: string;
  scores: HumanScoreEntry[];
};

export type DimensionComparison = {
  dimension: RubricDimension;
  human: number;
  auto: number;
  delta: number;
  aligned: boolean;
};

export type SampleComparison = {
  opaqueId: string;
  fixtureId: string;
  matchTier?: string;
  humanTotal: number;
  autoTotal: number;
  humanPassed: boolean;
  autoPassed: boolean;
  passAligned: boolean;
  dimensions: DimensionComparison[];
  isOutlier: boolean;
  humanNotes: string;
};

export type CalibrationSummary = {
  batchId: string;
  sampleCount: number;
  dimensionMae: Record<RubricDimension, number>;
  overallMae: number;
  passAgreementRate: number;
  dimensionAlignmentRate: Record<RubricDimension, number>;
  outliers: SampleComparison[];
  meetsTarget: boolean;
  targetNotes: string[];
};
