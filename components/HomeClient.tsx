"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ResumeInput, type InterviewMeta } from "@/components/ResumeInput";
import { JdAnalysisCard } from "@/components/JdAnalysisCard";
import { MatchReportCard } from "@/components/MatchReport";
import { EvidenceAuditAlert } from "@/components/EvidenceAuditAlert";
import { DiffViewer } from "@/components/DiffViewer";
import { ExportBar } from "@/components/ExportBar";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";
import { Button } from "@/components/ui/button";
import { listPromptVariants } from "@/lib/prompts";
import { inferPmFlavor } from "@/lib/interview-prep/infer-role-type";
import type { InterviewPrepResult } from "@/lib/interview-prep/schema";
import type { OptimizeResult } from "@/lib/schema";
import { PORTFOLIO_URL } from "@/lib/site-urls";
import { cn } from "@/lib/utils";

const PROMPT_VARIANTS = listPromptVariants();

const OPTIMIZE_STEP_LABELS: Record<string, string> = {
  analyze: "解读 JD 与计算匹配度",
  rewrite: "生成定向改写",
  audit: "可信度检查",
};

const INTERVIEW_STEPS: Record<string, string> = {
  research: "正在调研公司与面经",
  synthesis: "正在合成调研摘要",
  generate: "正在生成面试准备材料",
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
  const [optimizeStep, setOptimizeStep] = useState("analyze");
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
    setOptimizeStep("analyze");

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          jd,
          focus: focus || undefined,
          promptVariant,
          stream: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "优化失败，请稍后重试");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: OptimizeResult | null = null;

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
            data?: OptimizeResult;
          };

          if (payload.type === "progress" && payload.step) {
            setOptimizeStep(payload.step);
          } else if (payload.type === "result" && payload.data) {
            finalResult = payload.data;
            setOptimizeResult(payload.data);
            setActiveTab("optimize");
          } else if (payload.type === "error") {
            throw new Error(payload.message ?? "优化失败，请稍后重试");
          }
        }
      }

      if (!finalResult) {
        throw new Error("未收到优化结果，请重试");
      }
    } catch (err) {
      setOptimizeError(err instanceof Error ? err.message : "优化失败，请稍后重试");
    } finally {
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
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-white"
              aria-hidden
            >
              AI
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">简历助手</p>
              <p className="text-xs text-muted">优化 · 面试准备</p>
            </div>
          </div>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted transition-colors hover:text-primary"
          >
            关于作者
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="section-label mb-3">求职效率工具</p>
          <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            根据岗位 JD，定向优化简历
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            面向产品经理 & 产品运营求职者（含校招/实习）。上传或粘贴简历，按 JD
            定向改写；也可生成含公司调研与赛道化面试题的备战文档。
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2">
          <div className="workflow-step">
            <span className="workflow-step-num">1</span>
            填写公司与 JD
          </div>
          <div className="workflow-step">
            <span className="workflow-step-num">2</span>
            优化简历
          </div>
          <div className="workflow-step">
            <span className="workflow-step-num">3</span>
            生成面试材料
          </div>
        </div>

        <div className="panel p-5 sm:p-7">
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

          <details className="mt-8 border-t border-border pt-6">
            <summary className="cursor-pointer text-xs font-medium text-muted transition-colors hover:text-foreground">
              Prompt 策略（高级选项）
            </summary>
            <div className="mt-3">
              <label htmlFor="promptVariant" className="sr-only">
                Prompt 策略
              </label>
              <select
                id="promptVariant"
                value={promptVariant}
                onChange={(e) => setPromptVariant(e.target.value)}
                className="field-input"
              >
                {PROMPT_VARIANTS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.description}
                  </option>
                ))}
              </select>
            </div>
          </details>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
            <Button
              size="lg"
              className="flex-1 sm:min-w-[180px]"
              onClick={handleOptimize}
              disabled={optimizeLoading || interviewLoading || !canOptimize}
            >
              {optimizeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {OPTIMIZE_STEP_LABELS[optimizeStep] ?? "正在优化"}
                </>
              ) : (
                "开始优化简历"
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="flex-1 sm:min-w-[180px]"
              onClick={handleInterviewPrep}
              disabled={optimizeLoading || interviewLoading || !canInterview}
            >
              {interviewLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {INTERVIEW_STEPS[interviewStep] ?? "正在生成"}
                </>
              ) : (
                "生成面试准备"
              )}
            </Button>
          </div>

          {!optimizeLoading && !interviewLoading && !canOptimize && (
            <p className="mt-3 text-center text-xs text-muted">
              简历至少 50 字，JD 至少 30 字
            </p>
          )}
          {!interviewLoading && canOptimize && !canInterview && (
            <p className="mt-3 text-center text-xs text-muted">
              生成面试准备需填写目标公司名称
            </p>
          )}

          {(optimizeError || interviewError) && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
            >
              {optimizeError ?? interviewError}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted">
            内容仅用于本次生成，不会存储
          </p>
        </div>

        {(optimizeResult || interviewResult) && (
          <section className="mt-12" aria-label="生成结果">
            <div className="mb-6 flex gap-0 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("optimize")}
                className={cn(
                  "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                  activeTab === "optimize"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                简历优化
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("interview")}
                disabled={!interviewResult}
                className={cn(
                  "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                  activeTab === "interview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground",
                  !interviewResult && "cursor-not-allowed opacity-40",
                )}
              >
                面试准备
                {!interviewResult && (
                  <span className="ml-1.5 text-xs font-normal">需先生成</span>
                )}
              </button>
            </div>

            {activeTab === "optimize" && optimizeResult && (
              <div className="space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-foreground">优化结果</h2>
                  <ExportBar result={optimizeResult} />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <JdAnalysisCard analysis={optimizeResult.jdAnalysis} />
                  <MatchReportCard report={optimizeResult.matchReport} />
                </div>

                {optimizeResult.evidenceAudit ? (
                  <EvidenceAuditAlert audit={optimizeResult.evidenceAudit} />
                ) : null}

                <div>
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    改写对比
                  </h3>
                  <DiffViewer sections={optimizeResult.sections} />
                </div>

                <p className="text-center text-xs text-muted">
                  {optimizeResult.disclaimer} · AI 生成内容需用户自行核实
                </p>
              </div>
            )}

            {activeTab === "interview" && interviewResult && (
              <InterviewPrepPanel
                result={interviewResult}
                companyName={interviewMeta.companyName}
                roleTitle={interviewMeta.roleTitle || undefined}
                roleType={interviewMeta.roleType}
                pmFlavor={
                  interviewMeta.roleType === "pm"
                    ? inferPmFlavor(jd, interviewMeta.roleTitle)
                    : undefined
                }
              />
            )}
          </section>
        )}
      </div>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        <p>
          由{" "}
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            赵蓉
          </a>{" "}
          独立开发 · 每日免费额度有限
        </p>
      </footer>
    </>
  );
}
