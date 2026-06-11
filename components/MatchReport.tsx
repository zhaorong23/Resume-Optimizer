"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchReport } from "@/lib/schema";

type MatchReportProps = {
  report: MatchReport;
};

export function MatchReportCard({ report }: MatchReportProps) {
  const scoreColor =
    report.matchScore >= 80
      ? "text-emerald-600"
      : report.matchScore >= 60
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>匹配报告</span>
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {report.matchScore}
            <span className="text-base font-normal text-muted"> / 100</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted">
        <ReportSection title="已匹配优势" items={report.matched} color="emerald" />
        <ReportSection title="待补缺口" items={report.gaps} color="rose" />
        <ReportSection title="改进建议" items={report.suggestions} color="primary" />
      </CardContent>
    </Card>
  );
}

function ReportSection({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: "emerald" | "rose" | "primary";
}) {
  const dotColor = {
    emerald: "bg-success",
    rose: "bg-destructive",
    primary: "bg-primary",
  }[color];

  return (
    <div>
      <p className="mb-2 font-medium text-foreground">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
