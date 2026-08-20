// FEATURE: Reel Blocks — logic. Owns its own state; talks to storage only through here.
import { getReelBlocks, setReelBlocks } from "@core/storage";
import { matchCustomSites, type MatchResult } from "@core/rule-engine";
import type { ReelBlocksSettings, ReelPlatform } from "./types";

export async function loadReelBlocks(): Promise<ReelBlocksSettings> {
  return getReelBlocks();
}

export async function togglePlatform(id: ReelPlatform["id"], enabled: boolean): Promise<ReelBlocksSettings> {
  const settings = await getReelBlocks();
  const updated = { platforms: settings.platforms.map((p) => (p.id === id ? { ...p, enabled } : p)) };
  await setReelBlocks(updated);
  return updated;
}

export function matchReelBlocks(url: string, settings: ReelBlocksSettings): MatchResult {
  return matchCustomSites(url, settings.platforms);
}
