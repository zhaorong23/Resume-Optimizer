"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";
import { ResumeInput, type InterviewMeta } from "@/components/ResumeInput";
import { JdAnalysisCard } from "@/components/JdAnalysisCard";
import { MatchReportCard } from "@/components/MatchReport";
import { DiffViewer } from "@/components/DiffViewer";
import { ExportBar } from "@/components/ExportBar";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";
import { Button } from "@/components/ui/button";
import { listPromptVariants } from "@/lib/prompts";
import type { InterviewPrepResult } from "@/lib/interview-prep/schema";
import type { OptimizeResult } from "@/lib/schema";
import { cn } from "@/lib/utils";

const PROMPT_VARIANTS = listPromptVariants();

const OPTIMIZE_STEPS = [
  "分析 JD 要求",
  "解析简历内容",
  "计算岗位匹配度",
  "生成定向改写",
];

const INTERVIEW_STEPS: Record<string, string> = {
  research: "正在调研公司与面经…",
  synthesis: "正在合成调研摘要…",
  generate: "正在生成面试准备材料…",
};

const DEFAULT_INTERVIEW_META: InterviewMeta = {
  companyName: "",
  roleTitle: "",
  productName: "",
  prepMode: "standard",
  roleType: "pm",
  supplementaryNotes: "",
  modules: [],
};

type ActiveTab = "optimize" | "interview";

export function HomeClient() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [focus, setFocus] = useState("");
  const [interviewMeta, setInterviewMeta] =
    useState<InterviewMeta>(DEFAULT_INTERVIEW_META);
  const [promptVariant, setPromptVariant] = useState("baseline");
  const [activeTab, setActiveTab] = useState<ActiveTab>("optimize");

  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizeStepIndex, setOptimizeStepIndex] = useState(0);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(
    null,
  );

  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewStep, setInterviewStep] = useState("");
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [interviewResult, setInterviewResult] =
    useState<InterviewPrepResult | null>(null);

  async function handleOptimize() {
    setOptimizeLoading(true);
    setOptimizeError(null);
    setOptimizeResult(null);
    setOptimizeStepIndex(0);

    const interval = setInterval(() => {
      setOptimizeStepIndex((prev) =>
        prev < OPTIMIZE_STEPS.length - 1 ? prev + 1 : prev,
      );
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

      setOptimizeResult(data as OptimizeResult);
      setActiveTab("optimize");
    } catch (err) {
      setOptimizeError(err instanceof Error ? err.message : "优化失败，请稍后重试");
    } finally {
      clearInterval(interval);
      setOptimizeLoading(false);
    }
  }

  async function handleInterviewPrep() {
    setInterviewLoading(true);
    setInterviewError(null);
    setInterviewResult(null);
    setInterviewStep("research");

    try {
      const response = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          jd,
          companyName: interviewMeta.companyName,
          roleTitle: interviewMeta.roleTitle || undefined,
          productName: interviewMeta.productName || interviewMeta.companyName,
          roleType: interviewMeta.roleType,
          mode: interviewMeta.prepMode,
          supplementaryNotes: interviewMeta.supplementaryNotes || undefined,
          optimizeResult: optimizeResult ?? undefined,
          modules:
            interviewMeta.modules.length > 0
              ? interviewMeta.modules
              : undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "面试准备生成失败");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: InterviewPrepResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as {
            type: string;
            step?: string;
            message?: string;
            data?: InterviewPrepResult;
          };

          if (payload.type === "progress" && payload.step) {
            setInterviewStep(payload.step);
          } else if (payload.type === "result" && payload.data) {
            finalResult = payload.data;
            setInterviewResult(payload.data);
            setActiveTab("interview");
          } else if (payload.type === "error") {
            throw new Error(payload.message ?? "面试准备生成失败");
          }
        }
      }

      if (!finalResult) {
        throw new Error("未收到面试准备结果，请重试");
      }
    } catch (err) {
      setInterviewError(
        err instanceof Error ? err.message : "面试准备生成失败",
      );
    } finally {
      setInterviewLoading(false);
    }
  }

  const canOptimize = resume.length >= 50 && jd.length >= 30;
  const canInterview =
    canOptimize && interviewMeta.companyName.trim().length >= 2;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
          <Sparkles className="h-4 w-4" />
          AI 驱动的简历优化 + 面试准备
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          根据 JD 优化简历，一键生成面试材料
        </h1>
        <p className="mt-3 text-zinc-600">
          粘贴或上传简历，填写目标公司与 JD，完成优化后可生成 8 章面试准备
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          内容仅用于本次生成，不会存储
        </p>
      </header>

      <ResumeInput
        resume={resume}
        jd={jd}
        focus={focus}
        interviewMeta={interviewMeta}
        onResumeChange={setResume}
        onJdChange={setJd}
        onFocusChange={setFocus}
        onInterviewMetaChange={setInterviewMeta}
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

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          size="lg"
          onClick={handleOptimize}
          disabled={optimizeLoading || interviewLoading || !canOptimize}
        >
          {optimizeLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {OPTIMIZE_STEPS[optimizeStepIndex]}...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              开始优化
            </>
          )}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleInterviewPrep}
          disabled={optimizeLoading || interviewLoading || !canInterview}
        >
          {interviewLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {INTERVIEW_STEPS[interviewStep] ?? "正在生成…"}
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              生成面试准备
            </>
          )}
        </Button>
      </div>

      {!optimizeLoading && !interviewLoading && !canOptimize && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          简历至少 50 字，JD 至少 30 字
        </p>
      )}
      {!interviewLoading && canOptimize && !canInterview && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          生成面试准备需填写目标公司名称
        </p>
      )}

      {(optimizeError || interviewError) && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {optimizeError ?? interviewError}
        </div>
      )}

      {(optimizeResult || interviewResult) && (
        <div className="mt-12">
          <div className="mb-6 flex gap-2 border-b border-zinc-200">
            <button
              type="button"
              onClick={() => setActiveTab("optimize")}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "optimize"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-900",
              )}
            >
              简历优化
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("interview")}
              disabled={!interviewResult}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "interview"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-900",
                !interviewResult && "cursor-not-allowed opacity-50",
              )}
            >
              面试准备
            </button>
          </div>

          {activeTab === "optimize" && optimizeResult && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-zinc-900">优化结果</h2>
                <ExportBar result={optimizeResult} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <JdAnalysisCard analysis={optimizeResult.jdAnalysis} />
                <MatchReportCard report={optimizeResult.matchReport} />
              </div>

              <div>
                <h3 className="mb-4 text-xl font-semibold text-zinc-900">
                  改写对比
                </h3>
                <DiffViewer sections={optimizeResult.sections} />
              </div>

              <p className="text-center text-xs text-zinc-400">
                {optimizeResult.disclaimer} · AI 生成内容需用户自行核实真实性
              </p>
            </div>
          )}

          {activeTab === "interview" && interviewResult && (
            <InterviewPrepPanel
              result={interviewResult}
              companyName={interviewMeta.companyName}
              roleTitle={interviewMeta.roleTitle || undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
