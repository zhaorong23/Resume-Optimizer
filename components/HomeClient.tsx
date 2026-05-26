"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ResumeInput } from "@/components/ResumeInput";
import { JdAnalysisCard } from "@/components/JdAnalysisCard";
import { MatchReportCard } from "@/components/MatchReport";
import { DiffViewer } from "@/components/DiffViewer";
import { ExportBar } from "@/components/ExportBar";
import { Button } from "@/components/ui/button";
import { listPromptVariants } from "@/lib/prompts";
import type { OptimizeResult } from "@/lib/schema";

const PROMPT_VARIANTS = listPromptVariants();

const STEPS = [
  "分析 JD 要求",
  "解析简历内容",
  "计算岗位匹配度",
  "生成定向改写",
];

export function HomeClient() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [focus, setFocus] = useState("");
  const [promptVariant, setPromptVariant] = useState("baseline");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResult | null>(null);

  async function handleOptimize() {
    setLoading(true);
    setError(null);
    setResult(null);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          jd,
          focus: focus || undefined,
          promptVariant,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "优化失败，请稍后重试");
      }

      setResult(data as OptimizeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "优化失败，请稍后重试");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
          <Sparkles className="h-4 w-4" />
          AI 驱动的简历优化
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          根据 JD 智能优化你的简历
        </h1>
        <p className="mt-3 text-zinc-600">
          粘贴或上传 PDF/Word/图片简历（含扫描版），并填写目标岗位 JD
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          内容仅用于本次优化，不会存储
        </p>
      </header>

      <ResumeInput
        resume={resume}
        jd={jd}
        focus={focus}
        onResumeChange={setResume}
        onJdChange={setJd}
        onFocusChange={setFocus}
      />

      <div className="mt-4 space-y-2">
        <label htmlFor="promptVariant" className="text-sm font-medium text-zinc-900">
          Prompt 策略
        </label>
        <select
          id="promptVariant"
          value={promptVariant}
          onChange={(e) => setPromptVariant(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {PROMPT_VARIANTS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.description}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={handleOptimize}
          disabled={loading || resume.length < 50 || jd.length < 30}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {STEPS[stepIndex]}...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              开始优化
            </>
          )}
        </Button>
        {!loading && (resume.length < 50 || jd.length < 30) && (
          <p className="text-xs text-zinc-400">
            简历至少 50 字，JD 至少 30 字
          </p>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-12 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-zinc-900">优化结果</h2>
            <ExportBar result={result} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <JdAnalysisCard analysis={result.jdAnalysis} />
            <MatchReportCard report={result.matchReport} />
          </div>

          <div>
            <h3 className="mb-4 text-xl font-semibold text-zinc-900">
              改写对比
            </h3>
            <DiffViewer sections={result.sections} />
          </div>

          <p className="text-center text-xs text-zinc-400">
            {result.disclaimer} · AI 生成内容需用户自行核实真实性
          </p>
        </div>
      )}
    </div>
  );
}
