"use client";

import { useMemo, useState } from "react";
import { ComposerInput } from "@/components/composer/composer-input";
import {
  TaskRuntimePicker,
  type TaskRuntimeSelection,
} from "@/components/composer/task-runtime-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useComposer, type MentionableItem } from "@/hooks/use-composer";
import { useTreeStore } from "@/stores/tree-store";
import { flattenTree } from "@/lib/tree-utils";
import { createConversation } from "@/lib/agents/conversation-client";
import type { CabinetAgentSummary } from "@/types/cabinets";
import { ChevronDown } from "lucide-react";

const PLACEHOLDERS = [
  "Write a blog post about our Q2 results...",
  "Analyze user churn and suggest three concrete improvements...",
  "Review last week's metrics and flag anything unusual...",
  "Draft a partnership proposal for the Acme integration...",
  "Summarize key insights from customer discovery interviews...",
  "Prepare a competitive landscape update for the board...",
  "Create a rollout plan for the new onboarding flow...",
  "Audit our pricing page and suggest A/B test ideas...",
];

export function NewTaskDialog({
  open,
  onOpenChange,
  cabinetPath,
  agents,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabinetPath: string;
  agents: CabinetAgentSummary[];
  onStarted?: (conversationId: string, conversationCabinetPath?: string) => void;
}) {
  const treeNodes = useTreeStore((s) => s.nodes);
  const [taskRuntime, setTaskRuntime] = useState<TaskRuntimeSelection>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = useMemo(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  );

  const defaultAgent = useMemo(() => {
    const active = agents.find((a) => a.active) ?? agents[0];
    return active ?? null;
  }, [agents]);

  const [selectedAgentSlug, setSelectedAgentSlug] = useState<string>(
    () => defaultAgent?.slug ?? ""
  );

  const selectedAgent = useMemo(
    () => agents.find((a) => a.slug === selectedAgentSlug) ?? defaultAgent,
    [agents, selectedAgentSlug, defaultAgent]
  );

  const mentionItems: MentionableItem[] = useMemo(
    () => [
      ...agents.map((a) => ({
        type: "agent" as const,
        id: a.slug,
        label: a.displayName ?? a.name,
        sublabel: a.role ?? "",
        icon: a.emoji,
      })),
      ...flattenTree(treeNodes).map((p) => ({
        type: "page" as const,
        id: p.path,
        label: p.title,
        sublabel: p.path,
      })),
    ],
    [agents, treeNodes]
  );

  const composer = useComposer({
    items: mentionItems,
    onSubmit: async ({ message, mentionedPaths }) => {
      const resolvedAgent = selectedAgent;
      if (!resolvedAgent) {
        setError("No agent available to run this task.");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const result = await createConversation({
          agentSlug: resolvedAgent.slug,
          userMessage: message,
          mentionedPaths,
          cabinetPath: resolvedAgent.cabinetPath || cabinetPath,
          ...taskRuntime,
        });
        onOpenChange(false);
        onStarted?.(result.conversation.id, result.conversation.cabinetPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start task");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-visible p-0 sm:max-w-xl">
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="text-xl font-semibold">What needs to get done?</DialogTitle>
        </DialogHeader>
        <ComposerInput
          composer={composer}
          placeholder={placeholder}
          submitLabel="Start"
          variant="inline"
          items={mentionItems}
          autoFocus
          minHeight="100px"
          maxHeight="260px"
          mentionDropdownPlacement="below"
          actionsStart={
            <>
              <TaskRuntimePicker value={taskRuntime} onChange={setTaskRuntime} />
              {agents.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Select agent"
                  >
                    {selectedAgent?.emoji && (
                      <span className="text-[13px] leading-none">{selectedAgent.emoji}</span>
                    )}
                    <span className="max-w-[7rem] truncate font-medium">
                      {selectedAgent?.displayName ?? selectedAgent?.name ?? "Agent"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[160px]">
                    {agents.map((agent) => (
                      <DropdownMenuItem
                        key={agent.slug}
                        onSelect={() => setSelectedAgentSlug(agent.slug)}
                        className="gap-2"
                      >
                        {agent.emoji && <span className="text-[13px]">{agent.emoji}</span>}
                        <span className="truncate">{agent.displayName ?? agent.name}</span>
                        {agent.slug === selectedAgent?.slug && (
                          <span className="ml-auto text-[10px] text-muted-foreground">active</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          }
          footer={
            error || submitting ? (
              <div className="px-4 pb-2.5 text-[11px]">
                {error ? (
                  <span className="text-destructive">{error}</span>
                ) : (
                  <span className="text-muted-foreground/60">Starting…</span>
                )}
              </div>
            ) : null
          }
        />
      </DialogContent>
    </Dialog>
  );
}
