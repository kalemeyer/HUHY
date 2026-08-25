import { redis } from "@devvit/web/server";

import {
  defaultGuidance,
  guidanceStorageKey,
  latestDraftStorageKey,
  normalizeGuidance,
} from "../core/guidance";
import type { Guidance, SavedDraft } from "../core/types";

const guidanceRetentionMs = 90 * 24 * 60 * 60 * 1000;
const draftRetentionMs = 7 * 24 * 60 * 60 * 1000;

export async function getGuidance(): Promise<Guidance> {
  const stored = await redis.get(guidanceStorageKey);
  if (!stored) return defaultGuidance;
  try {
    return normalizeGuidance(JSON.parse(stored) as Partial<Guidance>);
  } catch {
    return defaultGuidance;
  }
}

export async function saveGuidance(guidance: Guidance): Promise<void> {
  await redis.set(guidanceStorageKey, JSON.stringify(guidance), {
    expiration: new Date(Date.now() + guidanceRetentionMs),
  });
}

export async function getLatestDraft(): Promise<SavedDraft | undefined> {
  const stored = await redis.get(latestDraftStorageKey);
  if (!stored) return undefined;
  try {
    return JSON.parse(stored) as SavedDraft;
  } catch {
    return undefined;
  }
}

export async function saveLatestDraft(draft: SavedDraft): Promise<void> {
  await redis.set(latestDraftStorageKey, JSON.stringify(draft), {
    expiration: new Date(Date.now() + draftRetentionMs),
  });
}

export async function clearStoredData(): Promise<void> {
  await redis.del(guidanceStorageKey, latestDraftStorageKey);
}
