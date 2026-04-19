"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Circle,
  CircleAlert,
  Loader2,
  Pause,
  Play,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildConversationInstanceKey } from "@/lib/agents/conversation-identity";
import { deriveStatus } from "@/lib/agents/conversation-to-task-view";
import { formatRelative } from "./cabinet-utils";
import type { ConversationMeta } from "@/types/conversations";
import type { TaskStatus } from "@/types/tasks";

interface ActivityFeedProps {
  cabinetPath: string;
  visibilityMode: string;
  onOpen: (conv: ConversationMeta) => void;
  onOpenWorkspace: () => void;
}

const STATUS_META: Record<
  TaskStatus,
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  idle: { label: "Idle", tone: "bg-muted text-muted-foreground", icon: Circle },
  running: {
    label: "Running",
    tone: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    icon: Play,
  },
  "awaiting-input": {
    label: "Awaiting input",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    icon: Pause,
  },
  done: {
    label: "Done",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    tone: "bg-red-500/15 text-red-700 dark:text-red-400",
    icon: CircleAlert,
  },
  archived: { label: "Archived", tone: "bg-muted text-muted-foreground", icon: Archive },
};

function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
        meta.tone
      )}
    >
      <Icon className="size-2.5" />
      {meta.label}
    </span>
  );
}

function runtimeLabel(conv: ConversationMeta): string | null {
  const config = conv.adapterConfig as { model?: string; effort?: string } | undefined;
  const parts = [config?.model, conv.providerId].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : null;
}

export function ActivityFeed({
  cabinetPath,
  visibilityMode,
  onOpen,
  onOpenWorkspace,
}: ActivityFeedProps) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams({ cabinetPath, limit: "20" });
      if (visibilityMode !== "own") params.set("visibilityMode", visibilityMode);
      const res = await fetch(`/api/agents/conversations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConversations((data.conversations || []) as ConversationMeta[]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [cabinetPath, visibilityMode]);

  useEffect(() => {
    void refresh();
    const iv = setInterval(() => void refresh(), 6000);
    return () => clearInterval(iv);
  }, [refresh]);

  // Pin running conversations to top
  const sorted = useMemo(() => {
    const running = conversations.filter((c) => c.status === "running");
    const rest = conversations.filter((c) => c.status !== "running");
    return [...running, ...rest];
  }, [conversations]);

  const runningCount = sorted.filter((c) => c.status === "running").length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[1.65rem] font-semibold tracking-tight text-foreground">
            Activity
          </h2>
          <p className="text-[12px] text-muted-foreground">
            {loading ? "Loading..." : `${conversations.length} recent`}
            {runningCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {runningCount} running
              </span>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-xs"
          onClick={onOpenWorkspace}
        >
          <Users className="h-3.5 w-3.5" />
          View all
        </Button>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading activity...
        </div>
      ) : sorted.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          No conversations yet. Run a heartbeat or send a task to an agent.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          {sorted.map((conv) => {
            const status = deriveStatus(conv);
            const runtime = runtimeLabel(conv);
            const tokens = conv.tokens?.total ?? 0;
            return (
              <li key={buildConversationInstanceKey(conv)}>
                <button
                  type="button"
                  onClick={() => onOpen(conv)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="mt-0.5">
                    <StatusBadge status={status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-[13.5px] font-medium text-foreground">
                        {conv.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelative(conv.lastActivityAt || conv.startedAt)}
                      </span>
                    </div>
                    {conv.summary ? (
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                        {conv.summary}
                      </p>
                    ) : null}
                    {(runtime || tokens > 0) && (
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground/80">
                        {runtime ? <span>{runtime}</span> : null}
                        {runtime && tokens > 0 ? <span>·</span> : null}
                        {tokens > 0 ? (
                          <span className="font-mono tabular-nums">
                            {(tokens / 1000).toFixed(1)}k tok
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
