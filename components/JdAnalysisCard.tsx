"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JdAnalysis } from "@/lib/schema";

type JdAnalysisCardProps = {
  analysis: JdAnalysis;
};

export function JdAnalysisCard({ analysis }: JdAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>JD 解读 — {analysis.roleTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted">
        <Section title="核心职责" items={analysis.responsibilities} />
        <Section title="硬技能" items={analysis.hardSkills} />
        <Section title="软技能" items={analysis.softSkills} />
        <Section title="关键词" items={analysis.keywords} variant="tag" />
        <p>
          <span className="font-medium text-foreground">招聘侧重：</span>
          {analysis.priority}
        </p>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  items,
  variant = "list",
}: {
  title: string;
  items: string[];
  variant?: "list" | "tag";
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 font-medium text-foreground">{title}</p>
      {variant === "tag" ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="tag-chip tag-chip-active"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <ul className="list-inside list-disc space-y-1">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
