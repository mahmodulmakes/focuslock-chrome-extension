// Popup shell — reads across features to decide which of the three views to show for the
// current tab. Not a feature itself (like src/options/App.tsx), so it's allowed to import from
// more than one feature.
import { loadBlockSites, matchBlockSites, addCustomSite } from "@features/block-sites/logic";
import { loadFeedBlocks, findPlatformForHostname } from "@features/feed-blocks/logic";
import type { FeedPlatform } from "@features/feed-blocks/types";
import type { BrandPlatformId } from "@core/ui/PlatformIcon";

export type PopupView =
  | { kind: "loading" }
  | { kind: "unsupported" }
  | { kind: "blocked"; hostname: string; brandId: BrandPlatformId | null }
  | { kind: "feed-platform"; platform: FeedPlatform }
  | { kind: "default"; hostname: string };

async function currentTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

const BLOCKED_PAGE_URL = chrome.runtime.getURL("src/blocked/index.html");

/** Once a page is actually blocked, the tab's own URL is our *own* blocked landing page
 *  (chrome-extension://…/src/blocked/index.html?...), not an http(s) URL any more — so the
 *  popup needs to resolve against the *original* site it was blocking (passed through as that
 *  page's own `?url=` param) instead of the tab's literal current URL, or it can never detect
 *  "you're looking at a blocked page" at all. */
function effectiveUrl(tabUrl: string): string | null {
  if (tabUrl.startsWith(BLOCKED_PAGE_URL)) {
    return new URL(tabUrl).searchParams.get("url");
  }
  return tabUrl;
}

/** "Currently blocked" only reflects Block Sites' whole-domain blocking — Reel Blocks/Limiter
 *  only block specific paths on a site, not the site itself, so they don't fit this same
 *  yes/no question the popup is asking. */
export async function resolvePopupView(): Promise<PopupView> {
  const tab = await currentTab();
  const url = tab?.url ? effectiveUrl(tab.url) : null;
  if (!url || !/^https?:\/\//i.test(url)) {
    return { kind: "unsupported" };
  }

  const hostname = new URL(url).hostname.replace(/^www\./i, "");
  const [blockSites, feedBlocks] = await Promise.all([loadBlockSites(), loadFeedBlocks()]);
  const platform = findPlatformForHostname(hostname, feedBlocks);

  if (matchBlockSites(url, blockSites).matched) {
    return { kind: "blocked", hostname, brandId: platform?.id ?? null };
  }
  if (platform) {
    return { kind: "feed-platform", platform };
  }
  return { kind: "default", hostname };
}

/** "Block This Site" — adds it to Block Sites' custom list and immediately redirects the tab,
 *  rather than waiting for the next navigation to notice. */
export async function blockCurrentSite(hostname: string): Promise<void> {
  await addCustomSite(hostname, `${hostname}/*`);
  const tab = await currentTab();
  if (!tab?.id) return;
  const destination = `${BLOCKED_PAGE_URL}?reason=${encodeURIComponent(
    `Blocked site: ${hostname}`
  )}&url=${encodeURIComponent(tab.url ?? "")}`;
  chrome.tabs.update(tab.id, { url: destination });
}

export function openOptionsPage(hash?: string): void {
  const url = chrome.runtime.getURL(`src/options/index.html${hash ? `#${hash}` : ""}`);
  chrome.tabs.create({ url });
}
