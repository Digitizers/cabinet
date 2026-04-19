"use client";

import { Bot, Clock3, HeartPulse, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAgentColor, tintFromHex } from "@/lib/agents/cron-compute";
import { resolveAgentIcon } from "@/lib/agents/icon-catalog";
import { CABINET_VISIBILITY_OPTIONS } from "@/lib/cabinets/visibility";
import type { CabinetAgentSummary, CabinetVisibilityMode } from "@/types/cabinets";
import type { ConversationMeta } from "@/types/conversations";

export type TriggerFilter = "all" | "manual" | "job" | "heartbeat";

/**
 * Two-row filter bar:
 *  Row 1 — visibility depth segmented control + trigger chips.
 *  Row 2 — agent pills (horizontally scrollable). Hidden when no agents.
 *
 * Agent filter is client-side (the hook fetches everything for the cabinet).
 * Visibility + trigger are stateful in the parent; we just render the UI.
 */
export function FilterBar({
  agents,
  agentFilter,
  onAgentChange,
  visibilityMode,
  onVisibilityChange,
  triggerFilter,
  onTriggerChange,
}: {
  agents: CabinetAgentSummary[];
  agentFilter: string | null;
  onAgentChange: (slug: string | null) => void;
  visibilityMode: CabinetVisibilityMode;
  onVisibilityChange: (mode: CabinetVisibilityMode) => void;
  triggerFilter: TriggerFilter;
  onTriggerChange: (filter: TriggerFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/60 px-4 py-2 text-[11px]">
      {/* Row 1: visibility depth + trigger chips */}
      <div className="flex items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-md border border-border/60 bg-card">
          {CABINET_VISIBILITY_OPTIONS.map((opt) => {
            const active = visibilityMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onVisibilityChange(opt.value)}
                title={opt.label}
                className={cn(
                  "px-2 py-0.5 text-[10.5px] font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {opt.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-border/60" />

        <div className="flex items-center gap-1">
          <TriggerChip
            active={triggerFilter === "all"}
            onClick={() => onTriggerChange("all")}
          >
            All
          </TriggerChip>
          <TriggerChip
            active={triggerFilter === "manual"}
            onClick={() => onTriggerChange("manual")}
            icon={<Bot className="size-3" />}
            tone="sky"
          >
            Manual
          </TriggerChip>
          <TriggerChip
            active={triggerFilter === "job"}
            onClick={() => onTriggerChange("job")}
            icon={<Clock3 className="size-3" />}
            tone="emerald"
          >
            Jobs
          </TriggerChip>
          <TriggerChip
            active={triggerFilter === "heartbeat"}
            onClick={() => onTriggerChange("heartbeat")}
            icon={<HeartPulse className="size-3" />}
            tone="pink"
          >
            Heartbeat
          </TriggerChip>
        </div>
      </div>

      {/* Row 2: agent pills */}
      {agents.length > 0 ? (
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="size-3" />
            Agents
          </span>
          <button
            type="button"
            onClick={() => onAgentChange(null)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-0.5 font-medium transition-colors",
              agentFilter === null
                ? "border-foreground bg-foreground text-background"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            All agents
          </button>
          {agents.map((agent) => {
            const active = agentFilter === agent.slug;
            const tint = agent.color ? tintFromHex(agent.color) : getAgentColor(agent.slug);
            const Icon = resolveAgentIcon(agent.slug, agent.iconKey ?? null);
            return (
              <button
                key={agent.scopedId}
                type="button"
                onClick={() => onAgentChange(active ? null : agent.slug)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors",
                  active ? "border-foreground" : "border-transparent hover:border-border/60"
                )}
                style={
                  active
                    ? { backgroundColor: tint.bg, color: tint.text }
                    : { backgroundColor: tint.bg, color: tint.text, opacity: 0.65 }
                }
                title={
                  agent.active
                    ? agent.displayName ?? agent.name
                    : `${agent.displayName ?? agent.name} (paused)`
                }
              >
                <Icon className="size-3" />
                {agent.displayName ?? agent.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const TRIGGER_TONES: Record<string, string> = {
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-sky-500/20",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  pink: "bg-pink-500/15 text-pink-600 dark:text-pink-400 ring-pink-500/20",
};

function TriggerChip({
  active,
  onClick,
  children,
  icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "sky" | "emerald" | "pink";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
        active
          ? tone
            ? cn("ring-1", TRIGGER_TONES[tone])
            : "bg-foreground text-background"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * Map a TriggerFilter to the underlying conversation trigger (undefined = all).
 */
export function triggerFromFilter(
  filter: TriggerFilter
): ConversationMeta["trigger"] | undefined {
  return filter === "all" ? undefined : filter;
}
