"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_RESUME_LABEL, ACCEPTED_RESUME_TYPES } from "@/lib/resume-file-constants";

type ResumeInputProps = {
  resume: string;
  jd: string;
  focus: string;
  onResumeChange: (value: string) => void;
  onJdChange: (value: string) => void;
  onFocusChange: (value: string) => void;
};

type ResumeMode = "paste" | "upload";

export function ResumeInput({
  resume,
  jd,
  focus,
  onResumeChange,
  onJdChange,
  onFocusChange,
}: ResumeInputProps) {
  const [mode, setMode] = useState<ResumeMode>("paste");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [parseMethod, setParseMethod] = useState<"text" | "ocr" | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-900">我的简历</label>
            <div className="flex rounded-lg border border-zinc-200 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  mode === "paste"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-600 hover:text-zinc-900",
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
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-600 hover:text-zinc-900",
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
                className="min-h-[320px]"
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
                  ? "border-indigo-400 bg-indigo-50/50"
                  : "border-zinc-200 bg-zinc-50/50",
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
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-indigo-600" />
                  <p className="text-sm font-medium text-zinc-900">
                    正在解析文件...
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    扫描版 PDF / 图片会进行 OCR，可能需要 30–60 秒
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mb-3 h-10 w-10 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-900">
                    拖拽文件到此处，或点击选择
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
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

        <div className="space-y-2">
          <label htmlFor="jd" className="text-sm font-medium text-zinc-900">
            目标岗位 JD
          </label>
          <Textarea
            id="jd"
            placeholder="粘贴目标岗位的 Job Description..."
            value={jd}
            onChange={(e) => onJdChange(e.target.value)}
            className="min-h-[320px]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="focus" className="text-sm font-medium text-zinc-900">
          优化侧重（可选）
        </label>
        <Textarea
          id="focus"
          placeholder="例如：突出 AI 产品经验、强化量化成果..."
          value={focus}
          onChange={(e) => onFocusChange(e.target.value)}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}
