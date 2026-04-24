"use client";

import {
  FileText,
  FileType,
  Image as ImageIcon,
  Table,
  Presentation,
  AppWindow,
  Code,
  GitBranch,
  ChevronRight,
  ChevronDown,
  AtSign,
} from "lucide-react";
import { MockupSidebar } from "./mockup-sidebar";

type IconComponent = typeof FileText;

interface TreeRow {
  label: string;
  icon: IconComponent;
  iconClass: string;
  indent: number;
  expanded?: boolean;
}

const ROWS: TreeRow[] = [
  { label: "Getting Started", icon: ChevronDown as IconComponent, iconClass: "text-muted-foreground", indent: 0, expanded: true },
  { label: "Welcome.md", icon: FileText, iconClass: "text-blue-500", indent: 1 },
  { label: "Market Research", icon: ChevronRight as IconComponent, iconClass: "text-muted-foreground", indent: 0 },
  { label: "Competitors.md", icon: FileText, iconClass: "text-blue-500", indent: 1 },
  { label: "Industry Report.pdf", icon: FileType, iconClass: "text-red-400", indent: 1 },
  { label: "Logo v3.png", icon: ImageIcon, iconClass: "text-pink-400", indent: 1 },
  { label: "Revenue 2026.xlsx", icon: Table, iconClass: "text-green-500", indent: 1 },
  { label: "Pitch Deck.pptx", icon: Presentation, iconClass: "text-orange-400", indent: 1 },
  { label: "Landing Page", icon: AppWindow, iconClass: "text-emerald-400", indent: 1 },
  { label: "cabinet-repo", icon: Code, iconClass: "text-violet-400", indent: 1 },
  { label: "Roadmap (Google)", icon: GitBranch, iconClass: "text-orange-400", indent: 1 },
];

export function SlideData() {
  return (
    <div className="grid h-full grid-cols-[minmax(260px,320px)_1fr] gap-10 lg:gap-14 items-center">
      {/* Mockup sidebar */}
      <div className="h-[440px] w-full">
        <MockupSidebar activeTab="data">
          <div className="relative h-full px-2.5 py-2">
            {ROWS.map((row, i) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-[12px] text-foreground/90 opacity-0"
                  style={{
                    paddingLeft: `${row.indent * 12 + 6}px`,
                    animation: `cabinet-tour-fade-up 0.35s ease-out forwards`,
                    animationDelay: `${120 + i * 90}ms`,
                  }}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${row.iconClass}`}
                    style={
                      row.indent > 0
                        ? {
                            animation: `cabinet-tour-icon-pulse 0.8s ease-in-out`,
                            animationDelay: `${1400 + i * 110}ms`,
                          }
                        : undefined
                    }
                  />
                  <span className="truncate">{row.label}</span>
                </div>
              );
            })}

            {/* Floating @ mention chip */}
            <div
              className="absolute left-1/2 top-[58%] -translate-x-1/2 opacity-0 pointer-events-none"
              style={{
                animation: "cabinet-tour-mention-float 3s ease-in-out forwards",
                animationDelay: "3200ms",
              }}
            >
              <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-700 shadow-lg backdrop-blur dark:text-amber-300">
                <AtSign className="h-3 w-3" />
                <span>Market Research</span>
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
          01 &middot; DATA
        </span>
        <h2
          className="text-4xl font-semibold leading-tight tracking-tight text-foreground opacity-0 lg:text-5xl"
          style={{
            animation: "cabinet-tour-fade-up 0.5s ease-out forwards",
            animationDelay: "180ms",
          }}
        >
          Your single source of truth.
        </h2>
        <p
          className="text-base leading-relaxed text-muted-foreground opacity-0 lg:text-lg"
          style={{
            animation: "cabinet-tour-fade-up 0.5s ease-out forwards",
            animationDelay: "320ms",
          }}
        >
          Every page, file, and repo — one place your team and your AI both read from.
          Markdown, PDFs, spreadsheets, slides, images, linked repos, embedded apps,
          Google Docs. Mention any of it with <span className="font-mono text-amber-600 dark:text-amber-400">@</span>.
        </p>
      </div>
    </div>
  );
}
