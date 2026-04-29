import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { DATA_DIR } from "@/lib/storage/path-utils";

// Dev-only endpoint: wipes the server-side files that gate the onboarding
// wizard so a returning developer can replay the first-run flow without
// having to manually delete files. The matching client clears localStorage
// (`cabinet.wizard-done`, `cabinet.tour-done`,
// `cabinet.breaking-changes-warning-ack:v3`) and reloads.
//
// 404 in production. Files are moved to a timestamped backup folder rather
// than deleted outright so a misclick is recoverable.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const configDir = path.join(DATA_DIR, ".agents", ".config");
  const stateDir = path.join(DATA_DIR, ".cabinet-state");
  const backupDir = path.join(configDir, `.restart-backup-${Date.now()}`);

  const targets: Array<{ from: string; name: string }> = [
    { from: path.join(configDir, "workspace.json"), name: "workspace.json" },
    { from: path.join(configDir, "company.json"), name: "company.json" },
    { from: path.join(configDir, "onboarding-complete.json"), name: "onboarding-complete.json" },
    { from: path.join(stateDir, "disclaimer-ack.json"), name: "disclaimer-ack.json" },
  ];

  await fs.mkdir(backupDir, { recursive: true });
  const moved: string[] = [];
  for (const t of targets) {
    try {
      await fs.rename(t.from, path.join(backupDir, t.name));
      moved.push(t.name);
    } catch {
      // missing file is fine — onboarding may have already been reset
    }
  }

  return NextResponse.json({ ok: true, backupDir, moved });
}
