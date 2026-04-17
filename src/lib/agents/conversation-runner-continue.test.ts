import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { agentAdapterRegistry } from "./adapters/registry";
import type { AgentExecutionAdapter } from "./adapters/types";

let tempRoot: string;
type Store = typeof import("./conversation-store");
type Runner = typeof import("./conversation-runner");
let store: Store;
let runner: Runner;

before(async () => {
  tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "cabinet-convo-runner-test-")
  );
  process.env.CABINET_DATA_DIR = tempRoot;
  store = await import("./conversation-store");
  runner = await import("./conversation-runner");
});

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true });
});

interface Capture {
  sessionIdSeen: string | null | undefined;
  promptSeen: string;
  cwdSeen: string;
}

function buildMockAdapter({
  type,
  supportsSessionResume,
  response,
  captures,
}: {
  type?: string;
  supportsSessionResume: boolean;
  response: {
    output: string;
    sessionId?: string | null;
    exitCode?: number;
  };
  captures: Capture[];
}): AgentExecutionAdapter {
  return {
    type: type ?? "mock_continue",
    name: "Mock Continue",
    executionEngine: "structured_cli",
    providerId: "mock",
    supportsSessionResume,
    async testEnvironment() {
      return {
        adapterType: "mock_continue",
        status: "pass",
        checks: [],
        testedAt: new Date().toISOString(),
      };
    },
    async execute(ctx) {
      captures.push({
        sessionIdSeen: ctx.sessionId,
        promptSeen: ctx.prompt,
        cwdSeen: ctx.cwd,
      });
      return {
        exitCode: response.exitCode ?? 0,
        signal: null,
        timedOut: false,
        output: response.output,
        sessionId: response.sessionId ?? "resume-id",
        usage: { inputTokens: 100, outputTokens: 40 },
      };
    },
  };
}

async function seedConversation(adapterType = "mock_continue") {
  return store.createConversation({
    agentSlug: "general",
    title: "Test continuation",
    trigger: "manual",
    prompt: "User request:\nsomething",
    providerId: "mock",
    adapterType,
  });
}

test("continueConversationRun in resume mode sends only the follow-up to the adapter", async () => {
  const captures: Capture[] = [];
  agentAdapterRegistry.registerExternal(
    buildMockAdapter({
      supportsSessionResume: true,
      response: { output: "Resumed reply.\n```cabinet\nSUMMARY: resumed\n```" },
      captures,
    })
  );

  const meta = await seedConversation();
  // Finalize turn 1 so we have agent content + a live session
  await store.appendConversationTranscript(
    meta.id,
    "Turn 1 reply.\n```cabinet\nSUMMARY: first\n```"
  );
  await store.finalizeConversation(meta.id, {
    status: "completed",
    exitCode: 0,
    output: "Turn 1 reply.\n```cabinet\nSUMMARY: first\n```",
  });
  await store.writeSession(meta.id, {
    kind: "mock_continue",
    resumeId: "sess-before",
    alive: true,
  });

  await runner.continueConversationRun(meta.id, {
    userMessage: "the new follow-up",
  });

  assert.equal(captures.length, 1, "adapter was invoked once");
  assert.equal(captures[0].sessionIdSeen, "sess-before");
  assert.match(captures[0].promptSeen, /```cabinet block/);
  assert.match(captures[0].promptSeen, /User follow-up:\nthe new follow-up/);
  assert.ok(
    !captures[0].promptSeen.includes("Turn 1 reply."),
    "resume mode should NOT replay history"
  );

  const turns = await store.readConversationTurns(meta.id);
  const last = turns[turns.length - 1];
  assert.equal(last.role, "agent");
  assert.match(last.content, /Resumed reply/);
  assert.equal(last.pending, undefined);

  const reread = await store.readConversationMeta(meta.id);
  assert.equal(reread?.status, "completed");
  assert.equal(reread?.summary, "resumed");

  const session = await store.readSession(meta.id);
  assert.equal(session?.resumeId, "resume-id", "session handle updated");

  agentAdapterRegistry.unregisterExternal("mock_continue");
});

test("continueConversationRun in replay mode includes prior turns + full agent context", async () => {
  const captures: Capture[] = [];
  agentAdapterRegistry.registerExternal(
    buildMockAdapter({
      supportsSessionResume: false,
      response: { output: "Replay reply.\n```cabinet\nSUMMARY: replay\n```" },
      captures,
    })
  );

  const meta = await seedConversation();
  await store.appendConversationTranscript(
    meta.id,
    "T1 reply.\n```cabinet\nSUMMARY: t1\n```"
  );
  await store.finalizeConversation(meta.id, {
    status: "completed",
    exitCode: 0,
    output: "T1 reply.\n```cabinet\nSUMMARY: t1\n```",
  });

  await runner.continueConversationRun(meta.id, {
    userMessage: "the follow-up",
  });

  assert.equal(captures.length, 1);
  assert.equal(captures[0].sessionIdSeen, null, "replay mode passes null sessionId");
  assert.match(
    captures[0].promptSeen,
    /Prior conversation/,
    "replay mode includes history header"
  );
  assert.match(captures[0].promptSeen, /T1 reply\./);
  assert.match(captures[0].promptSeen, /You are Cabinet's General agent/);
  assert.match(captures[0].promptSeen, /User follow-up:\nthe follow-up/);

  agentAdapterRegistry.unregisterExternal("mock_continue");
});

test("continueConversationRun parses ARTIFACT: paths into meta.artifactPaths", async () => {
  const captures: Capture[] = [];
  agentAdapterRegistry.registerExternal(
    buildMockAdapter({
      supportsSessionResume: true,
      response: {
        output: "Wrote the file.\n```cabinet\nSUMMARY: did it\nARTIFACT: marketing/blog/test.md\n```",
      },
      captures,
    })
  );

  const meta = await seedConversation();
  await store.appendConversationTranscript(
    meta.id,
    "T1.\n```cabinet\nSUMMARY: t1\n```"
  );
  await store.finalizeConversation(meta.id, {
    status: "completed",
    exitCode: 0,
    output: "T1.\n```cabinet\nSUMMARY: t1\n```",
  });
  await store.writeSession(meta.id, {
    kind: "mock_continue",
    resumeId: "s1",
    alive: true,
  });

  await runner.continueConversationRun(meta.id, {
    userMessage: "please create the file",
  });

  const reread = await store.readConversationMeta(meta.id);
  assert.ok(
    reread?.artifactPaths.includes("marketing/blog/test.md"),
    "parsed ARTIFACT merged into meta.artifactPaths"
  );

  agentAdapterRegistry.unregisterExternal("mock_continue");
});

test("continueConversationRun flips awaitingInput when agent ends with a question", async () => {
  const captures: Capture[] = [];
  agentAdapterRegistry.registerExternal(
    buildMockAdapter({
      supportsSessionResume: true,
      response: {
        output: "Want me to use SAML or OIDC?\n```cabinet\nSUMMARY: paused\n```",
      },
      captures,
    })
  );

  const meta = await seedConversation();
  await store.appendConversationTranscript(
    meta.id,
    "ok.\n```cabinet\nSUMMARY: ok\n```"
  );
  await store.finalizeConversation(meta.id, {
    status: "completed",
    exitCode: 0,
    output: "ok.\n```cabinet\nSUMMARY: ok\n```",
  });
  await store.writeSession(meta.id, {
    kind: "mock_continue",
    resumeId: "s1",
    alive: true,
  });

  await runner.continueConversationRun(meta.id, {
    userMessage: "add sso",
  });

  const reread = await store.readConversationMeta(meta.id);
  assert.equal(reread?.awaitingInput, true);

  agentAdapterRegistry.unregisterExternal("mock_continue");
});

test("continueConversationRun with failing adapter marks turn + conversation failed", async () => {
  const captures: Capture[] = [];
  agentAdapterRegistry.registerExternal(
    buildMockAdapter({
      supportsSessionResume: true,
      response: { output: "boom", exitCode: 1, sessionId: null },
      captures,
    })
  );

  const meta = await seedConversation();
  await store.appendConversationTranscript(
    meta.id,
    "ok.\n```cabinet\nSUMMARY: ok\n```"
  );
  await store.finalizeConversation(meta.id, {
    status: "completed",
    exitCode: 0,
    output: "ok.\n```cabinet\nSUMMARY: ok\n```",
  });
  await store.writeSession(meta.id, {
    kind: "mock_continue",
    resumeId: "s1",
    alive: true,
  });

  await runner.continueConversationRun(meta.id, {
    userMessage: "break it",
  });

  const reread = await store.readConversationMeta(meta.id);
  assert.equal(reread?.status, "failed");
  const turns = await store.readConversationTurns(meta.id);
  const last = turns[turns.length - 1];
  assert.equal(last.role, "agent");
  assert.equal(last.exitCode, 1);

  agentAdapterRegistry.unregisterExternal("mock_continue");
});
