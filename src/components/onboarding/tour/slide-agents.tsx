"use client";

import { Brain, Heart, Calendar, Search, PenLine, FolderTree } from "lucide-react";
import { MockupSidebar } from "./mockup-sidebar";

const OTHER_AGENTS = [
  { name: "Writer", icon: PenLine, tone: "text-sky-500" },
  { name: "Organizer", icon: FolderTree, tone: "text-violet-500" },
];

export function SlideAgents() {
  return (
    <div className="grid h-full grid-cols-[minmax(260px,320px)_1fr] gap-10 lg:gap-14 items-center">
      {/* Mockup sidebar */}
      <div className="h-[440px] w-full">
        <MockupSidebar activeTab="agents">
          <div className="relative flex h-full flex-col gap-2 px-2.5 py-2">
            {/* Other agents fade in then fade out */}
            {OTHER_AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.name}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-[12px] opacity-0"
                  style={{
                    animation:
                      "cabinet-tour-fade-up 0.35s ease-out forwards, cabinet-tour-fade-in 0.4s ease-in reverse forwards",
                    animationDelay: `${120 + i * 100}ms, 1800ms`,
                  }}
                >
                  <Icon className={`h-4 w-4 ${agent.tone}`} />
                  <span className="text-foreground/80">{agent.name}</span>
                  <span className="ml-auto text-[9px] text-muted-foreground/70">
                    idle
                  </span>
                </div>
              );
            })}

            {/* Research Analyst — the hero card */}
            <div
              className="absolute inset-2 flex flex-col gap-2.5 rounded-xl border border-amber-400/40 bg-background/95 p-3 opacity-0 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] backdrop-blur"
              style={{
                animation:
                  "cabinet-tour-fade-up 0.4s ease-out forwards, cabinet-tour-agent-lift 0.6s ease-out forwards",
                animationDelay: "600ms, 1900ms",
              }}
            >
              {/* Card header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                  <Search className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-foreground">
                    Research Analyst
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Claude · Sonnet 4.6
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                      style={{
                        animation: "cabinet-tour-heartbeat-dot 1.4s ease-in-out infinite",
                      }}
                    />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                    live
                  </span>
                </div>
              </div>

              {/* (1) Persona */}
              <div
                className="flex gap-2 opacity-0"
                style={{
                  animation: "cabinet-tour-callout-in 0.4s ease-out forwards",
                  animationDelay: "2500ms",
                }}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/10 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground/90">
                    <Brain className="h-3 w-3 text-amber-500" />
                    Persona
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground line-clamp-2">
                    &ldquo;Rigorous analyst. Cites sources. Flags conflicting claims.&rdquo;
                  </p>
                </div>
              </div>

              {/* (2) Heartbeat */}
              <div
                className="flex gap-2 opacity-0"
                style={{
                  animation: "cabinet-tour-callout-in 0.4s ease-out forwards",
                  animationDelay: "2900ms",
                }}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/10 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground/90">
                    <Heart className="h-3 w-3 text-rose-500" />
                    Heartbeat
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Scans @Market Research every 15 min
                  </p>
                </div>
              </div>

              {/* (3) Jobs */}
              <div
                className="flex gap-2 opacity-0"
                style={{
                  animation: "cabinet-tour-callout-in 0.4s ease-out forwards",
                  animationDelay: "3300ms",
                }}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/10 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground/90">
                    <Calendar className="h-3 w-3 text-violet-500" />
                    Jobs
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Mon 9:00 · Weekly competitor digest
                  </p>
                </div>
              </div>
            </div>
          </div>
        </MockupSidebar>
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-5 max-w-lg">
        <span
          className="inline-block w-fit rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-amber-700 opacity-0 dark:text-amber-300"
          style={{
            animation: "cabinet-tour-fade-up 0.4s ease-out forwards",
            animationDelay: "60ms",
          }}
        >
          02 &middot; AGENTS
        </span>
        <h2
          className="text-4xl font-semibold leading-tight tracking-tight text-foreground opacity-0 lg:text-5xl"
          style={{
            animation: "cabinet-tour-fade-up 0.5s ease-out forwards",
            animationDelay: "180ms",
          }}
        >
          Your AI team.
        </h2>
        <p
          className="text-base leading-relaxed text-muted-foreground opacity-0 lg:text-lg"
          style={{
            animation: "cabinet-tour-fade-up 0.5s ease-out forwards",
            animationDelay: "320ms",
          }}
        >
          Each agent has a <span className="font-medium text-foreground">persona</span>, a{" "}
          <span className="font-medium text-foreground">heartbeat</span> that keeps them
          working in the background, and <span className="font-medium text-foreground">jobs</span>{" "}
          you can schedule. Give them a role — they&apos;ll show up for it.
        </p>
      </div>
    </div>
  );
}
