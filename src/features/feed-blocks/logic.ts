// FEATURE: Feed Blocks — storage-backed CRUD + the CSS computation the content script calls.

import { getFeedBlocks, setFeedBlocks } from "@core/storage";
import type { FeedBlocksSettings, PlatformId } from "./types";
import { FEED_SELECTORS, rulesFor } from "./selectors";

export async function loadFeedBlocks(): Promise<FeedBlocksSettings> {
  return getFeedBlocks();
}

export async function togglePlatform(id: PlatformId, enabled: boolean): Promise<FeedBlocksSettings> {
  const settings = await getFeedBlocks();
  const next: FeedBlocksSettings = {
    ...settings,
    platforms: settings.platforms.map((p) => (p.id === id ? { ...p, enabled } : p)),
  };
  await setFeedBlocks(next);
  return next;
}

export async function toggleRegion(platformId: PlatformId, regionId: string, enabled: boolean): Promise<FeedBlocksSettings> {
  const settings = await getFeedBlocks();
  const next: FeedBlocksSettings = {
    ...settings,
    platforms: settings.platforms.map((p) =>
      p.id === platformId
        ? { ...p, regions: p.regions.map((r) => (r.id === regionId ? { ...r, enabled } : r)) }
        : p
    ),
  };
  await setFeedBlocks(next);
  return next;
}

/** Exported for the popup, which needs the same "does this hostname belong to a known platform"
 *  check to decide which of its own views to show — not worth a separate copy of this logic. */
export function findPlatformForHostname(hostname: string, settings: FeedBlocksSettings) {
  return settings.platforms.find((p) => p.hostnames.some((h) => hostname === h || hostname.endsWith(`.${h}`)));
}

/** Called by the content script on every matching page (and again on SPA route changes).
 *  pathname lets a platform reuse the same DOM pattern in two places (e.g. Facebook's
 *  role="article" posts appear on both the home feed and /groups/feed/) and still tell them
 *  apart. Empty string = nothing to hide. */
export function computeFeedBlockCss(hostname: string, pathname: string, settings: FeedBlocksSettings): string {
  const platform = findPlatformForHostname(hostname, settings);
  if (!platform || !platform.enabled) return "";

  const cssRules: string[] = [];
  for (const region of platform.regions) {
    if (!region.enabled) continue;
    const entry = FEED_SELECTORS[platform.id]?.[region.id];
    if (!entry) continue;
    for (const rule of rulesFor(entry)) {
      if (rule.selectors.length === 0) continue;
      if (rule.pathIncludes && !pathname.includes(rule.pathIncludes)) continue;
      if (rule.pathExcludes && pathname.includes(rule.pathExcludes)) continue;
      cssRules.push(`${rule.selectors.join(", ")} { display: none !important; }`);
    }
  }
  return cssRules.join("\n");
}
