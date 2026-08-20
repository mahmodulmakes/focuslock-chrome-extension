// Shared storage schema + typed helpers. Every feature reads/writes through this file —
// no feature should call chrome.storage directly with an ad hoc key.

import type { BlockSitesSettings } from "@features/block-sites/types";
import type { FeedBlocksSettings } from "@features/feed-blocks/types";
import type { ReelBlocksSettings } from "@features/reel-blocks/types";
import type { LimiterSettings } from "@features/limiter/types";

export interface FocusLockData {
  blockSites: BlockSitesSettings;
  feedBlocks: FeedBlocksSettings;
  reelBlocks: ReelBlocksSettings;
  limiter: LimiterSettings;
  // Added as each feature gets built: passwordProtection, settings, aboutUs. Keeping this
  // interface additive means building a new feature never requires touching an existing
  // feature's storage code.
}

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultBlockSitesSettings(): BlockSitesSettings {
  return {
    redirectUrl: null,
    categories: [
      {
        id: "social-media",
        label: "Social Media",
        description: "Facebook, Instagram, X…",
        domains: [
          "facebook.com",
          "instagram.com",
          "twitter.com",
          "x.com",
          "tiktok.com",
          "snapchat.com",
          "linkedin.com",
        ],
        enabled: false,
      },
      {
        id: "adult-sites",
        label: "Adult Sites",
        description: "Curated blocklist",
        // Intentionally empty — this needs a maintained, vetted domain list before it does
        // anything. Ships as a working toggle with no effect until that list is added.
        domains: [],
        enabled: false,
      },
      {
        id: "shopping-sites",
        label: "Shopping Sites",
        description: "Amazon, eBay…",
        domains: ["amazon.com", "ebay.com", "aliexpress.com", "walmart.com", "etsy.com"],
        enabled: false,
      },
      {
        id: "gambling",
        label: "Gambling",
        description: "Curated blocklist",
        domains: ["bet365.com", "draftkings.com", "fanduel.com", "pokerstars.com"],
        enabled: false,
      },
      {
        id: "news",
        label: "News",
        description: "Curated blocklist",
        domains: ["cnn.com", "bbc.com", "nytimes.com", "foxnews.com"],
        enabled: false,
      },
    ],
    customSites: [],
  };
}

export function makeCustomSiteId(): string {
  return id("site");
}

export function makeLimiterSiteId(): string {
  return id("limiter");
}

/** Toggle defaults match the reference mockup: Facebook/Instagram/YouTube on, LinkedIn off. */
export function defaultReelBlocksSettings(): ReelBlocksSettings {
  return {
    platforms: [
      {
        id: "facebook",
        label: "Facebook",
        domainsLabel: "www.facebook.com, web.facebook.com",
        pattern: "facebook.com/reel/*",
        enabled: true,
      },
      {
        id: "instagram",
        label: "Instagram",
        domainsLabel: "www.instagram.com",
        pattern: "instagram.com/reels/*",
        enabled: true,
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        domainsLabel: "www.linkedin.com",
        // LinkedIn's short-form vertical video feed — best-effort guess, not live-verified.
        // See README's Reel Blocks notes.
        pattern: "linkedin.com/video/*",
        enabled: false,
      },
      {
        id: "youtube",
        label: "YouTube",
        domainsLabel: "www.youtube.com, m.youtube.com",
        pattern: "youtube.com/shorts/*",
        enabled: true,
      },
    ],
  };
}

/**
 * Platform master toggles default OFF — turning one on triggers a live
 * chrome.permissions.request() for that site (see feed-blocks/index.tsx), which can't be
 * pre-granted at install. Region defaults inside each platform match the reference mockups
 * so a platform looks right the moment it's turned on.
 */
export function defaultFeedBlocksSettings(): FeedBlocksSettings {
  return {
    platforms: [
      {
        id: "facebook",
        label: "Facebook",
        domainsLabel: "www.facebook.com, web.facebook.com",
        hostnames: ["facebook.com"],
        enabled: false,
        regions: [
          { id: "main-feed", label: "Main feed", enabled: true },
          { id: "stories", label: "Stories", enabled: true },
          { id: "messages", label: "Messages", enabled: true },
          { id: "video", label: "Reels", enabled: true },
          { id: "groups-feed", label: "Groups feed", enabled: false },
          { id: "sponsored", label: "Sponsored", enabled: true },
        ],
      },
      {
        id: "instagram",
        label: "Instagram",
        domainsLabel: "www.instagram.com",
        hostnames: ["instagram.com"],
        enabled: false,
        regions: [
          { id: "main-feed", label: "Main feed", enabled: true },
          { id: "stories", label: "Stories", enabled: true },
          { id: "suggested-for-you", label: "Suggested for you", enabled: true },
          { id: "explore-suggestions", label: "Explore Suggestions", enabled: true },
        ],
      },
      {
        id: "youtube",
        label: "YouTube",
        domainsLabel: "www.youtube.com, m.youtube.com",
        hostnames: ["youtube.com"],
        enabled: false,
        regions: [
          { id: "main-feed", label: "Main feed", enabled: true },
          { id: "shorts-button", label: "Shorts button", enabled: true },
          { id: "explore-nav-menu", label: "Explore navigation menu", enabled: true },
          { id: "end-screen-suggested", label: "End screen suggested videos", enabled: true },
          { id: "suggested-sidebar", label: "Suggested videos sidebar", enabled: true },
          { id: "video-comments", label: "Video comments", enabled: false },
          { id: "live-chat", label: "Live chat", enabled: false },
          { id: "notifications", label: "Notifications", enabled: false },
          { id: "subscriptions", label: "Subscriptions", enabled: false },
        ],
      },
      {
        id: "reddit",
        label: "Reddit",
        domainsLabel: "www.reddit.com, old.reddit.com",
        hostnames: ["reddit.com"],
        enabled: false,
        regions: [
          { id: "feed", label: "Feed", enabled: true },
          { id: "subreddit-feed", label: "Subreddit Feed", enabled: true },
          { id: "nav-tabs-old", label: "Navigation tabs (Old reddit)", enabled: true },
          { id: "gallery-carousel", label: "Gallery Carousel", enabled: true },
          { id: "left-sidebar", label: "Left navigation sidebar", enabled: false },
          { id: "right-sidebar", label: "Right sidebar", enabled: false },
          { id: "recently-viewed", label: "Recently viewed", enabled: true },
          { id: "games", label: "Games on Reddit", enabled: true },
        ],
      },
      {
        id: "twitter",
        label: "Twitter/X",
        domainsLabel: "twitter.com, x.com",
        hostnames: ["twitter.com", "x.com"],
        enabled: false,
        regions: [
          { id: "main-feed", label: "Main feed", enabled: true },
          { id: "explore-posts-for-you", label: 'Explore "Posts For You"', enabled: true },
          { id: "todays-news", label: "Today's News", enabled: true },
          { id: "trending", label: "Trending now/What's happening", enabled: true },
        ],
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        domainsLabel: "www.linkedin.com",
        hostnames: ["linkedin.com"],
        enabled: false,
        regions: [
          { id: "main-feed", label: "Main feed", enabled: true },
          { id: "news-sidebar", label: "News sidebar", enabled: true },
        ],
      },
    ],
  };
}

/** Ships empty — Limiter is opt-in per site, there's nothing sensible to pre-populate. */
export function defaultLimiterSettings(): LimiterSettings {
  return { sites: [] };
}

const DEFAULTS: FocusLockData = {
  blockSites: defaultBlockSitesSettings(),
  feedBlocks: defaultFeedBlocksSettings(),
  reelBlocks: defaultReelBlocksSettings(),
  limiter: defaultLimiterSettings(),
};

/** A shallow `{...defaults, ...stored}` would silently drop any region added to defaultFeedBlocksSettings()
 *  after a user already has data saved — the stored `platforms` array would just replace the
 *  default one wholesale. Merge per-platform and per-region instead, so new regions (like adding
 *  Messages/Video to Facebook) show up for existing users with their default enabled state, while
 *  regions/platforms the user already touched keep their saved choice. */
function mergeFeedBlocks(defaults: FeedBlocksSettings, stored: Partial<FeedBlocksSettings> | undefined): FeedBlocksSettings {
  if (!stored?.platforms) return defaults;
  return {
    platforms: defaults.platforms.map((defaultPlatform) => {
      const storedPlatform = stored.platforms!.find((p) => p.id === defaultPlatform.id);
      if (!storedPlatform) return defaultPlatform;
      return {
        ...defaultPlatform,
        enabled: storedPlatform.enabled,
        regions: defaultPlatform.regions.map((defaultRegion) => {
          const storedRegion = storedPlatform.regions.find((r) => r.id === defaultRegion.id);
          return storedRegion ? { ...defaultRegion, enabled: storedRegion.enabled } : defaultRegion;
        }),
      };
    }),
  };
}

/** Same reasoning as mergeFeedBlocks — merges platforms by id so a platform added to
 *  defaultReelBlocksSettings() later shows up for existing users with its default enabled
 *  state, while a platform the user already toggled keeps their choice. label/domainsLabel/
 *  pattern always come from defaults, not storage, so a copy or pattern fix ships to everyone
 *  automatically instead of getting stuck at whatever was saved when they first installed. */
function mergeReelBlocks(defaults: ReelBlocksSettings, stored: Partial<ReelBlocksSettings> | undefined): ReelBlocksSettings {
  if (!stored?.platforms) return defaults;
  return {
    platforms: defaults.platforms.map((defaultPlatform) => {
      const storedPlatform = stored.platforms!.find((p) => p.id === defaultPlatform.id);
      return storedPlatform ? { ...defaultPlatform, enabled: storedPlatform.enabled } : defaultPlatform;
    }),
  };
}

/** Reads the whole schema, filling in defaults for anything not yet stored. */
export async function getData(): Promise<FocusLockData> {
  const stored = await chrome.storage.sync.get(null);
  return {
    ...DEFAULTS,
    ...stored,
    blockSites: {
      ...DEFAULTS.blockSites,
      ...(stored.blockSites as Partial<BlockSitesSettings> | undefined),
    },
    feedBlocks: mergeFeedBlocks(DEFAULTS.feedBlocks, stored.feedBlocks as Partial<FeedBlocksSettings> | undefined),
    reelBlocks: mergeReelBlocks(DEFAULTS.reelBlocks, stored.reelBlocks as Partial<ReelBlocksSettings> | undefined),
    limiter: {
      sites: (stored.limiter as Partial<LimiterSettings> | undefined)?.sites ?? DEFAULTS.limiter.sites,
    },
  } as FocusLockData;
}

export async function getBlockSites(): Promise<BlockSitesSettings> {
  const data = await getData();
  return data.blockSites;
}

export async function setBlockSites(settings: BlockSitesSettings): Promise<void> {
  await chrome.storage.sync.set({ blockSites: settings });
}

export async function getFeedBlocks(): Promise<FeedBlocksSettings> {
  const data = await getData();
  return data.feedBlocks;
}

export async function setFeedBlocks(settings: FeedBlocksSettings): Promise<void> {
  await chrome.storage.sync.set({ feedBlocks: settings });
}

/** Fires cb whenever Feed Blocks settings change — the content script uses this to live-update
 *  its injected <style> without needing a page reload. */
export function onFeedBlocksChange(cb: (settings: FeedBlocksSettings) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area !== "sync" || !changes.feedBlocks) return;
    cb(changes.feedBlocks.newValue as FeedBlocksSettings);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export async function getReelBlocks(): Promise<ReelBlocksSettings> {
  const data = await getData();
  return data.reelBlocks;
}

export async function setReelBlocks(settings: ReelBlocksSettings): Promise<void> {
  await chrome.storage.sync.set({ reelBlocks: settings });
}

export async function getLimiter(): Promise<LimiterSettings> {
  const data = await getData();
  return data.limiter;
}

export async function setLimiter(settings: LimiterSettings): Promise<void> {
  await chrome.storage.sync.set({ limiter: settings });
}

/** Fires cb whenever Limiter settings change — the options page uses this to live-refresh
 *  progress bars while it's open, since the background worker updates usedSeconds on its own. */
export function onLimiterChange(cb: (settings: LimiterSettings) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area !== "sync" || !changes.limiter) return;
    cb(changes.limiter.newValue as LimiterSettings);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
