"use client";

import { Rows2, Rows4 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BoardDensity = "comfortable" | "compact";

export function DensityToggle({
  value,
  onChange,
}: {
  value: BoardDensity;
  onChange: (v: BoardDensity) => void;
}) {
  const other: BoardDensity = value === "compact" ? "comfortable" : "compact";
  const Icon = value === "compact" ? Rows4 : Rows2;
  return (
    <button
      type="button"
      onClick={() => onChange(other)}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      title={value === "compact" ? "Comfortable rows" : "Compact rows"}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
