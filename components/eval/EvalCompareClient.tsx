"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildSampleComparisons,
  summarizeCalibration,
} from "@/lib/eval/compare";
import {
  CALIBRATION_TARGETS,
  RUBRIC_DIMENSION_META,
  RUBRIC_DIMENSIONS,
} from "@/lib/eval/constants";
import type {
  EvalManifestFull,
  HumanScoresFile,
  SampleComparison,
} from "@/lib/eval/types";

function DeltaBadge({ delta }: { delta: number }) {
  const abs = Math.abs(delta);
  const color =
    abs >= 2
      ? "bg-destructive-soft text-destructive"
      : abs === 0
        ? "bg-primary-soft text-primary-muted"
        : "bg-surface text-muted";
  const sign = delta > 0 ? "+" : "";
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>
      {sign}
      {delta.toFixed(0)}
    </span>
  );
}

function ComparisonTable({
  rows,
  referenceLabel,
}: {
  rows: SampleComparison[];
  referenceLabel: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="border-b border-border bg-surface text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">样本</th>
            <th className="px-3 py-2 font-medium">Fixture</th>
            <th className="px-3 py-2 font-medium">{referenceLabel}总分</th>
            <th className="px-3 py-2 font-medium">自动总分</th>
            <th className="px-3 py-2 font-medium">Pass</th>
            {RUBRIC_DIMENSIONS.map((d) => (
              <th key={d} className="px-3 py-2 font-medium">
                {RUBRIC_DIMENSION_META[d].label} Δ
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.opaqueId}
              className={`border-b border-border last:border-0 ${
                row.isOutlier ? "bg-destructive-soft/40" : ""
              }`}
            >
              <td className="px-3 py-2 font-medium">{row.opaqueId}</td>
              <td className="px-3 py-2 text-muted">
                {row.fixtureId}
                {row.matchTier ? (
                  <span className="ml-1 text-[10px]">({row.matchTier})</span>
                ) : null}
              </td>
              <td className="px-3 py-2">{row.humanTotal.toFixed(2)}</td>
              <td className="px-3 py-2">{row.autoTotal.toFixed(2)}</td>
              <td className="px-3 py-2">
                {row.passAligned ? (
                  <span className="text-success">一致</span>
                ) : (
                  <span className="text-destructive">
                    {referenceLabel}
                    {row.humanPassed ? "过" : "挂"} / 自动
                    {row.autoPassed ? "过" : "挂"}
                  </span>
                )}
              </td>
              {row.dimensions.map((d) => (
                <td key={d.dimension} className="px-3 py-2">
                  <DeltaBadge delta={d.delta} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function scorerLabel(file: HumanScoresFile | null): string {
  if (!file) return "评委";
  if (file.scorer === "llm-judge") return "LLM评委";
  return "人工";
}

export function EvalCompareClient() {
  const [manifestFull, setManifestFull] = useState<EvalManifestFull | null>(
    null,
  );
  const [referenceFile, setReferenceFile] = useState<HumanScoresFile | null>(
    null,
  );
  const [llmJudgeFile, setLlmJudgeFile] = useState<HumanScoresFile | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/eval-samples/manifest-full.json").then((res) => {
        if (!res.ok) throw new Error("未找到 manifest-full.json");
        return res.json() as Promise<EvalManifestFull>;
      }),
      fetch("/eval-samples/llm-judge-scores.json").then((res) =>
        res.ok ? (res.json() as Promise<HumanScoresFile>) : null,
      ),
    ])
      .then(([manifest, llmScores]) => {
        setManifestFull(manifest);
        if (llmScores) {
          setLlmJudgeFile(llmScores);
          setReferenceFile(llmScores);
        }
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  const referenceLabel = scorerLabel(referenceFile);

  const { comparisons, summary } = useMemo(() => {
    if (!manifestFull || !referenceFile) {
      return { comparisons: null, summary: null };
    }
    try {
      const rows = buildSampleComparisons(manifestFull, referenceFile);
      const sum = summarizeCalibration(rows, manifestFull.batchId);
      setCompareError(null);
      return { comparisons: rows, summary: sum };
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : "比对失败");
      return { comparisons: null, summary: null };
    }
  }, [manifestFull, referenceFile]);

  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as HumanScoresFile;
        setReferenceFile(parsed);
        setCompareError(null);
      } catch {
        setCompareError("评分 JSON 格式无效");
      }
    };
    reader.readAsText(file);
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Link href="/eval" className="mt-4 inline-block text-sm text-primary">
          ← 返回盲评
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 border-b border-border pb-6">
        <Link href="/eval" className="text-xs text-primary hover:underline">
          ← 返回盲评打分
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          评委分 vs 自动 Rubric 比对
        </h1>
        {manifestFull ? (
          <p className="mt-1 text-sm text-muted">
            批次 {manifestFull.batchId} · 变体 {manifestFull.promptVariant}
          </p>
        ) : null}
      </header>

      <section className="mb-8 rounded-xl border border-dashed border-border bg-surface p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!llmJudgeFile}
            onClick={() => llmJudgeFile && setReferenceFile(llmJudgeFile)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              referenceFile?.scorer === "llm-judge"
                ? "bg-primary text-white"
                : "border border-border bg-background hover:bg-surface disabled:opacity-40"
            }`}
          >
            使用 LLM 评委分
          </button>
          <label className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-surface">
            上传人工 JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
            />
          </label>
        </div>
        <pre className="rounded-lg border border-border bg-background p-3 text-xs text-muted">
          推荐：npm run eval:judge（用 JUDGE_LLM_* 配置另一模型，全自动打分）
        </pre>
        {referenceFile ? (
          <p className="text-sm text-muted">
            当前：{referenceLabel} · {referenceFile.scores.length} 条
            {referenceFile.judgeModel
              ? ` · 模型 ${referenceFile.judgeModel}`
              : ""}
            （{referenceFile.exportedAt.slice(0, 19)}）
          </p>
        ) : (
          <p className="text-sm text-muted">
            运行 <code className="text-foreground">npm run eval:judge</code>{" "}
            后会自动生成 llm-judge-scores.json；也可在 /eval 手打后上传。
          </p>
        )}
        {compareError ? (
          <p className="text-sm text-destructive">{compareError}</p>
        ) : null}
      </section>

      {summary ? (
        <>
          <section
            className={`mb-8 rounded-xl border p-6 ${
              summary.meetsTarget
                ? "border-primary-border bg-primary-soft"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                校准结论
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  summary.meetsTarget
                    ? "bg-primary text-white"
                    : "bg-destructive-soft text-destructive"
                }`}
              >
                {summary.meetsTarget ? "已达标" : "未达标 · 需调 rubric.ts"}
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted">整体 MAE（目标 ≤0.8）</p>
                <p className="text-2xl font-semibold">
                  {summary.overallMae.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Pass 一致率（目标 ≥80%）</p>
                <p className="text-2xl font-semibold">
                  {(summary.passAgreementRate * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Outlier 样本数</p>
                <p className="text-2xl font-semibold">
                  {summary.outliers.length} / {summary.sampleCount}
                </p>
              </div>
            </div>
            {summary.targetNotes.length > 0 ? (
              <ul className="mt-4 list-inside list-disc text-sm text-muted">
                {summary.targetNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {RUBRIC_DIMENSIONS.map((d) => (
                <div
                  key={d}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs"
                >
                  <span className="font-medium">
                    {RUBRIC_DIMENSION_META[d].label}
                  </span>
                  <span className="ml-2 text-muted">
                    MAE {summary.dimensionMae[d].toFixed(2)} · ±1{" "}
                    {(summary.dimensionAlignmentRate[d] * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              达标后可将检查二门槛写入发版清单。未达标请根据 outlier 调整{" "}
              <code className="text-foreground">scripts/lib/rubric.ts</code>{" "}
              并重新 <code className="text-foreground">npm run eval:generate</code>
              。
            </p>
          </section>

          {comparisons ? (
            <>
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                全量比对表
              </h2>
              <ComparisonTable rows={comparisons} referenceLabel={referenceLabel} />

              {summary.outliers.length > 0 ? (
                <section className="mt-8">
                  <h2 className="mb-3 text-sm font-semibold text-destructive">
                    Outlier 明细（优先调 Rubric）
                  </h2>
                  <ComparisonTable
                    rows={summary.outliers}
                    referenceLabel={referenceLabel}
                  />
                  <div className="mt-4 space-y-3">
                    {summary.outliers.map((row) =>
                      row.humanNotes ? (
                        <p key={row.opaqueId} className="text-xs text-muted">
                          <strong>{row.opaqueId}</strong>（{row.fixtureId}）：{" "}
                          {row.humanNotes}
                        </p>
                      ) : null,
                    )}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted">
          加载 LLM 评委分或上传人工评分后，将显示与自动 Rubric 的比对。目标：整体 MAE ≤{" "}
          {CALIBRATION_TARGETS.dimensionMaeMax}，Pass 一致率 ≥{" "}
          {(CALIBRATION_TARGETS.passAgreementMin * 100).toFixed(0)}%。
        </p>
      )}
    </div>
  );
}
