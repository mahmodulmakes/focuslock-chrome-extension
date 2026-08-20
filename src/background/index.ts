// Background service worker. Wires up Block Sites + Reel Blocks + Limiter. Password Protection,
// etc. get added here as their own `checkX(url)` calls once built, per FocusLock-Development-Spec.md.

import { loadBlockSites, matchBlockSites } from "@features/block-sites/logic";
import { loadReelBlocks, matchReelBlocks } from "@features/reel-blocks/logic";
import { loadLimiter, matchLimiterExceeded, tickActiveTab } from "@features/limiter/logic";

const BLOCKED_PAGE = chrome.runtime.getURL("src/blocked/index.html");

/** "push" adds the blocked page as a new history entry — correct for onBeforeNavigate, which
 *  fires *before* the navigation commits, so there's nothing bad already sitting in history.
 *  "replace" is for signals that fire *after* a same-page (SPA) navigation already committed
 *  (onHistoryStateUpdated, tabs.onUpdated) — e.g. clicking a Reel inside Facebook: Facebook's
 *  own history.pushState() already added that reel's URL to history before we ever saw it, so
 *  pushing the blocked page on top would sandwich the bad URL in the middle of history. Back
 *  from the blocked page would land back on it and get instantly re-blocked, making Back look
 *  broken. Replacing that already-committed entry instead means Back correctly skips straight
 *  past the blocked attempt to wherever the user actually was before it. */
type RedirectMode = "push" | "replace";

function redirectTab(tabId: number, url: string, mode: RedirectMode) {
  if (mode === "push") {
    chrome.tabs.update(tabId, { url });
    return;
  }
  chrome.scripting
    .executeScript({ target: { tabId }, func: (dest) => location.replace(dest), args: [url] })
    .catch(() => {
      // Tab may already be gone, or the page may be one scripting can't reach — a plain
      // navigation still gets the user off the blocked content either way.
      chrome.tabs.update(tabId, { url });
    });
}

async function checkAndRedirect(tabId: number, url: string, mode: RedirectMode) {
  if (!url || !/^https?:\/\//i.test(url)) return;

  const blockSitesSettings = await loadBlockSites();
  const blockSitesResult = matchBlockSites(url, blockSitesSettings);
  if (blockSitesResult.matched) {
    const destination = blockSitesSettings.redirectUrl
      ? blockSitesSettings.redirectUrl
      : `${BLOCKED_PAGE}?reason=${encodeURIComponent(blockSitesResult.reason ?? "Blocked")}&url=${encodeURIComponent(url)}`;
    redirectTab(tabId, destination, mode);
    return;
  }

  // Reel Blocks has no redirect-URL option of its own — always the internal blocked page.
  const reelBlocksSettings = await loadReelBlocks();
  const reelBlocksResult = matchReelBlocks(url, reelBlocksSettings);
  if (reelBlocksResult.matched) {
    const destination = `${BLOCKED_PAGE}?reason=${encodeURIComponent(reelBlocksResult.reason ?? "Blocked")}&url=${encodeURIComponent(url)}`;
    redirectTab(tabId, destination, mode);
    return;
  }

  // Catches a fresh navigation to a site whose daily budget is already spent (e.g. opening a
  // new tab to it, or a link click) — the alarm tick below handles a tab that's already open.
  const limiterSettings = await loadLimiter();
  const limiterResult = matchLimiterExceeded(url, limiterSettings);
  if (limiterResult.matched) {
    const destination = `${BLOCKED_PAGE}?reason=${encodeURIComponent(limiterResult.reason ?? "Blocked")}&url=${encodeURIComponent(url)}`;
    redirectTab(tabId, destination, mode);
  }
}

/** One bad read (e.g. a transient chrome.storage error) shouldn't silently kill the rest of
 *  this check, and logging it means a real problem is visible in the service worker's own
 *  console instead of just quietly not blocking anything. */
async function handleNavigation(tabId: number, url: string | undefined, mode: RedirectMode) {
  if (!url) return;
  try {
    await checkAndRedirect(tabId, url, mode);
  } catch (err) {
    console.error("FocusLock: navigation check failed", err);
  }
}

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Only act on the top-level frame — don't block iframes embedded in an otherwise-allowed page.
  if (details.frameId !== 0) return;
  handleNavigation(details.tabId, details.url, "push");
});
// Catches in-app URL changes on single-page apps (e.g. scrolling into a feed section) without a
// full reload — same mechanism the v1 build used for Reel Blocker. Fires after the SPA's own
// history change already committed, hence "replace" — see the RedirectMode comment above.
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return;
  handleNavigation(details.tabId, details.url, "replace");
});

// chrome.webNavigation's SPA-navigation event isn't fully reliable on every site — some heavy
// client-side routers (YouTube Shorts, in particular) don't always trigger it for every in-app
// route change. chrome.tabs.onUpdated fires whenever a tab's own url actually changes, which is
// a second, independent signal for the same thing — cheap defense-in-depth against the same
// check silently getting missed on a site webNavigation doesn't fully cover. Also post-commit,
// so also "replace".
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) handleNavigation(tabId, changeInfo.url, "replace");
});

// Limiter's time-tracking tick. chrome.alarms' minimum period is 1 minute — that's Chrome's
// platform floor for MV3 service workers, not a choice — so usage is counted in 1-minute
// increments (whichever site matches the active tab in the currently-focused window at the
// moment each alarm fires), not to the exact second.
const LIMITER_ALARM = "limiter-tick";
chrome.alarms.create(LIMITER_ALARM, { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== LIMITER_ALARM) return;
  try {
    const overBudget = await tickActiveTab();
    if (overBudget) {
      const destination = `${BLOCKED_PAGE}?reason=${encodeURIComponent("Daily limit reached")}&url=${encodeURIComponent(overBudget.url)}`;
      chrome.tabs.update(overBudget.tabId, { url: destination });
    }
  } catch (err) {
    console.error("FocusLock: limiter tick failed", err);
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // No forced setup tab in v2 — the extension works immediately. See
    // FocusLock-Page-List-v2.md for why the mandatory password gate was removed.
  }
});
