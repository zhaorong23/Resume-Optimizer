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
              <div className="rounded-lg bg-zinc-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  原文
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                  {section.original}
                </p>
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-600">
                  改写
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
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
