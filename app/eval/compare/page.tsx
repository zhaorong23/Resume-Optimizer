import { EvalCompareClient } from "@/components/eval/EvalCompareClient";

export const metadata = {
  title: "Rubric 校准比对 | Resume Optimizer",
  description: "人工评分与自动 Rubric 比对",
};

export default function EvalComparePage() {
  return (
    <main className="min-h-dvh bg-background">
      <EvalCompareClient />
    </main>
  );
}
