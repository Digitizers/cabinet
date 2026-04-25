"use client";

import { ChevronDown, Plus, Repeat, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/stores/app-store";
import { ROOT_CABINET_PATH } from "@/lib/cabinets/paths";
import type { StartWorkMode } from "@/components/composer/start-work-dialog";

/**
 * Shared "+ New Task" split button used in nav bars outside the Tasks board
 * (KB pages via ViewerToolbar, Agents workspace, etc.). Mirrors the visual
 * NewWorkButton inside tasks-board.tsx, but instead of calling a local
 * composer it routes to the Tasks section and dispatches the existing
 * `cabinet:open-create-task` event so the board's dialog opens once it mounts.
 */
export function NewTaskButton() {
  const section = useAppStore((s) => s.section);
  const setSection = useAppStore((s) => s.setSection);

  const open = (mode: StartWorkMode) => {
    const cabinetPath =
      ("cabinetPath" in section && section.cabinetPath) || ROOT_CABINET_PATH;
    const dispatch = () => {
      window.dispatchEvent(
        new CustomEvent("cabinet:open-create-task", {
          detail: { initialMode: mode },
        }),
      );
    };
    if (section.type === "tasks") {
      dispatch();
      return;
    }
    setSection({ type: "tasks", cabinetPath });
    // Let the Tasks section render so its event listener is mounted before
    // we fire the open event (same pattern used by the sidebar pill).
    setTimeout(dispatch, 100);
  };

  return (
    <div className="inline-flex h-7 items-stretch overflow-hidden rounded-md shadow-sm ring-1 ring-primary/20">
      <button
        type="button"
        onClick={() => open("now")}
        className="inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        title="Create a new task"
      >
        <Plus className="size-3.5" />
        New Task
      </button>
      <div className="w-px bg-primary-foreground/20" aria-hidden />
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center bg-primary px-1.5 text-primary-foreground transition-colors hover:bg-primary/90"
          title="More new item types"
          aria-label="More new item types"
        >
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuItem
            onClick={() => open("now")}
            className="flex items-start gap-2 py-2"
          >
            <Zap className="mt-0.5 size-3.5 text-foreground/70" />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium">New Task</span>
              <span className="text-[11px] text-muted-foreground">
                Run once, right now
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => open("recurring")}
            className="flex items-start gap-2 py-2"
          >
            <Repeat className="mt-0.5 size-3.5 text-indigo-500" />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium">New Routine</span>
              <span className="text-[11px] text-muted-foreground">
                Run this prompt on a schedule
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
