export interface AvatarPreset {
  id: string;
  file: string; // path under /public
  label: string;
  suggestedFor?: string[]; // agent slugs where this is a natural fit
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "avatar-01", file: "/agent-avatars/avatar-01.svg", label: "Crop",     suggestedFor: ["cto", "devops", "developer"] },
  { id: "avatar-02", file: "/agent-avatars/avatar-02.svg", label: "Bob",      suggestedFor: ["copywriter", "ux-designer"] },
  { id: "avatar-03", file: "/agent-avatars/avatar-03.svg", label: "Long",     suggestedFor: ["content-marketer", "social-media"] },
  { id: "avatar-04", file: "/agent-avatars/avatar-04.svg", label: "Bun",      suggestedFor: ["legal", "product-manager"] },
  { id: "avatar-05", file: "/agent-avatars/avatar-05.svg", label: "Wavy",     suggestedFor: ["growth-marketer", "sales"] },
  { id: "avatar-06", file: "/agent-avatars/avatar-06.svg", label: "Curly",    suggestedFor: ["researcher", "data-analyst"] },
  { id: "avatar-07", file: "/agent-avatars/avatar-07.svg", label: "Ponytail", suggestedFor: ["qa", "customer-success"] },
  { id: "avatar-08", file: "/agent-avatars/avatar-08.svg", label: "Afro",     suggestedFor: ["ceo", "coo"] },
  { id: "avatar-09", file: "/agent-avatars/avatar-09.svg", label: "Bald",     suggestedFor: ["cfo", "people-ops"] },
  { id: "avatar-10", file: "/agent-avatars/avatar-10.svg", label: "Side",     suggestedFor: ["seo", "editor"] },
  { id: "avatar-11", file: "/agent-avatars/avatar-11.svg", label: "Beanie",   suggestedFor: ["developer", "general"] },
  { id: "avatar-12", file: "/agent-avatars/avatar-12.svg", label: "Long Alt", suggestedFor: [] },
];

export function getPresetById(id: string | undefined | null): AvatarPreset | null {
  if (!id) return null;
  return AVATAR_PRESETS.find((p) => p.id === id) ?? null;
}

// Resolves an agent's persisted `avatar` field + optional `avatarExt` into a URL.
// - If avatar matches a preset id, return its bundled SVG path.
// - If avatar === "custom", return the per-agent uploaded file path.
// - Otherwise return null (caller should fall back to icon rendering).
export function resolveAvatarUrl(
  agent: { slug: string; cabinetPath?: string; avatar?: string; avatarExt?: string }
): string | null {
  if (!agent.avatar) return null;
  const preset = getPresetById(agent.avatar);
  if (preset) return preset.file;
  if (agent.avatar === "custom" && agent.avatarExt) {
    const root = agent.cabinetPath
      ? `/api/agents/personas/${agent.slug}/avatar?ext=${agent.avatarExt}&cabinet=${encodeURIComponent(agent.cabinetPath)}`
      : `/api/agents/personas/${agent.slug}/avatar?ext=${agent.avatarExt}`;
    return root;
  }
  return null;
}
