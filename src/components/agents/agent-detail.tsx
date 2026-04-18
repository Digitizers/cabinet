"use client";

import { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  FileText,
  Briefcase,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Send,
  Loader2,
  MessageSquare,
  Save,
  Trash2,
  Pencil,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/stores/app-store";
import { WebTerminal } from "@/components/terminal/web-terminal";
import { cn } from "@/lib/utils";
import { AgentIdentity, getAgentDisplayName } from "@/components/agents/agent-identity";
import type { AgentPersona, HeartbeatRecord } from "@/lib/agents/persona-manager";
import type { ConversationMeta } from "@/types/conversations";
import { cronToHuman } from "@/lib/agents/cron-utils";
import { getAgentColor, tintFromHex } from "@/lib/agents/cron-compute";
import { SchedulePicker } from "@/components/mission-control/schedule-picker";

type TabId = "chat" | "definition" | "automations" | "history";
const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "definition", label: "Definition", icon: FileText },
  { id: "automations", label: "Automations", icon: Briefcase },
  { id: "history", label: "History", icon: Clock },
];

/* ─── Stats helpers ─── */
function computeStats(history: HeartbeatRecord[]) {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const withinWeek = history.filter(
    (h) => new Date(h.timestamp).getTime() >= weekAgo
  );
  const runsThisWeek = withinWeek.length;
  const avgDurationMs = history.length
    ? history.reduce((s, h) => s + (h.duration || 0), 0) / history.length
    : 0;
  const lastSeen = history[0]?.timestamp;
  return { runsThisWeek, avgDurationMs, lastSeen };
}

function formatDuration(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return `${h}h`;
}

function formatRelative(iso?: string): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function hexToRgba(hex: string, alpha: number): string | null {
  const clean = hex.trim().replace(/^#/, "");
  const full =
    clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ─── Hero ─── */
function AgentHero({
  persona,
  history,
  running,
  toggling,
  onRun,
  onToggle,
  onBack,
  onRefresh,
}: {
  persona: AgentPersona;
  history: HeartbeatRecord[];
  running: boolean;
  toggling: boolean;
  onRun: () => void;
  onToggle: () => void;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const palette = persona.color
    ? tintFromHex(persona.color)
    : getAgentColor(persona.slug);
  const stats = useMemo(() => computeStats(history), [history]);

  // Bold gradient: accent tint (stronger than palette) → fades to transparent
  const strongTint = persona.color
    ? hexToRgba(persona.color, 0.32)
    : palette.bg;
  const softTint = persona.color
    ? hexToRgba(persona.color, 0.08)
    : palette.bg;
  const gradient = `linear-gradient(135deg, ${strongTint ?? palette.bg} 0%, ${softTint ?? palette.bg} 55%, transparent 100%)`;

  return (
    <div
      className="relative border-b border-border overflow-hidden"
      style={{ background: gradient }}
    >
      {/* top nav row */}
      <div className="flex items-center justify-between px-4 pt-3">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* main row */}
      <div className="flex items-start gap-5 px-6 pt-1 pb-5">
        <div className="relative shrink-0">
          <div
            className="absolute -inset-2 rounded-3xl blur-2xl opacity-70 pointer-events-none"
            style={{ backgroundColor: palette.bg }}
          />
          <AgentIdentity
            agent={{
              slug: persona.slug,
              cabinetPath: persona.cabinetPath,
              displayName: persona.displayName,
              iconKey: persona.iconKey,
              color: persona.color,
              avatar: persona.avatar,
              avatarExt: persona.avatarExt,
            }}
            size="lg"
            className="relative !h-20 !w-20 rounded-2xl shadow-lg ring-1 ring-white/10 [&>svg]:!h-9 [&>svg]:!w-9"
          />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h1
            className="text-[28px] font-semibold tracking-[-0.02em] leading-tight truncate"
            style={{ color: palette.text }}
          >
            {getAgentDisplayName(persona)}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
            {persona.role}
            {persona.department && (
              <>
                <span className="mx-1.5 opacity-40">·</span>
                {persona.department}
              </>
            )}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                "inline-block w-1.5 h-1.5 rounded-full",
                persona.active ? "bg-green-500" : "bg-muted-foreground/40"
              )}
            />
            <span className="text-[11px] text-muted-foreground">
              {persona.active ? "Active" : "Paused"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onRun}
            disabled={running}
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {running ? "Running…" : "Run"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onToggle}
            disabled={toggling}
          >
            {persona.active ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {persona.active ? "Pause" : "Activate"}
          </Button>
        </div>
      </div>

      {/* stats strip */}
      <div className="flex items-center gap-5 px-6 pb-3 text-[11px] flex-wrap">
        <HeroStat
          icon={<Zap className="h-3 w-3" />}
          label={`${stats.runsThisWeek} run${stats.runsThisWeek === 1 ? "" : "s"} this week`}
        />
        <HeroStat
          icon={<Clock className="h-3 w-3" />}
          label={`${formatDuration(stats.avgDurationMs)} avg`}
        />
        <HeroStat
          icon={<Activity className="h-3 w-3" />}
          label={`last seen ${formatRelative(stats.lastSeen)}`}
        />
        <HeroStat
          icon={<Sparkles className="h-3 w-3" />}
          label={cronToHuman(persona.heartbeat)}
        />
      </div>
    </div>
  );
}

function HeroStat({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className="opacity-70">{icon}</span>
      <span>{label}</span>
    </div>
  );
}


/* ─── Editable Field ─── */
function EditableField({
  label,
  value,
  mono,
  onSave,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    if (draft.trim() !== value) onSave(draft.trim());
    setEditing(false);
  };

  return (
    <div
      className="bg-muted/30 rounded-lg p-3 group cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => { if (!editing) { setDraft(value); setEditing(true); } }}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-between">
        {label}
        {!editing && <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />}
      </p>
      {editing ? (
        <div className="flex gap-1 mt-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            onBlur={handleSave}
            className={cn(
              "flex-1 bg-background border border-border rounded px-2 py-0.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/50",
              mono && "font-mono"
            )}
          />
        </div>
      ) : (
        <p className={cn("text-[13px] font-medium mt-0.5", mono && "font-mono")}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

/* ─── Definition Tab ─── */
function DefinitionTab({
  persona,
  slug,
  onRefresh,
}: {
  persona: AgentPersona;
  slug: string;
  onRefresh: () => void;
}) {
  const [bodyEdit, setBodyEdit] = useState("");
  const [editingBody, setEditingBody] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bodyHtml, setBodyHtml] = useState("");

  // Render markdown to HTML for display
  useEffect(() => {
    fetch("/api/ai/render-md", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: persona.body }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.html) setBodyHtml(data.html); })
      .catch(() => {});
  }, [persona.body]);

  const saveField = async (field: string, value: string) => {
    await fetch(`/api/agents/personas/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    onRefresh();
  };

  const saveBody = async () => {
    if (!bodyEdit.trim() || bodyEdit === persona.body) { setEditingBody(false); return; }
    setSaving(true);
    await fetch(`/api/agents/personas/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: bodyEdit }),
    });
    setSaving(false);
    setEditingBody(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <EditableField
          label="Department"
          value={persona.department}
          onSave={(v) => saveField("department", v)}
        />
        <EditableField
          label="Type"
          value={persona.type}
          onSave={(v) => saveField("type", v)}
        />
        <div className="col-span-2">
          <EditableField
            label="Workspace"
            value={persona.workspace || "/"}
            mono
            onSave={(v) => saveField("workspace", v)}
          />
        </div>
      </div>

      {persona.tags.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
            Tags
          </p>
          <div className="flex gap-1 flex-wrap">
            {persona.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Persona Instructions
          </p>
          {editingBody ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px]"
                onClick={() => setEditingBody(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={saveBody}
                disabled={saving}
              >
                <Save className="h-3 w-3" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1 opacity-60 hover:opacity-100"
              onClick={() => { setBodyEdit(persona.body); setEditingBody(true); }}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
        {editingBody ? (
          <textarea
            value={bodyEdit}
            onChange={(e) => setBodyEdit(e.target.value)}
            className="w-full bg-muted/20 border border-border rounded-lg p-4 text-[12px] font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[400px]"
            autoFocus
          />
        ) : (
          <div
            className="bg-muted/20 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => { setBodyEdit(persona.body); setEditingBody(true); }}
          >
            {bodyHtml ? (
              <div
                className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h1:text-base prose-h2:text-[13px] prose-h3:text-[12px] prose-p:text-[12px] prose-li:text-[12px] prose-code:text-[11px] prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-border prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <pre className="text-[12px] whitespace-pre-wrap font-sans leading-relaxed">
                {persona.body}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Automations Tab ─── */
interface AgentJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  prompt: string;
  timeout?: number;
}

function AutomationsTab({
  persona,
  slug,
  onRefresh,
}: {
  persona: AgentPersona;
  slug: string;
  onRefresh: () => void;
}) {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCron, setNewCron] = useState("0 9 * * 1-5");
  const [newPrompt, setNewPrompt] = useState("");
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editCron, setEditCron] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [running, setRunning] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${slug}/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch {}
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async () => {
    if (!newName.trim() || !newPrompt.trim()) return;
    await fetch(`/api/agents/${slug}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        schedule: newCron,
        prompt: newPrompt.trim(),
      }),
    });
    setAdding(false);
    setNewName("");
    setNewCron("0 9 * * 1-5");
    setNewPrompt("");
    refresh();
  };

  const handleDelete = async (jobId: string) => {
    await fetch(`/api/agents/${slug}/jobs/${jobId}`, { method: "DELETE" });
    refresh();
  };

  const handleUpdateJob = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const updates: Record<string, unknown> = {};
    if (editCron && editCron !== job.schedule) updates.schedule = editCron;
    if (editPrompt !== job.prompt) updates.prompt = editPrompt;
    if (Object.keys(updates).length > 0) {
      await fetch(`/api/agents/${slug}/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    }
    setEditingJob(null);
    refresh();
  };

  const handleToggle = async (jobId: string) => {
    await fetch(`/api/agents/${slug}/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle" }),
    });
    refresh();
  };

  const handleRun = async (jobId: string) => {
    setRunning(jobId);
    await fetch(`/api/agents/${slug}/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run" }),
    });
    setRunning(null);
    refresh();
  };

  const saveHeartbeat = async (cron: string) => {
    await fetch(`/api/agents/personas/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heartbeat: cron }),
    });
    onRefresh();
  };

  if (loading) {
    return <p className="text-[13px] text-muted-foreground">Loading automations...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Heartbeat */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Heartbeat
        </p>
        <div className="bg-card border border-border rounded-lg p-3 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            The default recurring schedule for {getAgentDisplayName(persona) || "this agent"}.
          </p>
          <p className="text-[12px] font-medium">
            {cronToHuman(persona.heartbeat)}
            <span className="ml-2 text-[10px] font-mono text-muted-foreground/60">
              {persona.heartbeat}
            </span>
          </p>
          <SchedulePicker value={persona.heartbeat} onChange={saveHeartbeat} />
        </div>
      </div>

      {/* Jobs */}
      <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Scheduled Jobs
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] gap-1"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3" />
          Add Job
        </Button>
      </div>

      {adding && (
        <div className="bg-card border border-border rounded-lg p-3 space-y-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Job name..."
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50"
            onKeyDown={(e) => { if (e.key === "Escape") setAdding(false); }}
          />
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Schedule</p>
            <SchedulePicker value={newCron} onChange={setNewCron} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Prompt</p>
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="What should this job do? This prompt is sent to the selected provider..."
              className="w-full bg-background border border-border rounded px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none min-h-[80px]"
            />
          </div>
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-6 text-[10px]" onClick={handleAdd} disabled={!newName.trim() || !newPrompt.trim()}>
              Create
            </Button>
          </div>
        </div>
      )}

      {jobs.length === 0 && !adding && (
        <div className="text-center py-8">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/30" />
          <p className="text-[13px] text-muted-foreground mt-2">
            No jobs configured
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Jobs are recurring scheduled tasks the agent runs automatically.
          </p>
        </div>
      )}

      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-card border border-border rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(job.id)}
                className={cn(
                  "w-2 h-2 rounded-full shrink-0 cursor-pointer",
                  job.enabled ? "bg-green-500" : "bg-muted-foreground/30"
                )}
                title={job.enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
              />
              <h4 className="text-[13px] font-medium">{job.name}</h4>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] gap-1 px-1.5"
                onClick={() => handleRun(job.id)}
                disabled={running === job.id}
              >
                {running === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Run
              </Button>
              <button
                onClick={() => { setEditingJob(editingJob === job.id ? null : job.id); setEditCron(job.schedule); setEditPrompt(job.prompt); }}
                className={cn(
                  "text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 transition-colors",
                  editingJob === job.id ? "ring-1 ring-primary/50" : ""
                )}
              >
                <span className="font-mono">{job.schedule}</span>
                <span className="ml-1 text-muted-foreground/50">({cronToHuman(job.schedule)})</span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground/40 hover:text-destructive"
                onClick={() => handleDelete(job.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {job.prompt && editingJob !== job.id && (
            <p className="text-[11px] text-muted-foreground/70 mt-1.5 line-clamp-2">{job.prompt}</p>
          )}
          {editingJob === job.id && (
            <div className="mt-2 pt-2 border-t border-border space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Schedule</p>
                <SchedulePicker
                  value={editCron}
                  onChange={(v) => setEditCron(v)}
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Prompt</p>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="What should this job do?"
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none min-h-[80px]"
                />
              </div>
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditingJob(null)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-6 text-[10px] gap-1" onClick={() => handleUpdateJob(job.id)}>
                  <Save className="h-3 w-3" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

/* ─── History Tab ─── */
function HistoryTab({
  persona,
  history,
  onRefresh,
}: {
  persona: AgentPersona;
  history: HeartbeatRecord[];
  onRefresh: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [prompt, setPrompt] = useState("");
  // Live terminal session
  const [liveSession, setLiveSession] = useState<{
    id: string;
    prompt: string;
    userMessage: string;
    providerId: string;
    adapterType?: string;
  } | null>(null);

  const selectedSession = selectedIndex !== null ? history[selectedIndex] : null;

  const handleSendPrompt = () => {
    if (!prompt.trim()) return;
    const userMessage = prompt.trim();
    const sessionId = `agent-${persona.slug}-${Date.now()}`;
    const fullPrompt = `${persona.body}\n\n---\n\nUser request: ${userMessage}`;

    setLiveSession({
      id: sessionId,
      prompt: fullPrompt,
      userMessage,
      providerId: persona.provider,
      adapterType: persona.adapterType,
    });
    setSelectedIndex(null);
    setPrompt("");
  };

  const handleSessionEnd = () => {
    setLiveSession(null);
    onRefresh();
  };

  const handleNewSession = () => {
    setSelectedIndex(null);
    setLiveSession(null);
  };

  const showNewPrompt = !liveSession && selectedIndex === null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Session list sidebar */}
      <div className="w-[240px] min-w-[240px] border-r border-border flex flex-col bg-muted/5">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            History
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleNewSession}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {/* Live session entry */}
            {liveSession && (
              <button
                className="flex items-start gap-2 w-full px-2.5 py-2 rounded-md text-[11px] text-left bg-primary/10 border border-primary/20"
              >
                <div className="mt-0.5 shrink-0">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[11px] leading-tight text-foreground">
                    {liveSession.userMessage}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    running...
                  </p>
                </div>
              </button>
            )}
            {history.length === 0 && !liveSession && (
              <p className="text-[11px] text-muted-foreground/50 px-2 py-6 text-center">
                No sessions yet
              </p>
            )}
            {history.map((hb, i) => {
              const date = new Date(hb.timestamp);
              const summaryLine = hb.summary
                ?.replace(/^---\s*\n/, "")
                ?.replace(/^#+\s*/, "")
                ?.split("\n")[0]
                ?.trim() || "Session";
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedIndex(i);
                    setLiveSession(null);
                  }}
                  className={cn(
                    "flex items-start gap-2 w-full px-2.5 py-2 rounded-md text-[11px] transition-colors text-left group",
                    selectedIndex === i
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {hb.status === "completed" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[11px] leading-tight">
                      {summaryLine.length > 50 ? summaryLine.slice(0, 50) + "..." : summaryLine}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {date.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                      {" "}
                      {date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span className="ml-1.5">
                        {Math.round(hb.duration / 1000)}s
                      </span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Session content panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {liveSession ? (
          /* Live agent terminal */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 shrink-0">
              <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
              <span className="text-[12px] font-medium">{liveSession.userMessage}</span>
            </div>
            <div className="flex-1 min-h-0">
              <WebTerminal
                sessionId={liveSession.id}
                prompt={liveSession.prompt}
                themeSurface="page"
                providerId={liveSession.providerId}
                adapterType={liveSession.adapterType}
                onClose={handleSessionEnd}
              />
            </div>
          </div>
        ) : selectedSession ? (
          /* Viewing a past session */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              {selectedSession.status === "completed" ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className="text-[12px] font-medium capitalize">
                {selectedSession.status}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(selectedSession.duration / 1000)}s
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {new Date(selectedSession.timestamp).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <ScrollArea
              className="flex-1"
              style={{
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
              }}
            >
              <div className="p-4">
                <pre className="text-[12px] font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {selectedSession.summary || "No output captured for this session."}
                </pre>
              </div>
            </ScrollArea>
            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder={`Ask ${persona.name} something...`}
                  className="flex-1 px-3 py-1.5 text-[13px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <Button
                  size="sm"
                  className="h-8 gap-1"
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : showNewPrompt ? (
          /* New session prompt */
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="text-center mb-6">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
              <h3 className="text-[14px] font-medium text-foreground/80">
                New Session
              </h3>
              <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
                Send a prompt to {persona.name} to start a live session.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <div className="flex gap-2">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder={`Ask ${persona.name} something...`}
                  className="flex-1 px-3 py-2 text-[13px] rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Chat Tab ─── */
function triggerIcon(trigger: ConversationMeta["trigger"]) {
  switch (trigger) {
    case "job":
      return Briefcase;
    case "heartbeat":
      return Sparkles;
    default:
      return MessageSquare;
  }
}

function triggerLabel(trigger: ConversationMeta["trigger"]): string {
  switch (trigger) {
    case "job":
      return "Job";
    case "heartbeat":
      return "Heartbeat";
    default:
      return "Chat";
  }
}

function conversationStatusBadge(convo: ConversationMeta) {
  if (convo.status === "running") {
    return (
      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
    );
  }
  if (convo.status === "completed") {
    return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  }
  if (convo.status === "failed") {
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  }
  return <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />;
}

function conversationDurationMs(convo: ConversationMeta): number {
  const start = new Date(convo.startedAt).getTime();
  const end = convo.completedAt
    ? new Date(convo.completedAt).getTime()
    : convo.lastActivityAt
      ? new Date(convo.lastActivityAt).getTime()
      : Date.now();
  return Math.max(0, end - start);
}

function ChatTab({
  persona,
  conversations,
  onRefresh,
  onShowAll,
  onOpenConversation,
}: {
  persona: AgentPersona;
  conversations: ConversationMeta[];
  onRefresh: () => void;
  onShowAll: () => void;
  onOpenConversation: (c: ConversationMeta) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [liveSession, setLiveSession] = useState<{
    id: string;
    prompt: string;
    userMessage: string;
    providerId: string;
    adapterType?: string;
  } | null>(null);

  const recent = conversations.slice(0, 6);
  const palette = persona.color
    ? tintFromHex(persona.color)
    : getAgentColor(persona.slug);

  const handleSendPrompt = () => {
    if (!prompt.trim()) return;
    const userMessage = prompt.trim();
    const sessionId = `agent-${persona.slug}-${Date.now()}`;
    const fullPrompt = `${persona.body}\n\n---\n\nUser request: ${userMessage}`;
    setLiveSession({
      id: sessionId,
      prompt: fullPrompt,
      userMessage,
      providerId: persona.provider,
      adapterType: persona.adapterType,
    });
    setPrompt("");
  };

  const handleSessionEnd = () => {
    setLiveSession(null);
    onRefresh();
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main chat pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {liveSession ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 shrink-0">
              <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
              <span className="text-[12px] font-medium truncate">
                {liveSession.userMessage}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 text-[10px]"
                onClick={handleSessionEnd}
              >
                End session
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <WebTerminal
                sessionId={liveSession.id}
                prompt={liveSession.prompt}
                themeSurface="page"
                providerId={liveSession.providerId}
                adapterType={liveSession.adapterType}
                onClose={handleSessionEnd}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="relative mb-5">
              <div
                className="absolute -inset-3 rounded-3xl blur-2xl opacity-60 pointer-events-none"
                style={{ backgroundColor: palette.bg }}
              />
              <AgentIdentity
                agent={{
                  slug: persona.slug,
                  cabinetPath: persona.cabinetPath,
                  displayName: persona.displayName,
                  iconKey: persona.iconKey,
                  color: persona.color,
                  avatar: persona.avatar,
                  avatarExt: persona.avatarExt,
                }}
                size="lg"
                className="relative !h-14 !w-14 rounded-2xl shadow-md ring-1 ring-white/10 [&>svg]:!h-6 [&>svg]:!w-6"
              />
            </div>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
              Chat with {getAgentDisplayName(persona) || persona.name}
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm text-center">
              Send a prompt to start a live session. {persona.name} will work in
              the background and keep this conversation as history.
            </p>
            <div className="w-full max-w-xl mt-6">
              <div className="flex gap-2">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder={`Ask ${getAgentDisplayName(persona) || persona.name} something…`}
                  className="flex-1 px-3 py-2.5 text-[13px] rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-10 gap-1.5 px-4"
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent activity rail */}
      <div className="w-[260px] min-w-[260px] border-l border-border flex flex-col bg-muted/5">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Recent
          </span>
          {conversations.length > recent.length && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1"
              onClick={onShowAll}
            >
              Show all
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {recent.length === 0 && (
              <p className="text-[11px] text-muted-foreground/50 px-2 py-6 text-center">
                No activity yet
              </p>
            )}
            {recent.map((convo) => {
              const TriggerIcon = triggerIcon(convo.trigger);
              const title =
                (convo.title || convo.summary || "Untitled")
                  .replace(/^---\s*\n/, "")
                  .replace(/^#+\s*/, "")
                  .trim();
              const durationMs = conversationDurationMs(convo);
              return (
                <button
                  key={convo.id}
                  onClick={() => onOpenConversation(convo)}
                  className="flex items-start gap-2 w-full px-2.5 py-2 rounded-md text-[11px] text-left text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {conversationStatusBadge(convo)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[11px] leading-tight">
                      {title.length > 44 ? title.slice(0, 44) + "…" : title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                      <TriggerIcon className="h-2.5 w-2.5 opacity-70 shrink-0" />
                      <span>{triggerLabel(convo.trigger)}</span>
                      <span className="opacity-40">·</span>
                      <span>{formatRelative(convo.lastActivityAt || convo.startedAt)}</span>
                      {durationMs > 0 && convo.status !== "running" && (
                        <>
                          <span className="opacity-40">·</span>
                          <span>{formatDuration(durationMs)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function AgentDetail({ slug }: { slug: string }) {
  const [persona, setPersona] = useState<AgentPersona | null>(null);
  const [history, setHistory] = useState<HeartbeatRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toggling, setToggling] = useState(false);
  const setSection = useAppStore((s) => s.setSection);

  const refresh = useCallback(async () => {
    try {
      const [personaRes, convoRes] = await Promise.all([
        fetch(`/api/agents/personas/${slug}`),
        fetch(
          `/api/agents/conversations?agent=${encodeURIComponent(slug)}&limit=50`
        ),
      ]);
      if (personaRes.ok) {
        const data = await personaRes.json();
        setPersona(data.persona);
        setHistory(data.history || []);
      }
      if (convoRes.ok) {
        const data = await convoRes.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const openConversation = useCallback(
    (conversation: ConversationMeta) => {
      setSection({
        type: "task",
        taskId: conversation.id,
        mode: conversation.cabinetPath ? "cabinet" : "ops",
        cabinetPath: conversation.cabinetPath,
      });
    },
    [setSection]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRun = async () => {
    setRunning(true);
    await fetch(`/api/agents/personas/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run" }),
    });
    setTimeout(() => {
      setRunning(false);
      refresh();
    }, 2000);
  };

  const handleToggle = async () => {
    setToggling(true);
    await fetch(`/api/agents/personas/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle" }),
    });
    setToggling(false);
    refresh();
  };

  if (loading || !persona) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AgentHero
        persona={persona}
        history={history}
        running={running}
        toggling={toggling}
        onRun={handleRun}
        onToggle={handleToggle}
        onBack={() => setSection({ type: "agents" })}
        onRefresh={refresh}
      />

      {/* Pill tab nav */}
      <div className="px-4 pt-3 border-b border-border flex items-center gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative flex items-center gap-1.5 px-3 pb-2.5 pt-1.5 text-[12px] font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {tab.label}
              <span
                className={cn(
                  "absolute inset-x-2 -bottom-px h-[2px] rounded-full transition-all",
                  isActive ? "bg-primary" : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "chat" ? (
        <ChatTab
          persona={persona}
          conversations={conversations}
          onRefresh={refresh}
          onShowAll={() => setActiveTab("history")}
          onOpenConversation={openConversation}
        />
      ) : activeTab === "history" ? (
        <HistoryTab
          persona={persona}
          history={history}
          onRefresh={refresh}
        />
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4">
            {activeTab === "definition" && (
              <DefinitionTab persona={persona} slug={slug} onRefresh={refresh} />
            )}
            {activeTab === "automations" && (
              <AutomationsTab
                persona={persona}
                slug={slug}
                onRefresh={refresh}
              />
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
