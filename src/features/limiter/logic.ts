// FEATURE: Limiter — logic. Time tracking + daily budget enforcement.
import { getLimiter, setLimiter, makeLimiterSiteId } from "@core/storage";
import { todayLocalDate } from "@core/local-date";
import { urlMatchesPattern, type MatchResult } from "@core/rule-engine";
import type { LimiterSettings, LimiterSite } from "./types";

function resetIfNewDay(site: LimiterSite): LimiterSite {
  const today = todayLocalDate();
  if (site.lastResetDate === today) return site;
  return { ...site, usedSeconds: 0, lastResetDate: today };
}

/** Reads Limiter settings, rolling any site whose budget is from a previous day back to 0 used. */
export async function loadLimiter(): Promise<LimiterSettings> {
  const settings = await getLimiter();
  const rolledSites = settings.sites.map(resetIfNewDay);
  const changed = rolledSites.some((site, i) => site !== settings.sites[i]);
  const rolled = { sites: rolledSites };
  if (changed) await setLimiter(rolled);
  return rolled;
}

export async function addSite(pattern: string, dailyBudgetMinutes: number): Promise<LimiterSettings> {
  const settings = await loadLimiter();
  const site: LimiterSite = {
    id: makeLimiterSiteId(),
    pattern,
    dailyBudgetMinutes,
    usedSeconds: 0,
    lastResetDate: todayLocalDate(),
  };
  const updated = { sites: [...settings.sites, site] };
  await setLimiter(updated);
  return updated;
}

export async function updateSite(
  id: string,
  changes: { pattern: string; dailyBudgetMinutes: number }
): Promise<LimiterSettings> {
  const settings = await loadLimiter();
  const updated = {
    sites: settings.sites.map((s) => (s.id === id ? { ...s, ...changes } : s)),
  };
  await setLimiter(updated);
  return updated;
}

export async function removeSite(id: string): Promise<LimiterSettings> {
  const settings = await loadLimiter();
  const updated = { sites: settings.sites.filter((s) => s.id !== id) };
  await setLimiter(updated);
  return updated;
}

/** For the webNavigation listener — blocks a fresh navigation to a site whose budget is already spent. */
export function matchLimiterExceeded(url: string, settings: LimiterSettings): MatchResult {
  for (const site of settings.sites) {
    if (urlMatchesPattern(url, site.pattern) && site.usedSeconds >= site.dailyBudgetMinutes * 60) {
      return { matched: true, reason: `Daily limit reached: ${site.pattern}` };
    }
  }
  return { matched: false };
}

const TICK_SECONDS = 60;

/**
 * Called once a minute from a chrome.alarms tick (background only). Adds a minute of usage to
 * whichever Limiter site matches the currently active tab in the currently focused window — i.e.
 * only counts time the user is actually looking at that tab, not background tabs. chrome.alarms'
 * minimum period is 1 minute, so usage is tracked in 1-minute increments, not to the exact second.
 * Returns the tab to redirect if this tick pushed it over budget, otherwise null.
 */
export async function tickActiveTab(): Promise<{ tabId: number; url: string } | null> {
  // chrome.windows.getLastFocused rejects with "No last-focused window" whenever Chrome itself
  // isn't the frontmost app — a normal, frequent state (the user is on another app), not a
  // failure, so it's treated the same as "no window is focused right now".
  let win: chrome.windows.Window | undefined;
  try {
    win = await chrome.windows.getLastFocused({});
  } catch {
    return null;
  }
  if (!win?.focused || win.id === undefined) return null;

  const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
  if (!tab?.url || tab.id === undefined) return null;

  const settings = await loadLimiter();
  const site = settings.sites.find((s) => urlMatchesPattern(tab.url!, s.pattern));
  if (!site) return null;

  site.usedSeconds += TICK_SECONDS;
  await setLimiter(settings);

  if (site.usedSeconds >= site.dailyBudgetMinutes * 60) {
    return { tabId: tab.id, url: tab.url };
  }
  return null;
}
