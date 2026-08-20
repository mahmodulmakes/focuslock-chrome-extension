// Feed Blocks content script. Only runs on hosts the extension currently has permission for
// (declared as optional_host_permissions in manifest.json) — see feed-blocks/index.tsx for how
// that permission gets requested. Hides regions via an injected stylesheet, not one-time DOM
// removal, so it keeps working as infinite-scroll content loads and stays live if settings change.
//
// These sites are all client-side-routed SPAs (e.g. Facebook's home feed vs /groups/feed/ share
// markup but need different rules), and some of them occasionally wipe our injected <style> tag
// during their own internal re-renders even without a URL change — seen in practice on long
// sessions (hours), not just on navigation. So instead of only reacting to path changes or
// storage changes, this polls and unconditionally re-applies on a fixed interval: cheap (a pure
// CSS-string computation plus a style-tag write), and self-healing regardless of *why* the page
// stopped reflecting the current settings.

import { getFeedBlocks, onFeedBlocksChange } from "@core/storage";
import { computeFeedBlockCss } from "@features/feed-blocks/logic";
import type { FeedBlocksSettings } from "@features/feed-blocks/types";

const STYLE_ID = "fl-feed-blocks-style";
const REAPPLY_POLL_MS = 500;

let currentSettings: FeedBlocksSettings | null = null;

function applyCss(css: string) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!css) {
    style?.remove();
    return;
  }
  if (!style || !style.isConnected) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.documentElement.appendChild(style);
  }
  style.textContent = css;
}

function applyForCurrentPage() {
  if (!currentSettings) return;
  applyCss(computeFeedBlockCss(location.hostname, location.pathname, currentSettings));
}

async function run() {
  currentSettings = await getFeedBlocks();
  applyForCurrentPage();
}

run();

onFeedBlocksChange((settings) => {
  currentSettings = settings;
  applyForCurrentPage();
});

setInterval(applyForCurrentPage, REAPPLY_POLL_MS);
