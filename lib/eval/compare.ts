import type {
  CalibrationSummary,
  DimensionComparison,
  EvalManifestFull,
  HumanScoresFile,
  SampleComparison,
} from "./types";
import {
  CALIBRATION_TARGETS,
  RUBRIC_DIMENSIONS,
} from "./constants";
import type { RubricDimension } from "../../scripts/lib/rubric";

const WEIGHTS: Record<RubricDimension, number> = {
  structure: 0.15,
  evidence: 0.25,
  trackMatch: 0.2,
  actionable: 0.15,
  usability: 0.15,
  sourceTrust: 0.1,
};

function weightedTotal(dimensions: Record<RubricDimension, number>): number {
  return RUBRIC_DIMENSIONS.reduce(
    (sum, key) => sum + dimensions[key] * WEIGHTS[key],
    0,
  );
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildSampleComparisons(
  manifestFull: EvalManifestFull,
  humanFile: HumanScoresFile,
): SampleComparison[] {
  if (manifestFull.batchId !== humanFile.batchId) {
    throw new Error(
      `批次不一致：样本包 ${manifestFull.batchId}，人工分 ${humanFile.batchId}`,
    );
  }

  const humanById = new Map(humanFile.scores.map((s) => [s.opaqueId, s]));

  return manifestFull.samples.map((sample) => {
    const human = humanById.get(sample.opaqueId);
    if (!human) {
      throw new Error(`缺少样本 ${sample.opaqueId} 的人工评分`);
    }

    const dimensions: DimensionComparison[] = RUBRIC_DIMENSIONS.map(
      (dimension) => {
        const h = human.dimensions[dimension];
        const a = sample.autoRubric.dimensions[dimension];
        const delta = h - a;
        return {
          dimension,
          human: h,
          auto: a,
          delta,
          aligned: Math.abs(delta) <= 1,
        };
      },
    );

    const humanTotal = weightedTotal(human.dimensions);
    const autoTotal = sample.autoRubric.total;
    const passAligned = human.passed === sample.autoRubric.passed;
    const dimensionOutlier = dimensions.some((d) => Math.abs(d.delta) >= 2);
    const passOutlier = !passAligned;
    const totalOutlier = Math.abs(humanTotal - autoTotal) >= 1;

    return {
      opaqueId: sample.opaqueId,
      fixtureId: sample.fixtureId,
      matchTier: sample.matchTier,
      humanTotal,
      autoTotal,
      humanPassed: human.passed,
      autoPassed: sample.autoRubric.passed,
      passAligned,
      dimensions,
      isOutlier: dimensionOutlier || passOutlier || totalOutlier,
      humanNotes: human.notes,
    };
  });
}

export function summarizeCalibration(
  comparisons: SampleComparison[],
  batchId: string,
): CalibrationSummary {
  const dimensionMae = Object.fromEntries(
    RUBRIC_DIMENSIONS.map((dimension) => {
      const deltas = comparisons.map(
        (c) =>
          c.dimensions.find((d) => d.dimension === dimension)?.delta ?? 0,
      );
      return [dimension, mean(deltas.map(Math.abs))];
    }),
  ) as Record<RubricDimension, number>;

  const overallMae = mean(
    RUBRIC_DIMENSIONS.map((dimension) => dimensionMae[dimension]),
  );

  const passAgreementRate =
    comparisons.filter((c) => c.passAligned).length / comparisons.length;

  const dimensionAlignmentRate = Object.fromEntries(
    RUBRIC_DIMENSIONS.map((dimension) => {
      const aligned = comparisons.filter((c) =>
        c.dimensions.find((d) => d.dimension === dimension)?.aligned,
      ).length;
      return [dimension, aligned / comparisons.length];
    }),
  ) as Record<RubricDimension, number>;

  const outliers = comparisons.filter((c) => c.isOutlier);

  const targetNotes: string[] = [];
  if (overallMae > CALIBRATION_TARGETS.dimensionMaeMax) {
    targetNotes.push(
      `整体 MAE ${overallMae.toFixed(2)} 高于目标 ${CALIBRATION_TARGETS.dimensionMaeMax}`,
    );
  }
  for (const dimension of RUBRIC_DIMENSIONS) {
    if (dimensionMae[dimension] > CALIBRATION_TARGETS.dimensionMaeMax) {
      targetNotes.push(
        `${dimension} 维 MAE ${dimensionMae[dimension].toFixed(2)} 偏高`,
      );
    }
    if (
      dimensionAlignmentRate[dimension] <
      CALIBRATION_TARGETS.dimensionAlignmentMin
    ) {
      targetNotes.push(`${dimension} 维 ±1 一致率偏低`);
    }
  }
  if (passAgreementRate < CALIBRATION_TARGETS.passAgreementMin) {
    targetNotes.push(
      `Pass/Fail 一致率 ${(passAgreementRate * 100).toFixed(0)}% 低于目标 80%`,
    );
  }

  const meetsTarget =
    overallMae <= CALIBRATION_TARGETS.dimensionMaeMax &&
    passAgreementRate >= CALIBRATION_TARGETS.passAgreementMin &&
    RUBRIC_DIMENSIONS.every(
      (d) =>
        dimensionMae[d] <= CALIBRATION_TARGETS.dimensionMaeMax &&
        dimensionAlignmentRate[d] >= CALIBRATION_TARGETS.dimensionAlignmentMin,
    );

  return {
    batchId,
    sampleCount: comparisons.length,
    dimensionMae,
    overallMae,
    passAgreementRate,
    dimensionAlignmentRate,
    outliers,
    meetsTarget,
    targetNotes,
  };
}
