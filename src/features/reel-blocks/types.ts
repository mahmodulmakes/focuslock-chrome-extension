import type { BrandPlatformId } from "@core/ui/PlatformIcon";

export interface ReelPlatform {
  id: BrandPlatformId;
  label: string;
  /** Shown under the platform name, e.g. "www.facebook.com, web.facebook.com". */
  domainsLabel: string;
  /** Internal hard-block target — not shown in the UI. Scoped to this platform's short-form
   *  video path specifically, so search and regular content on the same site keep working. */
  pattern: string;
  enabled: boolean;
}

export interface ReelBlocksSettings {
  platforms: ReelPlatform[];
}
