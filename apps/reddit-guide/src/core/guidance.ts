import type { Guidance } from "./types.ts";

export const defaultGuidance: Guidance = {
  opening: "Thanks for raising this.",
  internalDirection:
    "Be useful, direct, and honest about what HUHY can and cannot do. Never imply official Air Force endorsement.",
  closing: "If you want, share the public, non-sensitive version with HUHY.",
  destinationUrl: "https://huhyproject.org",
  tone: "plain",
  autoReplyEnabled: false,
};

export const guidanceStorageKey = "huhy:guidance:v1";
export const latestDraftStorageKey = "huhy:draft:latest:v1";

export function normalizeGuidance(
  value: Partial<Guidance> | undefined,
): Guidance {
  const tone =
    value?.tone === "warm" || value?.tone === "brief" ? value.tone : "plain";

  return {
    opening: clean(value?.opening) || defaultGuidance.opening,
    internalDirection:
      clean(value?.internalDirection) || defaultGuidance.internalDirection,
    closing: clean(value?.closing) || defaultGuidance.closing,
    destinationUrl:
      normalizePublicUrl(value?.destinationUrl) ||
      defaultGuidance.destinationUrl,
    tone,
    autoReplyEnabled: value?.autoReplyEnabled === true,
  };
}

export function normalizePublicUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    if (url.hostname.endsWith(".mil")) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}
