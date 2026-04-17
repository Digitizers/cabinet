"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TaskMeta, TaskStatus } from "@/types/tasks";

const STATUS_DOT: Record<TaskStatus, string> = {
  idle: "bg-muted-foreground/35",
  running: "bg-sky-500 animate-pulse",
  "awaiting-input": "bg-amber-500",
  done: "bg-emerald-500",
  failed: "bg-red-500",
  archived: "bg-muted-foreground/20",
};

const MAX_VISIBLE = 6;

export function RecentTasks({
  active,
  padStyle,
  itemClass,
  cabinetPath,
}: {
  active: boolean;
  padStyle: React.CSSProperties;
  itemClass: (active: boolean) => string;
  cabinetPath?: string;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskMeta[] | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const params = new URLSearchParams({ limit: String(MAX_VISIBLE) });
    if (cabinetPath) params.set("cabinetPath", cabinetPath);
    fetch(`/api/tasks?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [active, cabinetPath]);

  if (!active) return null;

  if (tasks === null) {
    return (
      <div
        className="px-3 py-1 text-[11px] text-muted-foreground/60"
        style={padStyle}
      >
        Loading…
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className="px-3 py-1 text-[11px] text-muted-foreground/60"
        style={padStyle}
      >
        No tasks yet.
      </div>
    );
  }

  return (
    <>
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => router.push(`/tasks/${encodeURIComponent(task.id)}`)}
          className={itemClass(false)}
          style={padStyle}
          title={task.title}
        >
          <span
            className={cn(
              "mt-[1px] size-1.5 shrink-0 rounded-full",
              STATUS_DOT[task.status]
            )}
          />
          <span className="truncate">{task.title}</span>
        </button>
      ))}
    </>
  );
}
