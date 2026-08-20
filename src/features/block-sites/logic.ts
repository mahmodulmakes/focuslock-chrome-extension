// FEATURE: Block Sites — storage-backed CRUD + the match check background/index.ts calls.

import { getBlockSites, setBlockSites, makeCustomSiteId } from "@core/storage";
import { matchCategories, matchCustomSites, type MatchResult } from "@core/rule-engine";
import type { BlockSitesSettings, CustomSiteRule } from "./types";

export async function loadBlockSites(): Promise<BlockSitesSettings> {
  return getBlockSites();
}

export async function toggleCategory(id: string, enabled: boolean): Promise<BlockSitesSettings> {
  const settings = await getBlockSites();
  const next: BlockSitesSettings = {
    ...settings,
    categories: settings.categories.map((c) => (c.id === id ? { ...c, enabled } : c)),
  };
  await setBlockSites(next);
  return next;
}

export async function addCustomSite(label: string, pattern: string): Promise<BlockSitesSettings> {
  const settings = await getBlockSites();
  const newSite: CustomSiteRule = {
    id: makeCustomSiteId(),
    label: label.trim() || pattern.trim(),
    pattern: pattern.trim(),
    enabled: true,
  };
  const next: BlockSitesSettings = { ...settings, customSites: [...settings.customSites, newSite] };
  await setBlockSites(next);
  return next;
}

export async function updateCustomSite(
  id: string,
  changes: Partial<Pick<CustomSiteRule, "label" | "pattern">>
): Promise<BlockSitesSettings> {
  const settings = await getBlockSites();
  const next: BlockSitesSettings = {
    ...settings,
    customSites: settings.customSites.map((s) => (s.id === id ? { ...s, ...changes } : s)),
  };
  await setBlockSites(next);
  return next;
}

export async function toggleCustomSite(id: string, enabled: boolean): Promise<BlockSitesSettings> {
  const settings = await getBlockSites();
  const next: BlockSitesSettings = {
    ...settings,
    customSites: settings.customSites.map((s) => (s.id === id ? { ...s, enabled } : s)),
  };
  await setBlockSites(next);
  return next;
}

export async function removeCustomSite(id: string): Promise<BlockSitesSettings> {
  const settings = await getBlockSites();
  const next: BlockSitesSettings = {
    ...settings,
    customSites: settings.customSites.filter((s) => s.id !== id),
  };
  await setBlockSites(next);
  return next;
}

export async function setRedirectUrl(redirectUrl: string | null): Promise<BlockSitesSettings> {
  const settings = await getBlockSites();
  const next: BlockSitesSettings = { ...settings, redirectUrl: redirectUrl || null };
  await setBlockSites(next);
  return next;
}

/** Called from the background service worker on every navigation. */
export function matchBlockSites(url: string, settings: BlockSitesSettings): MatchResult {
  const categoryMatch = matchCategories(url, settings.categories);
  if (categoryMatch.matched) return categoryMatch;
  return matchCustomSites(url, settings.customSites);
}
