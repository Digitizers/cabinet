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

const STORAGE_KEY = "cabinet.breaking-changes-warning-ack:v1";

export function BreakingChangesWarning() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // localStorage unavailable (private mode, SSR) — skip silently
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) acknowledge(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Heads up — Cabinet is in active development
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Cabinet is currently going through breaking changes. If you&apos;re
            seeing this message, you&apos;re probably on the most recent
            development branch — we recommend coming back in a few hours for
            the best experience.
          </p>
          <p className="flex items-center gap-1.5">
            This is a community project and we&apos;d really appreciate your
            patience <Heart className="h-3.5 w-3.5 inline text-rose-500" fill="currentColor" />
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={acknowledge}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
