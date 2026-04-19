"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Code2,
  Megaphone,
  PencilLine,
  Rocket,
  ShieldCheck,
  Inbox,
  MessageCircleQuestion,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Circle,
  ArrowDownToLine,
  Archive,
  ChevronDown,
  ChevronRight,
  Play,
  RotateCcw,
  X,
  Pause,
  Send,
  Filter,
  Search,
  KanbanSquare,
  LayoutList,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tintFromHex } from "@/lib/agents/cron-compute";

type AgentSlug = "cto" | "pm" | "growth" | "qa" | "editor";
type LaneKey = "inbox" | "needs" | "running" | "done" | "archive";

interface AgentDef {
  slug: AgentSlug;
  name: string;
  color: string;
  icon: typeof Code2;
  paused?: boolean;
}

const AGENTS: Record<AgentSlug, AgentDef> = {
  cto: { slug: "cto", name: "CTO", color: "#6366f1", icon: Code2 },
  pm: { slug: "pm", name: "PM", color: "#10b981", icon: Rocket },
  growth: { slug: "growth", name: "Growth", color: "#f59e0b", icon: Megaphone },
  qa: { slug: "qa", name: "QA", color: "#f43f5e", icon: ShieldCheck, paused: true },
  editor: { slug: "editor", name: "Editor", color: "#8b5cf6", icon: PencilLine },
};

interface Turn {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool?: string;
  streaming?: boolean;
  minutesAgo: number;
}

interface DemoTask {
  id: string;
  title: string;
  agent: AgentSlug;
  lane: LaneKey;
  state: "running" | "ask" | "failed" | "just-done" | "idle" | "handoff";
  minutesAgo: number;
  turns: Turn[];
  handoffFrom?: AgentSlug;
}

const TASKS: DemoTask[] = [
  {
    id: "t1",
    title: "Review the auth middleware rewrite and flag compliance gaps",
    agent: "cto",
    lane: "inbox",
    state: "handoff",
    minutesAgo: 4,
    handoffFrom: "pm",
    turns: [
      {
        id: "t1-1",
        role: "system",
        content: "Handed off from PM · 4m ago",
        minutesAgo: 4,
      },
    ],
  },
  {
    id: "t2",
    title: "Polish the launch email draft for the Series A announcement",
    agent: "growth",
    lane: "inbox",
    state: "idle",
    minutesAgo: 22,
    turns: [],
  },
  {
    id: "t3",
    title: "Design the billing page — confirm pricing tiers with finance",
    agent: "cto",
    lane: "needs",
    state: "ask",
    minutesAgo: 12,
    turns: [
      { id: "t3-1", role: "user", content: "Design the billing page. Three tiers, match our landing page brand.", minutesAgo: 18 },
      { id: "t3-2", role: "assistant", content: "Starting with the three-tier layout — Starter, Team, Enterprise. Before I commit the Enterprise tier, is pricing seat-based ($99/seat/mo) or usage-based (per 1k events)?", minutesAgo: 12 },
    ],
  },
  {
    id: "t4",
    title: "Week-1 onboarding flow — which channels count as activated?",
    agent: "pm",
    lane: "needs",
    state: "ask",
    minutesAgo: 38,
    turns: [
      { id: "t4-1", role: "user", content: "Build the week-1 onboarding flow. Goal is activation by day 7.", minutesAgo: 44 },
      { id: "t4-2", role: "assistant", content: "Outlined 5 checkpoints: signup → first page → first agent → first task → first shared link. Quick question — does 'activated' mean all five, or any three of the five?", minutesAgo: 38 },
    ],
  },
  {
    id: "t5",
    title: "Production outage RCA — 2026-04-18 API timeout spike",
    agent: "cto",
    lane: "needs",
    state: "failed",
    minutesAgo: 58,
    turns: [
      { id: "t5-1", role: "user", content: "Investigate the 2026-04-18 API timeout spike between 14:20–14:55 UTC.", minutesAgo: 62 },
      { id: "t5-2", role: "assistant", content: "Pulling gateway logs for that window.", minutesAgo: 61 },
      { id: "t5-3", role: "tool", content: "", tool: "read /logs/api-gateway/2026-04-18.jsonl", minutesAgo: 60 },
      { id: "t5-4", role: "system", content: "Error: file 4.2 GB — exceeds read budget. No streaming fallback configured.", minutesAgo: 58 },
    ],
  },
  {
    id: "t6",
    title: "Draft Q2 board deck — revenue and hiring slides",
    agent: "pm",
    lane: "running",
    state: "running",
    minutesAgo: 1,
    turns: [
      { id: "t6-1", role: "user", content: "Draft the Q2 board deck. Start with revenue and hiring.", minutesAgo: 55 },
      { id: "t6-2", role: "assistant", content: "Starting with revenue. Pulling Q1 ARR from the finance sheet.", minutesAgo: 54 },
      { id: "t6-3", role: "tool", content: "", tool: "read /data/finance/arr-2026-q1.csv", minutesAgo: 53 },
      { id: "t6-4", role: "assistant", content: "Revenue grew 47% QoQ to $4.2M ARR. Enterprise is 62% of new bookings. Drafting slide 3 (revenue narrative) and slide 4 (segment mix).", minutesAgo: 25 },
      { id: "t6-5", role: "tool", content: "", tool: "write /data/decks/q2-board/03-revenue.md", minutesAgo: 24 },
      { id: "t6-6", role: "tool", content: "", tool: "write /data/decks/q2-board/04-segment-mix.md", minutesAgo: 23 },
      { id: "t6-7", role: "assistant", content: "Revenue slides done. Moving to hiring — pulling headcount and open reqs from the org chart.", minutesAgo: 3 },
      { id: "t6-8", role: "tool", content: "", tool: "read /data/people/org-chart.yaml", minutesAgo: 2 },
      { id: "t6-9", role: "assistant", content: "Headcount 34 → 51 over the quarter, 8 open reqs concentrated in eng. Drafting the hiring narrative now", streaming: true, minutesAgo: 0 },
    ],
  },
  {
    id: "t7",
    title: "Competitor sweep — pricing changes in the last 30 days",
    agent: "growth",
    lane: "running",
    state: "running",
    minutesAgo: 3,
    turns: [
      { id: "t7-1", role: "user", content: "Weekly competitor sweep — any pricing changes in the last 30 days?", minutesAgo: 6 },
      { id: "t7-2", role: "assistant", content: "Scanning 12 sources.", minutesAgo: 5 },
      { id: "t7-3", role: "tool", content: "", tool: "fetch https://competitor-a.com/pricing", minutesAgo: 4 },
      { id: "t7-4", role: "tool", content: "", tool: "fetch https://competitor-b.com/pricing", minutesAgo: 4 },
      { id: "t7-5", role: "assistant", content: "Found 3 changes so far: Competitor A raised their Team tier from $49 to $59. Competitor B dropped their free tier seat limit from 5 to 3", streaming: true, minutesAgo: 0 },
    ],
  },
  {
    id: "t8",
    title: "E2E test coverage — auth + checkout flows",
    agent: "qa",
    lane: "running",
    state: "running",
    minutesAgo: 6,
    turns: [
      { id: "t8-1", role: "user", content: "Run E2E coverage on auth and checkout. Flag any flakes.", minutesAgo: 8 },
      { id: "t8-2", role: "tool", content: "", tool: "exec npx playwright test auth checkout --reporter=line", minutesAgo: 7 },
      { id: "t8-3", role: "assistant", content: "Playwright running. 12/34 tests complete, 0 failures, 1 flaky retry on checkout-coupon", streaming: true, minutesAgo: 0 },
    ],
  },
  {
    id: "t9",
    title: "Write Voldemort poems for the Halloween campaign",
    agent: "editor",
    lane: "done",
    state: "just-done",
    minutesAgo: 11,
    turns: [
      { id: "t9-1", role: "user", content: "Write 3 Voldemort-themed poems for the Halloween campaign. Playful, not scary.", minutesAgo: 34 },
      { id: "t9-2", role: "assistant", content: "Drafting three with different tones — mock-dramatic, wistful, and absurd. Tone pass next.", minutesAgo: 30 },
      { id: "t9-3", role: "assistant", content: "Delivered: 'Ode to a Nose', 'Horcrux Haiku', and 'Dear Harry (Apology Edition)'. Saved to /halloween/poems.md. Want any tone adjustments before we send to Growth?", minutesAgo: 11 },
    ],
  },
  {
    id: "t10",
    title: "Weekly digest — summarize last week's commits",
    agent: "cto",
    lane: "done",
    state: "just-done",
    minutesAgo: 41,
    turns: [
      { id: "t10-1", role: "system", content: "Heartbeat trigger · weekly digest", minutesAgo: 45 },
      { id: "t10-2", role: "tool", content: "", tool: "exec git log --since=7.days.ago --oneline", minutesAgo: 44 },
      { id: "t10-3", role: "assistant", content: "Wrote /weekly/2026-W16.md. Themes: agent page v2 (8 commits), sidebar status-dot enrichment (3), task-board redesign PRD + demo (4). No merges to main blocked.", minutesAgo: 41 },
    ],
  },
  {
    id: "t11",
    title: "Migrate PostHog events to new naming scheme",
    agent: "growth",
    lane: "archive",
    state: "idle",
    minutesAgo: 60 * 27,
    turns: [],
  },
  {
    id: "t12",
    title: "Onboarding video script v1",
    agent: "editor",
    lane: "archive",
    state: "idle",
    minutesAgo: 60 * 50,
    turns: [],
  },
];

const LANES: { key: LaneKey; label: string; hint: string; icon: typeof Inbox }[] = [
  { key: "inbox", label: "Inbox", hint: "Waiting for you to start", icon: Inbox },
  { key: "needs", label: "Needs Reply", hint: "Asked a question or failed", icon: MessageCircleQuestion },
  { key: "running", label: "Running", hint: "Live right now", icon: Loader2 },
  { key: "done", label: "Just Finished", hint: "Completed in the last hour", icon: CheckCircle2 },
  { key: "archive", label: "Archive", hint: "Older and acknowledged", icon: Archive },
];

function relTime(mins: number): string {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function AgentPill({ agent, size = "md" }: { agent: AgentDef; size?: "md" | "sm" }) {
  const tint = tintFromHex(agent.color);
  const Icon = agent.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "md" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[10px]"
      )}
      style={{ backgroundColor: tint.bg, color: tint.text }}
    >
      <Icon className={size === "md" ? "size-3" : "size-2.5"} />
      {agent.name}
    </span>
  );
}

const STATUS_STYLE: Record<
  DemoTask["state"],
  { icon: LucideIcon; color: string; label: string; animate?: string }
> = {
  running: { icon: Loader2, color: "text-sky-500", label: "Running", animate: "animate-spin [animation-duration:1.6s]" },
  ask: { icon: MessageCircleQuestion, color: "text-amber-500", label: "Needs reply" },
  failed: { icon: AlertCircle, color: "text-red-500", label: "Failed" },
  "just-done": { icon: CheckCircle2, color: "text-emerald-500", label: "Just finished" },
  handoff: { icon: ArrowDownToLine, color: "text-violet-500", label: "Waiting to start" },
  idle: { icon: Circle, color: "text-muted-foreground/50", label: "Idle" },
};

function StatusIcon({ state, size = "sm" }: { state: DemoTask["state"]; size?: "sm" | "md" }) {
  const meta = STATUS_STYLE[state];
  const Icon = meta.icon;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", meta.color)}
      title={meta.label}
    >
      <Icon
        className={cn(size === "md" ? "size-4" : "size-3.5", meta.animate)}
        strokeWidth={2.25}
      />
    </span>
  );
}

function LaneHeader({
  lane,
  count,
  collapsed,
  onToggle,
}: {
  lane: (typeof LANES)[number];
  count: number;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const LaneIcon = lane.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left",
        onToggle ? "cursor-pointer hover:bg-muted/40" : "cursor-default"
      )}
    >
      <LaneIcon
        className={cn(
          "size-3.5 text-muted-foreground",
          lane.key === "running" && "animate-spin [animation-duration:3s]"
        )}
      />
      <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {lane.label}
      </span>
      <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
        {count}
      </span>
      {onToggle &&
        (collapsed ? (
          <ChevronRight className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        ))}
    </button>
  );
}

function TaskCard({
  task,
  onClick,
  isActive,
}: {
  task: DemoTask;
  onClick: () => void;
  isActive: boolean;
}) {
  const agent = AGENTS[task.agent];
  const fromAgent = task.handoffFrom ? AGENTS[task.handoffFrom] : null;
  const action =
    task.state === "handoff" ? { icon: Play, label: "Start" }
    : task.state === "failed" ? { icon: RotateCcw, label: "Retry" }
    : task.state === "ask" ? { icon: Send, label: "Resume" }
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-md border bg-card p-3 text-left transition-all",
        "hover:border-foreground/30 hover:shadow-sm",
        isActive
          ? "border-foreground/50 shadow-sm"
          : "border-border/60"
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIcon state={task.state} />
        <AgentPill agent={agent} />
        {fromAgent && (
          <span className="text-[10px] text-muted-foreground">
            from {fromAgent.name}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-foreground">
        {task.title}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[10.5px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <span>{relTime(task.minutesAgo)}</span>
        {task.turns.length > 0 && (
          <>
            <span>·</span>
            <span>
              {task.turns.length} turn{task.turns.length === 1 ? "" : "s"}
            </span>
          </>
        )}
        {action && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <action.icon className="size-2.5" />
            {action.label}
          </span>
        )}
      </div>
    </button>
  );
}

function PeopleRail({
  onAgentClick,
}: {
  onAgentClick: (slug: AgentSlug) => void;
}) {
  return (
    <aside
      className={cn(
        "group/rail relative z-10 flex h-full flex-col gap-1 border-l border-border/60 bg-background/80 backdrop-blur",
        "w-12 transition-[width] duration-200 hover:w-56"
      )}
    >
      <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground opacity-0 transition-opacity group-hover/rail:opacity-100">
        Agents
      </div>
      {Object.values(AGENTS).map((agent) => {
        const tint = tintFromHex(agent.color);
        const Icon = agent.icon;
        return (
          <button
            key={agent.slug}
            type="button"
            onClick={() => onAgentClick(agent.slug)}
            className="mx-1 flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-muted/60"
            title={`Hand off to ${agent.name}`}
          >
            <span
              className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: tint.bg, color: tint.text }}
            >
              <Icon className="size-4" />
              {agent.paused && (
                <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-3 items-center justify-center rounded-full bg-background ring-1 ring-border">
                  <Pause className="size-2 text-muted-foreground" />
                </span>
              )}
            </span>
            <span className="flex-1 overflow-hidden whitespace-nowrap opacity-0 transition-opacity group-hover/rail:opacity-100">
              <span className="block text-[12px] font-medium leading-tight text-foreground">
                {agent.name}
              </span>
              <span className="block text-[10px] leading-tight text-muted-foreground">
                {agent.paused ? "Paused" : "Ready"}
              </span>
            </span>
          </button>
        );
      })}
      <div className="mt-auto px-2 py-2 text-[10px] leading-snug text-muted-foreground opacity-0 transition-opacity group-hover/rail:opacity-100">
        Drop a card on an agent to hand off.
      </div>
    </aside>
  );
}

function TurnItem({ turn, agent }: { turn: Turn; agent: AgentDef }) {
  const tint = tintFromHex(agent.color);
  const Icon = agent.icon;

  if (turn.role === "user") {
    return (
      <li>
        <div className="mb-1 flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <span className="font-semibold">You</span>
          <span>·</span>
          <span>{relTime(turn.minutesAgo)}</span>
        </div>
        <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-[13px] leading-relaxed text-foreground">
          {turn.content}
        </div>
      </li>
    );
  }

  if (turn.role === "tool") {
    return (
      <li>
        <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="shrink-0 uppercase tracking-wider text-muted-foreground/70">tool</span>
          <span className="truncate text-foreground/80">{turn.tool}</span>
          <span className="ml-auto shrink-0 text-[10px]">{relTime(turn.minutesAgo)}</span>
        </div>
      </li>
    );
  }

  if (turn.role === "system") {
    return (
      <li>
        <div className="flex items-center gap-2 text-[11px] italic text-muted-foreground">
          <span className="h-px flex-1 bg-border/40" />
          <span>{turn.content}</span>
          <span className="h-px flex-1 bg-border/40" />
        </div>
      </li>
    );
  }

  // assistant
  return (
    <li>
      <div className="mb-1 flex items-center gap-2 text-[10.5px] uppercase tracking-wider">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold normal-case tracking-normal"
          style={{ backgroundColor: tint.bg, color: tint.text }}
        >
          <Icon className="size-2.5" />
          {agent.name}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {turn.streaming ? "now" : relTime(turn.minutesAgo)}
        </span>
        {turn.streaming && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 className="size-3 animate-spin text-sky-500" />
            <span className="normal-case tracking-normal">typing…</span>
          </span>
        )}
      </div>
      <div
        className="rounded-md border border-l-2 bg-card px-3 py-2 text-[13px] leading-relaxed text-foreground"
        style={{ borderLeftColor: tint.text }}
      >
        {turn.content}
        {turn.streaming && (
          <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-sky-500" />
        )}
      </div>
    </li>
  );
}

function DetailPanel({ task, onClose }: { task: DemoTask; onClose: () => void }) {
  const agent = AGENTS[task.agent];
  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-[440px] flex-col border-l border-border/70 bg-background shadow-xl">
      <header className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
        <StatusIcon state={task.state} size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <AgentPill agent={agent} />
            <span className="text-[10.5px] text-muted-foreground">
              {relTime(task.minutesAgo)}
            </span>
          </div>
          <h2 className="mt-1.5 text-[14px] font-semibold leading-snug text-foreground">
            {task.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-2">
        {task.state === "running" ? (
          <button className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted">
            <Pause className="size-3" /> Stop
          </button>
        ) : (
          <button className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted">
            <Play className="size-3" /> Start new run
          </button>
        )}
        <button className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted">
          <Archive className="size-3" /> Archive
        </button>
        <button className="ml-auto inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted">
          Reassign
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {task.turns.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 px-4 py-6 text-center text-[12px] text-muted-foreground">
            No messages yet. Click <span className="font-medium text-foreground">Start new run</span> or use the composer below.
          </div>
        ) : (
          <ol className="space-y-4">
            {task.turns.map((turn) => (
              <TurnItem key={turn.id} turn={turn} agent={agent} />
            ))}
          </ol>
        )}
      </div>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-end gap-2 rounded-md border border-border/60 bg-background px-3 py-2">
          <textarea
            placeholder="Send a new turn…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
          />
          <button className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background hover:bg-foreground/90">
            <Send className="size-3" /> Send
          </button>
        </div>
      </div>
    </aside>
  );
}

type ViewMode = "kanban" | "list" | "schedule";

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: LucideIcon }[] = [
  { key: "kanban", label: "Kanban", icon: KanbanSquare },
  { key: "list", label: "List", icon: LayoutList },
  { key: "schedule", label: "Schedule", icon: CalendarRange },
];

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-border/60 p-0.5">
      {VIEW_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  onClick,
  isActive,
  showTime = true,
}: {
  task: DemoTask;
  onClick: () => void;
  isActive: boolean;
  showTime?: boolean;
}) {
  const agent = AGENTS[task.agent];
  const fromAgent = task.handoffFrom ? AGENTS[task.handoffFrom] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors",
        "hover:bg-muted/40",
        isActive && "border-border/60 bg-muted/40"
      )}
    >
      <StatusIcon state={task.state} />
      <AgentPill agent={agent} />
      {fromAgent && (
        <span className="shrink-0 text-[10px] text-muted-foreground">from {fromAgent.name}</span>
      )}
      <span className="flex-1 truncate text-[13px] text-foreground">{task.title}</span>
      {task.turns.length > 0 && (
        <span className="shrink-0 text-[10.5px] text-muted-foreground">
          {task.turns.length} turn{task.turns.length === 1 ? "" : "s"}
        </span>
      )}
      {showTime && (
        <span className="w-20 shrink-0 text-right text-[10.5px] text-muted-foreground">
          {relTime(task.minutesAgo)}
        </span>
      )}
    </button>
  );
}

function ListView({
  byLane,
  selectedId,
  onSelect,
}: {
  byLane: Record<LaneKey, DemoTask[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      {LANES.map((lane) => {
        const items = byLane[lane.key];
        if (items.length === 0) return null;
        const LaneIcon = lane.icon;
        return (
          <section key={lane.key} className="rounded-lg border border-border/60 bg-muted/10">
            <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
              <LaneIcon
                className={cn(
                  "size-3.5 text-muted-foreground",
                  lane.key === "running" && "animate-spin [animation-duration:3s]"
                )}
              />
              <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {lane.label}
              </span>
              <span className="text-[10.5px] tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </header>
            <ul className="divide-y divide-border/40 px-2 py-1">
              {items.map((t) => (
                <li key={t.id}>
                  <TaskRow task={t} onClick={() => onSelect(t.id)} isActive={selectedId === t.id} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ScheduleView({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const buckets = useMemo(() => {
    const map: { label: string; items: DemoTask[] }[] = [
      { label: "Last 5 minutes", items: [] },
      { label: "Last hour", items: [] },
      { label: "Today", items: [] },
      { label: "Earlier", items: [] },
    ];
    for (const t of TASKS) {
      if (t.minutesAgo < 5) map[0].items.push(t);
      else if (t.minutesAgo < 60) map[1].items.push(t);
      else if (t.minutesAgo < 60 * 24) map[2].items.push(t);
      else map[3].items.push(t);
    }
    for (const b of map) b.items.sort((a, b2) => a.minutesAgo - b2.minutesAgo);
    return map.filter((b) => b.items.length > 0);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
      {buckets.map((bucket) => (
        <section key={bucket.label} className="relative">
          <div className="sticky top-0 z-[1] -mx-1 mb-2 bg-background/95 px-1 py-1 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {bucket.label}
              </span>
              <span className="h-px flex-1 bg-border/60" />
              <span className="text-[10.5px] tabular-nums text-muted-foreground">
                {bucket.items.length}
              </span>
            </div>
          </div>
          <ul className="space-y-1">
            {bucket.items.map((t) => (
              <li key={t.id}>
                <TaskRow task={t} onClick={() => onSelect(t.id)} isActive={selectedId === t.id} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function TasksV2DemoPage() {
  const [view, setView] = useState<ViewMode>("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const byLane = useMemo(() => {
    const map: Record<LaneKey, DemoTask[]> = {
      inbox: [], needs: [], running: [], done: [], archive: [],
    };
    for (const t of TASKS) map[t.lane].push(t);
    return map;
  }, []);

  const selected = selectedId ? TASKS.find((t) => t.id === selectedId) ?? null : null;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border/70 px-6 py-3">
        <Link
          href="/tasks"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-[14px] font-semibold tracking-tight">Tasks</h1>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
          v2 demo
        </span>
        <span className="text-[11px] text-muted-foreground">
          Static mockup · no live data
        </span>
        <div className="ml-4">
          <ViewToggle value={view} onChange={setView} />
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px]">
          <button className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 hover:bg-muted">
            <Filter className="size-3" /> All agents
          </button>
          <button className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 hover:bg-muted">
            <Filter className="size-3" /> All providers
          </button>
          <div className="ml-2 inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-muted-foreground">
            <Search className="size-3" />
            <span>Search tasks</span>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {view === "kanban" && (
        <main className="flex min-h-0 flex-1 overflow-x-auto p-4">
          <div className="flex min-h-0 flex-1 gap-3">
            {LANES.map((lane) => {
              const items = byLane[lane.key];
              const isArchive = lane.key === "archive";
              const collapsed = isArchive && !archiveOpen;
              return (
                <section
                  key={lane.key}
                  className={cn(
                    "flex min-h-0 shrink-0 flex-col rounded-lg border border-border/60 bg-muted/20",
                    collapsed ? "w-12" : "w-[280px]"
                  )}
                >
                  {collapsed ? (
                    <button
                      type="button"
                      onClick={() => setArchiveOpen(true)}
                      className="flex h-full w-full flex-col items-center gap-2 py-3 text-muted-foreground hover:bg-muted/40"
                      title="Expand archive"
                    >
                      <Archive className="size-4" />
                      <span className="rotate-180 text-[10.5px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
                        Archive · {items.length}
                      </span>
                    </button>
                  ) : (
                    <>
                      <LaneHeader
                        lane={lane}
                        count={items.length}
                        collapsed={false}
                        onToggle={isArchive ? () => setArchiveOpen(false) : undefined}
                      />
                      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 pt-1">
                        {items.length === 0 ? (
                          <div className="rounded-md border border-dashed border-border/50 px-3 py-4 text-center text-[11px] text-muted-foreground">
                            {lane.hint}
                          </div>
                        ) : (
                          items.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={() => setSelectedId(task.id)}
                              isActive={selectedId === task.id}
                            />
                          ))
                        )}
                      </div>
                    </>
                  )}
                </section>
              );
            })}
          </div>
        </main>
        )}

        {view === "list" && (
          <main className="flex min-h-0 flex-1 flex-col">
            <ListView byLane={byLane} selectedId={selectedId} onSelect={setSelectedId} />
          </main>
        )}

        {view === "schedule" && (
          <main className="flex min-h-0 flex-1 flex-col">
            <ScheduleView selectedId={selectedId} onSelect={setSelectedId} />
          </main>
        )}

        <PeopleRail onAgentClick={() => undefined} />

        {selected && (
          <DetailPanel task={selected} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}
