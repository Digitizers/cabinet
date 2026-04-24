"use client";

import { ArrowRight, Music, AtSign } from "lucide-react";
import { MockupSidebar } from "./mockup-sidebar";

const SONG_TITLES = [
  "Neon Dreams",
  "Paper Moons",
  "Cassette",
  "Slow Burn",
  "Overgrown",
  "Salt & Smoke",
  "Late Bloom",
  "Low Tide",
  "Signal Lost",
  "Halfway Home",
];

const TYPED_COMMAND = "Run 10 tasks, each writing a song, save to @Songs/";

export function SlideTasks() {
  return (
    <div className="grid h-full grid-cols-[minmax(260px,320px)_1fr] gap-10 lg:gap-14 items-center">
      {/* Mockup sidebar */}
      <div className="h-[440px] w-full">
        <MockupSidebar activeTab="tasks">
          <div className="flex h-full flex-col gap-2 px-2 py-2">
            {/* Composer */}
            <div
              className="opacity-0 rounded-lg border border-border/60 bg-background/80 px-2.5 py-2 shadow-sm"
              style={{
                animation: "cabinet-tour-fade-up 0.4s ease-out forwards",
                animationDelay: "200ms",
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex-1 overflow-hidden">
                  <div
                    className="relative whitespace-nowrap text-[11px] text-foreground/90 overflow-hidden"
                    style={{
                      animation: "cabinet-tour-typing 1.6s steps(40, end) forwards",
                      animationDelay: "600ms",
                      width: 0,
                    }}
                  >
                    {TYPED_COMMAND.split(/(@\w+\/?)/).map((part, i) =>
                      part.startsWith("@") ? (
                        <span
                          key={i}
                          className="font-mono font-semibold text-amber-600 dark:text-amber-400"
                        >
                          {part}
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      ),
                    )}
                    <span
                      className="ml-0.5 inline-block h-3 w-[1.5px] translate-y-[2px] bg-foreground"
                      style={{
                        animation: "cabinet-tour-caret-blink 0.9s step-end infinite",
                      }}
                    />
                  </div>
                </div>
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 opacity-0"
                  style={{
                    animation: "cabinet-tour-pop-in 0.3s ease-out forwards",
                    animationDelay: "2300ms",
                  }}
                >
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Fan-out grid */}
            <div className="grid flex-1 grid-cols-2 gap-1.5 overflow-hidden">
              {SONG_TITLES.map((title, i) => (
                <div
                  key={title}
                  className="opacity-0 flex flex-col gap-1 rounded-md border border-border/50 bg-background/70 px-1.5 py-1.5"
                  style={{
                    animation: "cabinet-tour-pop-in 0.35s ease-out forwards",
                    animationDelay: `${2500 + i * 60}ms`,
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Music className="h-2.5 w-2.5 text-pink-400 shrink-0" />
                    <span className="truncate text-[9px] font-medium text-foreground">
                      {title}
                    </span>
                    <span className="ml-auto relative flex h-1 w-1 shrink-0">
                      <span
                        className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                        style={{
                          animation:
                            "cabinet-tour-heartbeat-dot 1.2s ease-in-out infinite",
                          animationDelay: `${i * 80}ms`,
                        }}
                      />
                      <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="h-0.5 rounded-full bg-foreground/20"
                      style={{
                        animation: "cabinet-tour-stream-bar 1.4s ease-out forwards",
                        animationDelay: `${2900 + i * 80}ms`,
                        width: 0,
                      }}
                    />
                    <span
                      className="h-0.5 rounded-full bg-foreground/15"
                      style={{
                        animation: "cabinet-tour-stream-bar 1.6s ease-out forwards",
                        animationDelay: `${3100 + i * 80}ms`,
                        width: 0,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer destination pill */}
            <div
              className="opacity-0 flex items-center justify-center gap-1 rounded-full border border-border/40 bg-muted/40 py-1 text-[9px] text-muted-foreground"
              style={{
                animation: "cabinet-tour-fade-up 0.4s ease-out forwards",
                animationDelay: "3800ms",
              }}
            >
              <AtSign className="h-2.5 w-2.5 text-amber-500" />
              <span>Saving to </span>
              <span className="font-mono font-semibold text-foreground">Songs/</span>
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
          03 &middot; TASKS
        </span>
        <h2
          className="text-4xl font-semibold leading-tight tracking-tight text-foreground opacity-0 lg:text-5xl"
          style={{
            animation: "cabinet-tour-fade-up 0.5s ease-out forwards",
            animationDelay: "180ms",
          }}
        >
          Ready to start?
        </h2>
        <p
          className="text-base leading-relaxed text-muted-foreground opacity-0 lg:text-lg"
          style={{
            animation: "cabinet-tour-fade-up 0.5s ease-out forwards",
            animationDelay: "320ms",
          }}
        >
          Write a task. Run one, run ten, schedule them forever.
          Mention pages with <span className="font-mono text-amber-600 dark:text-amber-400">@</span>,
          save output wherever you want. You&apos;re the director now.
        </p>
      </div>
    </div>
  );
}
