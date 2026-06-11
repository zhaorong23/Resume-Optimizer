"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZHIPU_DEMO } from "@/lib/demo-presets";
import { ACCEPTED_RESUME_LABEL, ACCEPTED_RESUME_TYPES } from "@/lib/resume-file-constants";
import { inferPmFlavor } from "@/lib/interview-prep/infer-role-type";
import { getRoleTypeOption } from "@/lib/interview-prep/role-type-options";
import type { PrepMode, PrepModule, RoleType } from "@/lib/interview-prep/schema";

export type InterviewMeta = {
  companyName: string;
  roleTitle: string;
  productName: string;
  prepMode: PrepMode;
  roleType: RoleType;
  supplementaryNotes: string;
  modules: PrepModule[];
};

type ResumeInputProps = {
  resume: string;
  jd: string;
  focus: string;
  interviewMeta: InterviewMeta;
  onResumeChange: (value: string) => void;
  onJdChange: (value: string) => void;
  onFocusChange: (value: string) => void;
  onInterviewMetaChange: (value: InterviewMeta) => void;
};

type ResumeMode = "paste" | "upload";

const MODULE_OPTIONS: { id: PrepModule; label: string }[] = [
  { id: "research", label: "公司调研" },
  { id: "intro", label: "自我介绍" },
  { id: "star", label: "项目 STAR" },
  { id: "questions", label: "高频题" },
  { id: "gaps", label: "Gap 清单" },
  { id: "reverse", label: "反问" },
  { id: "design", label: "设计思考" },
];

export function ResumeInput({
  resume,
  jd,
  focus,
  interviewMeta,
  onResumeChange,
  onJdChange,
  onFocusChange,
  onInterviewMetaChange,
}: ResumeInputProps) {
  const [mode, setMode] = useState<ResumeMode>("paste");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [parseMethod, setParseMethod] = useState<"text" | "ocr" | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateMeta<K extends keyof InterviewMeta>(
    key: K,
    value: InterviewMeta[K],
  ) {
    onInterviewMetaChange({ ...interviewMeta, [key]: value });
  }

  function toggleModule(module: PrepModule) {
    const current = interviewMeta.modules;
    const next = current.includes(module)
      ? current.filter((m) => m !== module)
      : [...current, module];
    updateMeta("modules", next);
  }

  function fillZhipuDemo() {
    onInterviewMetaChange({
      ...interviewMeta,
      companyName: ZHIPU_DEMO.companyName,
      productName: ZHIPU_DEMO.productName,
      roleTitle: ZHIPU_DEMO.roleTitle,
    });
    onJdChange(ZHIPU_DEMO.jd);
  }

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "文件解析失败");
      }

      onResumeChange(data.text);
      setUploadedFilename(data.filename);
      setParseMethod(data.parseMethod === "ocr" ? "ocr" : "text");
      setMode("paste");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "文件解析失败");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(files: FileList | null) {
    const file = files?.[0];
    if (file) void handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }

  return (
    <div className="space-y-6">
      <section className="bento-cell space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label mb-1">Step 1</p>
            <h2 className="text-sm font-semibold text-foreground">目标公司与岗位</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={fillZhipuDemo}>
            填充示例
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="companyName" className="text-xs font-medium text-muted">
              目标公司 *
            </label>
            <input
              id="companyName"
              value={interviewMeta.companyName}
              onChange={(e) => updateMeta("companyName", e.target.value)}
              placeholder="如：智谱清言"
              className="field-input"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="roleTitle" className="text-xs font-medium text-muted">
              岗位名称
            </label>
            <input
              id="roleTitle"
              value={interviewMeta.roleTitle}
              onChange={(e) => updateMeta("roleTitle", e.target.value)}
              placeholder="如：AI产品经理实习生"
              className="field-input"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="prepMode" className="text-xs font-medium text-muted">
              面试准备模式
            </label>
            <select
              id="prepMode"
              value={interviewMeta.prepMode}
              onChange={(e) => updateMeta("prepMode", e.target.value as PrepMode)}
              className="field-input"
            >
              <option value="quick">速准版（≤2天面试）</option>
              <option value="standard">标准版</option>
              <option value="deep">深研版</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="roleType" className="text-xs font-medium text-muted">
              求职赛道（影响面试高频题风格）
            </label>
            <select
              id="roleType"
              value={interviewMeta.roleType}
              onChange={(e) => updateMeta("roleType", e.target.value as RoleType)}
              className="field-input"
            >
              <option value="pm">产品经理</option>
              <option value="ops">产品运营</option>
            </select>
            <p className="text-xs leading-relaxed text-muted">
              产品经理侧重功能与 0-1；产品运营侧重活动与指标。简历改写由上方 JD
              自动匹配，无需重复选择。
            </p>
            {(() => {
              const option = getRoleTypeOption(interviewMeta.roleType);
              const pmFlavor =
                interviewMeta.roleType === "pm"
                  ? inferPmFlavor(jd, interviewMeta.roleTitle)
                  : null;
              const chips = [
                ...option.subLabels,
                ...(pmFlavor === "growth" ? ["增长向（JD 已识别）"] : []),
              ];
              return (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {chips.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-muted"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bento-cell space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label mb-1">Step 2</p>
              <label className="text-sm font-semibold text-foreground">我的简历</label>
            </div>
            <div className="flex rounded-md border border-border bg-surface p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  mode === "paste"
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground",
                )}
              >
                粘贴文本
              </button>
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  mode === "upload"
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground",
                )}
              >
                上传文件
              </button>
            </div>
          </div>

          {mode === "paste" ? (
            <>
              {uploadedFilename && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <FileText className="h-3.5 w-3.5" />
                  {parseMethod === "ocr"
                    ? `已通过 OCR 识别「${uploadedFilename}」，请核对文本后继续编辑`
                    : `已从「${uploadedFilename}」提取文本，可继续编辑`}
                </p>
              )}
              <Textarea
                id="resume"
                placeholder="粘贴你的完整简历内容，或切换到「上传文件」导入 PDF/Word/图片..."
                value={resume}
                onChange={(e) => onResumeChange(e.target.value)}
                className="min-h-[300px] border-0 bg-surface p-0 focus:shadow-none focus:ring-0"
              />
            </>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "flex min-h-[320px] flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary-soft/50"
                  : "border-border bg-surface",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_RESUME_TYPES}
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              {uploading ? (
                <>
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    正在解析文件...
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    扫描版 PDF / 图片会进行 OCR，可能需要 30–60 秒
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mb-3 h-10 w-10 text-muted" />
                  <p className="text-sm font-medium text-foreground">
                    拖拽文件到此处，或点击选择
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    支持 {ACCEPTED_RESUME_LABEL}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    选择文件
                  </Button>
                </>
              )}
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-rose-600">{uploadError}</p>
          )}
        </div>

        <div className="bento-cell space-y-3">
          <div>
            <p className="section-label mb-1">Step 2</p>
            <label htmlFor="jd" className="text-sm font-semibold text-foreground">
              目标岗位 JD
            </label>
          </div>
          <Textarea
            id="jd"
            placeholder="粘贴目标岗位的 Job Description..."
            value={jd}
            onChange={(e) => onJdChange(e.target.value)}
            className="min-h-[300px] border-0 bg-surface p-0 focus:shadow-none focus:ring-0"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="bento-cell space-y-2">
        <label htmlFor="focus" className="text-sm font-semibold text-foreground">
          优化侧重（可选）
        </label>
        <Textarea
          id="focus"
          placeholder="例如：突出 AI 产品经验、强化量化成果..."
          value={focus}
          onChange={(e) => onFocusChange(e.target.value)}
          className="min-h-[72px] border-0 bg-surface p-0 focus:shadow-none focus:ring-0"
        />
        </div>

        <div className="bento-cell space-y-2">
        <label
          htmlFor="supplementaryNotes"
          className="text-sm font-semibold text-foreground"
        >
          面试补充资料（可选）
        </label>
        <p className="text-xs text-muted">
          搜索失败时可粘贴公司了解、面经摘要
        </p>
        <Textarea
          id="supplementaryNotes"
          placeholder="公司背景、面经、产品体验笔记..."
          value={interviewMeta.supplementaryNotes}
          onChange={(e) => updateMeta("supplementaryNotes", e.target.value)}
          className="min-h-[72px] border-0 bg-surface p-0 focus:shadow-none focus:ring-0"
        />
        </div>
      </section>

      <section className="bento-cell space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">面试准备模块</p>
          <p className="text-xs text-muted">点选后仅生成所选模块，不选则全部生成</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODULE_OPTIONS.map((option) => {
            const active = interviewMeta.modules.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleModule(option.id)}
                className={cn(
                  "tag-chip",
                  active && "tag-chip-active",
                  !active && "text-muted hover:border-primary-border hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
