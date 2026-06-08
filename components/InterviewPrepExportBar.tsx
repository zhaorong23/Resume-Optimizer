"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildInterviewPrepMarkdown } from "@/lib/interview-prep/markdown";
import type { InterviewPrepResult } from "@/lib/interview-prep/schema";

type InterviewPrepExportBarProps = {
  result: InterviewPrepResult;
  companyName: string;
  roleTitle?: string;
};

export function InterviewPrepExportBar({
  result,
  companyName,
  roleTitle,
}: InterviewPrepExportBarProps) {
  const [copied, setCopied] = useState(false);
  const markdown = buildInterviewPrepMarkdown(result, companyName, roleTitle);

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interview-prep-${companyName}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={handleCopy} variant="outline">
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            已复制
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            复制 Markdown
          </>
        )}
      </Button>
      <Button onClick={handleDownload} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        下载 .md
      </Button>
    </div>
  );
}
