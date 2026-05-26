"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OptimizeResult } from "@/lib/schema";
import { Check, Copy, Download } from "lucide-react";

type ExportBarProps = {
  result: OptimizeResult;
};

export function ExportBar({ result }: ExportBarProps) {
  const [copied, setCopied] = useState(false);

  const markdown = buildMarkdown(result);

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "optimized-resume.txt";
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
        下载 .txt
      </Button>
    </div>
  );
}

function buildMarkdown(result: OptimizeResult): string {
  const lines = [
    `# 优化后简历 — ${result.jdAnalysis.roleTitle}`,
    "",
    `> 匹配度：${result.matchReport.matchScore}/100`,
    "",
    ...result.sections.flatMap((section) => [
      `## ${section.title}`,
      "",
      section.rewritten,
      "",
    ]),
    "---",
    result.disclaimer,
  ];

  return lines.join("\n");
}
