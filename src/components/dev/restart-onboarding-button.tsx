"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

const LOCAL_STORAGE_KEYS = [
  "cabinet.wizard-done",
  "cabinet.tour-done",
  "cabinet.breaking-changes-warning-ack:v3",
];

export function RestartOnboardingButton() {
  const [busy, setBusy] = useState(false);

  if (process.env.NODE_ENV === "production") return null;

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/dev/restart-onboarding", { method: "POST" });
      LOCAL_STORAGE_KEYS.forEach((k) => {
        try { localStorage.removeItem(k); } catch { /* ignore */ }
      });
    } catch {
      // server failure is non-fatal — clear local state and reload anyway
    }
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title="Dev: wipe server-side onboarding files + localStorage, then reload"
      className="fixed bottom-3 right-3 z-[300] inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground disabled:opacity-50"
    >
      <RotateCcw className="h-3 w-3" />
      {busy ? "Restarting…" : "Restart onboarding"}
    </button>
  );
}
