// FEATURE: Block Sites — shared types for this feature only.
// Nothing outside features/block-sites/ should need to import these directly;
// core/storage.ts re-exports the composed shape for the background service worker.

export interface CategoryRule {
  id: string;
  label: string;
  /** Short helper text shown under the category name, e.g. "Facebook, Instagram, X…" */
  description: string;
  /** Curated domains this category blocks when enabled. Intentionally starter lists — expand later. */
  domains: string[];
  enabled: boolean;
}

export interface CustomSiteRule {
  id: string;
  /** Friendly label, also used to derive the two-letter badge in the list row. */
  label: string;
  /** URL pattern, e.g. "reddit.com/*" */
  pattern: string;
  enabled: boolean;
}

export interface BlockSitesSettings {
  categories: CategoryRule[];
  customSites: CustomSiteRule[];
  /** If set, a blocked navigation redirects here instead of showing the internal blocked page. */
  redirectUrl: string | null;
}
