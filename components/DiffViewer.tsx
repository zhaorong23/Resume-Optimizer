"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumeSection } from "@/lib/schema";

type DiffViewerProps = {
  sections: ResumeSection[];
};

export function DiffViewer({ sections }: DiffViewerProps) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg bg-surface p-4">
                <p className="section-label mb-2">原文</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {section.original}
                </p>
              </div>
              <div className="rounded-md border border-primary-border bg-primary-soft p-4">
                <p className="section-label mb-2 text-primary-muted">改写建议</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {section.rewritten}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
