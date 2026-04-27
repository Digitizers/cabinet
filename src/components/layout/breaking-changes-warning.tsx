"use client";

import { useEffect, useState } from "react";
import { Heart, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Bump when the disclaimer text materially changes — older acks become
// invalid and the user gets re-prompted with the new copy.
const DISCLAIMER_VERSION = "v3";
const STORAGE_KEY = `cabinet.breaking-changes-warning-ack:${DISCLAIMER_VERSION}`;
const SERVER_ENDPOINT = "/api/disclaimer";

export const DISCLAIMER_ACKED_EVENT = "cabinet:disclaimer-acked";

export function isDisclaimerAcknowledged(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

type FloatIcon = {
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: string;
  rotate: string;
  duration: string;
};

const FLOAT_ICONS: FloatIcon[] = [
  { top: "7%",  left: "6%",   size: 52, delay: "0s",    rotate: "-12deg", duration: "4.2s" },
  { top: "9%",  right: "7%",  size: 36, delay: "1.6s",  rotate: "9deg",   duration: "3.8s" },
  { top: "50%", left: "3%",   size: 30, delay: "0.9s",  rotate: "-5deg",  duration: "4.6s" },
  { top: "62%", right: "5%",  size: 46, delay: "2.3s",  rotate: "14deg",  duration: "3.5s" },
  { top: "34%", right: "2%",  size: 24, delay: "1.9s",  rotate: "-18deg", duration: "5.0s" },
];

export function BreakingChangesWarning() {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Dev shortcut: ?disclaimer=1 forces the popup open regardless of ack state
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("disclaimer") === "1") {
      setOpen(true);
      return;
    }

    let local: string | null = null;
    try { local = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
    if (local) return;

    void fetch(`${SERVER_ENDPOINT}?v=${DISCLAIMER_VERSION}`, { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) { setOpen(true); return; }
        const data = (await res.json()) as { acked?: boolean; acceptedAt?: string };
        if (data.acked) {
          try { localStorage.setItem(STORAGE_KEY, data.acceptedAt || new Date().toISOString()); } catch { /* ignore */ }
          window.dispatchEvent(new CustomEvent(DISCLAIMER_ACKED_EVENT));
        } else {
          setOpen(true);
        }
      })
      .catch(() => { if (!cancelled) setOpen(true); });

    return () => { cancelled = true; };
  }, []);

  // Block Esc — acceptance must be deliberate
  useEffect(() => {
    if (!open) return;
    const block = (e: KeyboardEvent) => { if (e.key === "Escape") e.preventDefault(); };
    window.addEventListener("keydown", block);
    return () => window.removeEventListener("keydown", block);
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const acknowledge = () => {
    const acceptedAt = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, acceptedAt); } catch { /* noop */ }
    void fetch(SERVER_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: DISCLAIMER_VERSION, acceptedAt }),
    }).catch(() => { /* server unreachable — local ack still holds */ });
    window.dispatchEvent(new CustomEvent(DISCLAIMER_ACKED_EVENT));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 backdrop-blur-md" />

      {/* Floating shield icons — scattered across the backdrop */}
      {FLOAT_ICONS.map((icon, i) => (
        <div
          key={i}
          className="pointer-events-none absolute text-red-400/30"
          style={{
            top: icon.top,
            ...(icon.left !== undefined ? { left: icon.left } : { right: icon.right }),
            transform: `rotate(${icon.rotate})`,
            animation: `cabinet-disclaimer-float ${icon.duration} ease-in-out ${icon.delay} infinite`,
          }}
        >
          <ShieldAlert style={{ width: icon.size, height: icon.size }} />
        </div>
      ))}

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-background shadow-2xl ring-1 ring-red-500/20"
        style={{ animation: "cabinet-disclaimer-card-in 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {/* Red top accent bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-red-700 via-red-500 to-red-400" />

        <div className="relative z-10 space-y-5 p-6">
          {/* Icon + title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-500/25 blur-2xl" />
              <div className="relative rounded-2xl bg-red-500/10 p-3.5 ring-1 ring-red-500/25">
                <ShieldAlert className="h-7 w-7 text-red-500" />
              </div>
            </div>
            <div>
              <h2 id="disclaimer-title" className="text-base font-semibold">
                Security notice
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Read before continuing
              </p>
            </div>
          </div>

          {/* Lede */}
          <p className="text-center text-sm text-muted-foreground">
            Cabinet runs AI agents that can read, modify, and delete your files.
          </p>

          {/* Bullets */}
          <ul className="space-y-2.5">
            {/* Primary warning — highlighted card */}
            <li className="rounded-xl bg-red-500/8 p-3 ring-1 ring-red-500/15">
              <div className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                <span className="text-sm">
                  <strong className="text-red-500">Permissions are fully bypassed.</strong>{" "}
                  Cabinet runs agents with{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                    --dangerously-skip-permissions
                  </code>{" "}
                  (Claude Code) and equivalent flags in other providers — the same
                  as running those CLI tools directly yourself. Any MCP servers or tools
                  you have configured may be used by agents as part of their
                  reasoning. Per-agent tool whitelists/blocklists are on the roadmap.
                </span>
              </div>
            </li>

            <li className="flex gap-2.5 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400/70" aria-hidden />
              <span>
                <strong className="text-foreground">Beta software.</strong>{" "}
                Active development — breaking changes may land without notice.
              </span>
            </li>
            <li className="flex gap-2.5 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400/70" aria-hidden />
              <span>
                <strong className="text-foreground">Agents have filesystem access.</strong>{" "}
                They can read, write, and delete files across your KB and any
                linked repos.{" "}
                <strong className="text-foreground">
                  Back up your data regularly — Cabinet is not responsible for any data loss.
                </strong>{" "}
                You are solely responsible for choosing and trusting the AI
                providers you connect.
              </span>
            </li>
          </ul>

          {/* Open-source note */}
          <p className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[11px] text-blue-400">
            Cabinet is an{" "}
            <a
              href="https://github.com/hilash/cabinet"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2 hover:text-blue-300"
            >
              open-source project
            </a>
            . Contributions, feedback, and bug reports are welcome.
          </p>

          {/* Checkbox */}
          <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="disclaimer-accept"
              aria-label="I have read and I accept"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border border-border accent-foreground"
            />
            <span>I have read and I accept.</span>
          </label>

          {/* Footer row */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground/80">
              By continuing you agree to our{" "}
              <a
                href="https://runcabinet.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="https://runcabinet.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Privacy
              </a>
              .
            </p>
            <Button onClick={acknowledge} disabled={!accepted}>
              Continue
            </Button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
            Thanks for being here{" "}
            <Heart className="inline h-3 w-3 text-rose-500" fill="currentColor" />
          </p>
        </div>
      </div>
    </div>
  );
}
