// FEATURE: Feed Blocks — shared types for this feature only.
// Nothing outside features/feed-blocks/ should need to import these directly;
// core/storage.ts re-exports the composed shape, and the feed-blocks content script
// imports FeedBlocksSettings + the region shape to compute what to hide.

import type { BrandPlatformId } from "@core/ui/PlatformIcon";

export type PlatformId = BrandPlatformId;

export interface FeedRegion {
  id: string;
  /** Shown in the "Hide regions" list, e.g. "Main feed". */
  label: string;
  enabled: boolean;
}

export interface FeedPlatform {
  id: PlatformId;
  label: string;
  /** Shown under the platform name, e.g. "www.facebook.com, web.facebook.com". */
  domainsLabel: string;
  /** Hostnames this platform matches against — used by the content script and the
   *  optional_host_permissions request, kept separate from domainsLabel so the display
   *  copy can stay human-friendly without parsing it. */
  hostnames: string[];
  /** Master switch — must be on (and permission granted) before any region can hide anything. */
  enabled: boolean;
  regions: FeedRegion[];
}

export interface FeedBlocksSettings {
  platforms: FeedPlatform[];
}
