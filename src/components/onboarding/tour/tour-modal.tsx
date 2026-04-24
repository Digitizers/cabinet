"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X, Sparkles } from "lucide-react";
import { SlideData } from "./slide-data";
import { SlideAgents } from "./slide-agents";
import { SlideTasks } from "./slide-tasks";

interface TourModalProps {
  open: boolean;
  onClose: () => void;
  onLaunchTask: (starterPrompt: string) => void;
}

const STARTER_TASK =
  "Run 10 tasks, each writing a new song, save to @Songs/";

const SLIDES = [
  { id: "data", render: () => <SlideData /> },
  { id: "agents", render: () => <SlideAgents /> },
  { id: "tasks", render: () => <SlideTasks /> },
] as const;

export function TourModal({ open, onClose, onLaunchTask }: TourModalProps) {
  // TourBody is only mounted while `open`, so its internal state resets on
  // each reopen without needing a reactive effect.
  if (!open) return null;
  return <TourBody onClose={onClose} onLaunchTask={onLaunchTask} />;
}

function TourBody({
  onClose,
  onLaunchTask,
}: {
  onClose: () => void;
  onLaunchTask: (starterPrompt: string) => void;
}) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
  }, []);
  const back = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);
  const finish = useCallback(() => {
    onLaunchTask(STARTER_TASK);
    onClose();
  }, [onLaunchTask, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (index === SLIDES.length - 1) {
          finish();
        } else {
          next();
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, next, back, finish, onClose]);

  const isLast = index === SLIDES.length - 1;
  const current = SLIDES[index];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Meet your Cabinet tour"
    >
      {/* Soft decorative background wash */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(1200px 600px at 15% 20%, rgba(245, 158, 11, 0.12), transparent 60%), radial-gradient(900px 500px at 85% 80%, rgba(139, 92, 246, 0.10), transparent 60%)",
        }}
      />

      {/* Skip / close */}
      <button
        onClick={onClose}
        aria-label="Skip tour"
        className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full border border-border/50 bg-background/70 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      >
        <span>Skip</span>
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Slide stage */}
      <div className="relative flex h-full w-full max-w-6xl flex-col px-10 py-16 lg:px-14">
        <div
          key={current.id}
          className="cabinet-tour-animated flex-1"
        >
          {current.render()}
        </div>

        {/* Footer nav */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {/* Back */}
          <button
            onClick={back}
            disabled={index === 0}
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-[12px] font-medium text-foreground/80 transition-colors hover:border-border hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-7 bg-amber-500"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          {/* Next / Finish */}
          {isLast ? (
            <button
              onClick={finish}
              className="group flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-px hover:bg-amber-500/90 hover:shadow-xl hover:shadow-amber-500/40"
            >
              <Sparkles className="h-4 w-4" />
              Write your first task
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              onClick={next}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-[12px] font-semibold text-background transition-all hover:-translate-y-px"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
