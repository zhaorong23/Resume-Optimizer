"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { RubricDimension } from "@/scripts/lib/rubric";
import {
  HUMAN_SCORES_STORAGE_KEY,
  RUBRIC_DIMENSIONS,
} from "@/lib/eval/constants";
import type {
  BlindEvalSample,
  EvalManifestBlind,
  HumanScoreEntry,
  HumanScoresFile,
} from "@/lib/eval/types";
import { ScoreSlider } from "./ScoreSlider";

const DEFAULT_DIMENSIONS = Object.fromEntries(
  RUBRIC_DIMENSIONS.map((d) => [d, 3]),
) as Record<RubricDimension, number>;

function loadStoredScores(batchId: string): HumanScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HUMAN_SCORES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HumanScoresFile;
    if (parsed.batchId !== batchId) return [];
    return parsed.scores;
  } catch {
    return [];
  }
}

function saveStoredScores(file: HumanScoresFile) {
  localStorage.setItem(HUMAN_SCORES_STORAGE_KEY, JSON.stringify(file));
}

function OutputPanel({ sample }: { sample: BlindEvalSample }) {
  const { output } = sample;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">岗位 JD</h3>
        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
          {sample.jd}
        </pre>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">原始简历</h3>
        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
          {sample.resume}
        </pre>
      </section>

      <section className="rounded-xl border border-border p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">优化产出</h3>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-muted">
            匹配分 {output.matchReport.matchScore}
          </span>
        </div>

        {output.matchReport.gapDetails && output.matchReport.gapDetails.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-medium text-muted">Gap 清单</p>
            {output.matchReport.gapDetails.map((gap, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs"
              >
                <span className="mr-2 rounded bg-tag-blue-bg px-1.5 py-0.5 text-tag-blue-text">
                  {gap.evidenceBoundary}
                </span>
                {gap.content}
                {gap.suggestion ? (
                  <p className="mt-1 text-muted">建议：{gap.suggestion}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {output.sections.map((section) => (
            <div key={section.title} className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold text-primary-muted">
                {section.title}
              </p>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                {section.rewritten}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function EvalBlindClient() {
  const [manifest, setManifest] = useState<EvalManifestBlind | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scores, setScores] = useState<HumanScoreEntry[]>([]);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/eval-samples/manifest-blind.json")
      .then((res) => {
        if (!res.ok) throw new Error("未找到样本包，请先运行 npm run eval:generate");
        return res.json() as Promise<EvalManifestBlind>;
      })
      .then((data) => {
        setManifest(data);
        const stored = loadStoredScores(data.batchId);
        if (stored.length > 0) setScores(stored);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  const activeSample = manifest?.samples[activeIndex];
  const activeScore = useMemo(
    () => scores.find((s) => s.opaqueId === activeSample?.opaqueId),
    [scores, activeSample?.opaqueId],
  );

  const dimensions = activeScore?.dimensions ?? DEFAULT_DIMENSIONS;
  const passed = activeScore?.passed ?? false;
  const notes = activeScore?.notes ?? "";

  const scoredCount = scores.length;
  const totalCount = manifest?.sampleCount ?? 0;

  const upsertScore = useCallback(
    (patch: Partial<Pick<HumanScoreEntry, "dimensions" | "passed" | "notes">>) => {
      if (!manifest || !activeSample) return;
      const next: HumanScoreEntry = {
        opaqueId: activeSample.opaqueId,
        dimensions: patch.dimensions ?? dimensions,
        passed: patch.passed ?? passed,
        notes: patch.notes ?? notes,
        scoredAt: new Date().toISOString(),
      };
      setScores((prev) => {
        const others = prev.filter((s) => s.opaqueId !== activeSample.opaqueId);
        const merged = [...others, next];
        saveStoredScores({
          batchId: manifest.batchId,
          exportedAt: new Date().toISOString(),
          scores: merged,
        });
        return merged;
      });
    },
    [manifest, activeSample, dimensions, passed, notes],
  );

  const exportJson = () => {
    if (!manifest) return;
    const file: HumanScoresFile = {
      batchId: manifest.batchId,
      exportedAt: new Date().toISOString(),
      scores,
    };
    const blob = new Blob([JSON.stringify(file, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `human-scores-${manifest.batchId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as HumanScoresFile;
        if (!manifest || parsed.batchId !== manifest.batchId) {
          setImportMsg("批次 ID 不一致，无法导入");
          return;
        }
        setScores(parsed.scores);
        saveStoredScores(parsed);
        setImportMsg(`已导入 ${parsed.scores.length} 条评分`);
      } catch {
        setImportMsg("JSON 格式无效");
      }
    };
    reader.readAsText(file);
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          简历优化盲评
        </h1>
        <p className="mt-4 text-sm text-destructive">{loadError}</p>
        <pre className="mt-6 rounded-xl border border-border bg-surface p-4 text-left text-xs text-muted">
          npm run eval:generate{"\n"}npm run dev{"\n"}# 打开 /eval
        </pre>
      </div>
    );
  }

  if (!manifest || !activeSample) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        加载样本包…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            本地评测工具 · 盲评模式
          </p>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            简历优化人工打分
          </h1>
          <p className="mt-2 max-w-xl text-xs text-muted">
            嫌费时？可在终端运行{" "}
            <code className="text-foreground">npm run eval:judge</code>{" "}
            用另一模型自动打分，再到{" "}
            <Link href="/eval/compare" className="text-primary hover:underline">
              比对页
            </Link>{" "}
            查看与 Rubric 偏差。
          </p>
          <p className="mt-1 text-sm text-muted">
            批次 {manifest.batchId} · 变体 {manifest.promptVariant} · 已评{" "}
            {scoredCount}/{totalCount}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-surface"
          >
            导出 JSON
          </button>
          <label className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-surface">
            导入 JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
              }}
            />
          </label>
          <Link
            href="/eval/compare"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            比对校准 →
          </Link>
        </div>
      </header>

      {importMsg ? (
        <p className="mb-4 text-sm text-primary-muted">{importMsg}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr_300px]">
        <aside className="space-y-1">
          {manifest.samples.map((sample, index) => {
            const done = scores.some((s) => s.opaqueId === sample.opaqueId);
            return (
              <button
                key={sample.opaqueId}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-primary-soft text-primary-muted font-medium"
                    : "text-foreground hover:bg-surface"
                }`}
              >
                <span>{sample.opaqueId}</span>
                <span className="text-xs text-muted">
                  {done ? "✓" : "—"} {sample.trackLabel}
                </span>
              </button>
            );
          })}
        </aside>

        <main>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">
              {activeSample.opaqueId}
            </span>
            <span className="rounded-full border border-primary-border bg-primary-soft px-2 py-0.5 text-xs text-primary-muted">
              {activeSample.trackLabel}
            </span>
          </div>
          <OutputPanel sample={activeSample} />
        </main>

        <aside className="sticky top-6 h-fit space-y-4 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">你的评分（1–5）</h2>
          {RUBRIC_DIMENSIONS.map((dimension) => (
            <ScoreSlider
              key={dimension}
              dimension={dimension}
              value={dimensions[dimension]}
              onChange={(value) =>
                upsertScore({
                  dimensions: { ...dimensions, [dimension]: value },
                })
              }
            />
          ))}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={passed}
              onChange={(e) => upsertScore({ passed: e.target.checked })}
              className="accent-[var(--primary)]"
            />
            <span className="font-medium">总评通过（≥3.5 且证据维 ≥3）</span>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted">备注</span>
            <textarea
              value={notes}
              onChange={(e) => upsertScore({ notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              placeholder="虚构经历？赛道跑偏？"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              upsertScore({});
              if (activeIndex < manifest.samples.length - 1) {
                setActiveIndex(activeIndex + 1);
              }
            }}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            保存并下一条
          </button>
        </aside>
      </div>
    </div>
  );
}
