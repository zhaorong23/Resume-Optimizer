"use client";

import type { RubricDimension } from "@/scripts/lib/rubric";
import { RUBRIC_DIMENSION_META } from "@/lib/eval/constants";

type ScoreSliderProps = {
  dimension: RubricDimension;
  value: number;
  onChange: (value: number) => void;
};

export function ScoreSlider({ dimension, value, onChange }: ScoreSliderProps) {
  const meta = RUBRIC_DIMENSION_META[dimension];

  return (
    <label className="block space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{meta.label}</span>
        <span className="text-sm font-semibold text-primary">{value} / 5</span>
      </div>
      <p className="text-xs text-muted">{meta.hint}</p>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--primary)]"
      />
      <div className="flex justify-between text-[10px] text-muted">
        <span>1 差</span>
        <span>3 及格</span>
        <span>5 优秀</span>
      </div>
    </label>
  );
}
