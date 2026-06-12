"use client";

import type { EvidenceAudit } from "@/lib/schema";

type EvidenceAuditAlertProps = {
  audit: EvidenceAudit;
};

export function EvidenceAuditAlert({ audit }: EvidenceAuditAlertProps) {
  if (!audit.hasFabricationRisk) {
    return (
      <div className="rounded-xl border border-primary-border bg-primary-soft px-4 py-3 text-sm text-primary-muted">
        <p className="font-medium">可信度检查</p>
        {audit.retried ? (
          <p className="mt-1 text-xs text-success">
            已自动重试修正{audit.retryImproved ? "，当前通过" : ""}
          </p>
        ) : null}
        {audit.sanitized ? (
          <p className="mt-1 text-xs text-success">
            已对无依据内容做自动清洗
          </p>
        ) : null}
        <p className="mt-1 text-xs">{audit.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <p className="font-semibold">检测到可能的捏造数据</p>
      {audit.retried ? (
        <p className="mt-1 text-xs">
          系统已自动重试一轮
          {audit.retryImproved ? "并选用较好版本，" : "但未完全消除风险，"}
          请人工核对。
        </p>
      ) : null}
      {audit.sanitized ? (
        <p className="mt-1 text-xs">
          已对无依据数字/缺口泄漏行做自动清洗，请仍逐条核对改写内容。
        </p>
      ) : null}
      <p className="mt-1 text-xs leading-relaxed">{audit.message}</p>
      {audit.fabricatedMetrics.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs">
          {audit.fabricatedMetrics.map((metric) => (
            <li key={metric}>
              改写中出现「{metric}」，原文未找到对应依据
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs">
        建议：删除无依据的数字，或改回原文表述后再投递。捏造数据会严重影响面试信任。
      </p>
    </div>
  );
}
