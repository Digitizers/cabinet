"use client";

import { type ReactNode } from "react";
import { Archive, BookOpen, Users, Kanban } from "lucide-react";

export type MockupTab = "data" | "agents" | "tasks";

interface MockupSidebarProps {
  activeTab: MockupTab;
  children: ReactNode;
}

const TABS: Array<{ id: MockupTab; label: string; icon: typeof BookOpen }> = [
  { id: "data", label: "DATA", icon: BookOpen },
  { id: "agents", label: "AGENTS", icon: Users },
  { id: "tasks", label: "TASKS", icon: Kanban },
];

export function MockupSidebar({ activeTab, children }: MockupSidebarProps) {
  return (
    <div
      className="cabinet-tour-animated relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    >
      {/* Cabinet header */}
      <div className="flex items-center gap-2 px-3.5 py-3 border-b border-border/50 bg-amber-500/10">
        <Archive className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-foreground">Hila&apos;s Cabinet</span>
        <span className="ml-auto text-[10px] text-muted-foreground/70">+1</span>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-3 gap-1.5 px-3 py-2 border-b border-border/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <div
              key={tab.id}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 transition-all duration-500 ${
                isActive
                  ? "bg-background border border-border/60 shadow-sm"
                  : "border border-transparent opacity-55"
              }`}
            >
              <div className="relative">
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-amber-400" />
                )}
                <Icon className="h-4 w-4 text-foreground" strokeWidth={isActive ? 2.25 : 1.75} />
              </div>
              <span
                className={`text-[10px] font-semibold tracking-[0.08em] ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Body — slide-specific content */}
      <div className="relative flex-1 overflow-hidden cabinet-tour-no-scrollbar">
        {children}
      </div>
    </div>
  );
}
