"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cabinet.breaking-changes-warning-ack:v2";

export function BreakingChangesWarning() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // localStorage unavailable (private mode, SSR); skip silently
    }
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // noop
    }
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v, details) => {
        if (v) return;
        // Esc and outside clicks must not auto-accept the legal disclaimer;
        // acceptance has to be a deliberate click on "I understand, continue"
        // (or the X). Reasons we ignore: "escape-key", "outside-press".
        const reason = details?.reason;
        if (reason === "escape-key" || reason === "outside-press") {
          details?.cancel?.();
          return;
        }
        acknowledge();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Heads up: Cabinet is in active development
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Cabinet is open-source software under active development and may
            introduce breaking changes without notice. You are running it at
            your own risk.
          </p>
          <p>
            Cabinet orchestrates third-party AI agents (Claude Code, Codex,
            Cursor, and others) and by design runs them with elevated
            permissions (e.g. <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs">--dangerously-skip-permissions</code>)
            so they can read, modify, and delete files in your knowledge base
            and linked repositories. Agents can make mistakes, and the data
            you send to AI providers is governed by their terms, not ours.
          </p>
          <p>
            <strong className="text-foreground">Please back up anything you care about.</strong>{" "}
            If you&apos;re not comfortable with autonomous agents touching
            your files, or you&apos;re not keeping your own copies of
            important data, Cabinet may not be for you yet.
          </p>
          <p className="text-xs">
            Cabinet is provided &ldquo;as is&rdquo;, without warranty of any
            kind. The maintainers and contributors accept no liability for
            data loss, corruption, leakage, or any other harm arising from
            your use of Cabinet or the AI providers it integrates with. By
            continuing you agree to our{" "}
            <a
              href="https://runcabinet.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://runcabinet.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </a>
            .
          </p>
          <p className="flex items-center gap-1.5">
            Thanks for being here. Community patience keeps this project
            moving <Heart className="h-3.5 w-3.5 inline text-rose-500" fill="currentColor" />
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={acknowledge}>I understand, continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
