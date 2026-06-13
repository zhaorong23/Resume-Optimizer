"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InterviewPrepExportBar } from "@/components/InterviewPrepExportBar";
import { formatMatchLevel } from "@/lib/interview-prep/format";
import {
  getRoleTrackLabel,
  type PmFlavor,
} from "@/lib/interview-prep/infer-role-type";
import type { GapItem, InterviewPrepResult, RoleType } from "@/lib/interview-prep/schema";
import { cn } from "@/lib/utils";

type InterviewPrepPanelProps = {
  result: InterviewPrepResult;
  companyName: string;
  roleTitle?: string;
  roleType?: RoleType;
  pmFlavor?: PmFlavor;
};

type SectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-semibold text-foreground">{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted" />
        )}
      </button>
      {open && <CardContent className="border-t pt-4">{children}</CardContent>}
    </Card>
  );
}

export function InterviewPrepPanel({
  result,
  companyName,
  roleTitle,
  roleType = "pm",
  pmFlavor,
}: InterviewPrepPanelProps) {
  const trackLabel = getRoleTrackLabel(roleType, pmFlavor);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">面试准备</h2>
          <p className="mt-1 text-sm text-muted">
            {companyName}
            {roleTitle ? ` · ${roleTitle}` : ""} · 求职赛道：{trackLabel} ·{" "}
            {result.mode} 模式
            {result.searchFailed ? " · 联网调研已降级" : ""}
          </p>
        </div>
        <InterviewPrepExportBar
          result={result}
          companyName={companyName}
          roleTitle={roleTitle}
        />
      </div>

      {result.gapChecklist.priority1.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-900">
              优先级 1 — 面试前必补
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900">
            {result.gapChecklist.priority1.map((item) => (
              <p key={item.content}>
                • {item.content} → {item.action}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <CollapsibleSection title="三、定制自我介绍" defaultOpen>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {result.selfIntro}
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="一、公司与产品调研">
        <div className="space-y-3 text-sm text-muted">
          <p>{result.companyResearch.overview}</p>
          <p className="font-medium text-foreground">面经风格</p>
          <p>{result.companyResearch.interviewStyle}</p>
          {result.companyResearch.competitors.length > 0 && (
            <>
              <p className="font-medium text-foreground">竞品格局</p>
              <ul className="list-disc space-y-1 pl-5">
                {result.companyResearch.competitors.map((item) => (
                  <li key={item.name}>
                    <strong>{item.name}</strong>：{item.comparison}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="二、JD 深度解读与匹配">
        <div className="space-y-4 text-sm text-muted">
          <p>{result.jdIntent}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-2 pr-3">JD 要求</th>
                  <th className="py-2 pr-3">简历依据</th>
                  <th className="py-2 pr-3">匹配</th>
                  <th className="py-2">面试策略</th>
                </tr>
              </thead>
              <tbody>
                {result.jdLineMatches.map((row) => (
                  <tr
                    key={row.jdRequirement}
                    className="border-b border-zinc-100 align-top"
                  >
                    <td className="py-2 pr-3">{row.jdRequirement}</td>
                    <td className="py-2 pr-3">{row.resumeEvidence}</td>
                    <td className="py-2 pr-3">
                      {formatMatchLevel(row.matchLevel)}
                    </td>
                    <td className="py-2">{row.interviewStrategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="四、项目深挖（STAR）">
        <div className="space-y-6">
          {result.projectDeepDives.map((project) => (
            <div key={project.projectName} className="space-y-2 text-sm">
              <h4 className="font-semibold text-foreground">
                {project.projectName}
              </h4>
              <ul className="space-y-1 text-muted">
                <li>
                  <strong>情境</strong>：{project.star.situation}
                </li>
                <li>
                  <strong>任务</strong>：{project.star.task}
                </li>
                <li>
                  <strong>行动</strong>：{project.star.action}
                </li>
                <li>
                  <strong>结果</strong>：{project.star.result}
                </li>
              </ul>
              {project.followUps.length > 0 && (
                <div className="mt-2 space-y-2 rounded-lg bg-zinc-50 p-3">
                  {project.followUps.map((item) => (
                    <div key={item.question}>
                      <p className="font-medium text-foreground">
                        Q：{item.question}
                      </p>
                      <p className="text-zinc-600">A：{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="五、高频面试问题">
        <div className="space-y-4">
          {result.commonQuestions.map((q) => (
            <div key={q.question} className="text-sm">
              <p className="font-medium text-foreground">{q.question}</p>
              <p className="mt-1 text-xs text-muted">
                来源：{q.source}
                {q.examiningPoint ? ` · ${q.examiningPoint}` : ""}
              </p>
              {q.passAnswer || q.strongAnswer ? (
                <div className="mt-2 space-y-2">
                  {q.passAnswer ? (
                    <p className="text-muted">
                      <span className="font-medium text-foreground">
                        及格答法：
                      </span>
                      {q.passAnswer}
                    </p>
                  ) : null}
                  {q.strongAnswer ? (
                    <p className="text-muted">
                      <span className="font-medium text-foreground">
                        加分答法：
                      </span>
                      {q.strongAnswer}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-1 text-muted">{q.referenceAnswer}</p>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="六、产品设计思考">
        <div className="space-y-3 text-sm text-muted">
          {result.designObservations.highlights.map((item) => (
            <p key={item.observation}>
              <strong>{item.observation}</strong> — {item.judgment}
            </p>
          ))}
          {result.designObservations.challenges.map((item) => (
            <p key={item}>挑战：{item}</p>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="七、反问清单">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          {result.reverseQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </CollapsibleSection>

      <CollapsibleSection title="附、Gap 清单">
        <GapGroup title="优先级 2" items={result.gapChecklist.priority2} />
        <GapGroup title="优先级 3" items={result.gapChecklist.priority3} />
      </CollapsibleSection>

      {result.sources.length > 0 && (
        <p className="text-center text-xs text-zinc-400">
          来源 {result.sources.length} 条 · {result.disclaimer}
        </p>
      )}
    </div>
  );
}

function GapGroup({
  title,
  items,
}: {
  title: string;
  items: GapItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <p className={cn("mb-2 text-sm font-medium text-foreground")}>{title}</p>
      <ul className="space-y-2 text-sm text-muted">
        {items.map((item) => (
          <li key={item.content}>
            • {item.content} → {item.action}
          </li>
        ))}
      </ul>
    </div>
  );
}
