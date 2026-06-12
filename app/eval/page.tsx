import { EvalBlindClient } from "@/components/eval/EvalBlindClient";

export const metadata = {
  title: "简历优化盲评 | Resume Optimizer",
  description: "本地评测：人工盲评简历优化产出",
};

export default function EvalPage() {
  return (
    <main className="min-h-dvh bg-background">
      <EvalBlindClient />
    </main>
  );
}
