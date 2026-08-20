// FEATURE: Feed Blocks — CSS selectors used to hide each region.
//
// Sourced from two places, both noted per entry:
// 1. Live-verified against a real logged-in session (2026-08-19, via Claude in Chrome).
// 2. Copied directly from the actively-maintained News Feed Eradicator project's sitelist
//    (https://github.com/jordwest/news-feed-eradicator/tree/master/src/sitelist — fetched as raw
//    source, not paraphrased), which is community-tested against real Facebook/Instagram/Reddit/
//    Twitter/YouTube/LinkedIn markup. Multiple candidate selectors per region are joined with a
//    comma so a match on any one of them (across different account/locale DOM variants) is enough.
//
// Confidence is marked per entry. Low-confidence / unknown entries are still included so the
// toggle exists and does nothing harmful — they just won't hide anything until a real selector
// is found. See the "known gaps" list in README.md for the full rundown.
//
// Each region maps to one or more CSS selectors (joined with a comma) that get `display: none`.

import type { PlatformId } from "./types";

export type Confidence = "high" | "medium" | "low" | "unknown";

interface SelectorRule {
  selectors: string[];
  /** Only apply this rule when location.pathname includes this substring. */
  pathIncludes?: string;
  /** Never apply this rule when location.pathname includes this substring. */
  pathExcludes?: string;
}

interface SelectorEntry {
  confidence: Confidence;
  /** Most regions need only one rule — pass its fields directly (still supported via the
   *  SingleRuleEntry union below). Regions that hide something everywhere (e.g. a nav icon) AND
   *  something else only on a specific page (e.g. that page's own content) need more than one
   *  rule with independent path scoping — use `rules` for those. */
  rules?: SelectorRule[];
  selectors?: string[];
  pathIncludes?: string;
  pathExcludes?: string;
}

/** Normalizes either shorthand (selectors/pathIncludes directly on the entry) or the explicit
 *  `rules` list into a flat list of rules. */
export function rulesFor(entry: SelectorEntry): SelectorRule[] {
  if (entry.rules) return entry.rules;
  if (entry.selectors) return [{ selectors: entry.selectors, pathIncludes: entry.pathIncludes, pathExcludes: entry.pathExcludes }];
  return [];
}

export const FEED_SELECTORS: Record<PlatformId, Record<string, SelectorEntry>> = {
  facebook: {
    // role="article" verified live on one account but confirmed ABSENT on another (Facebook
    // varies this by account/locale) — kept as an extra candidate alongside News Feed
    // Eradicator's class-based selector so either DOM variant matches.
    "main-feed": {
      selectors: ["div.x1hc1fzr.x1unhpq9.x6o7n8i", 'div[role="article"]'],
      confidence: "medium",
      pathExcludes: "/groups",
    },
    // aria-label="stories tray" verified live and working (2026-08-19).
    stories: {
      selectors: ["div.x193iq5w.xgmub6v.x1ceravr.x1v0nzow", 'div[aria-label="stories tray" i]'],
      confidence: "high",
    },
    // role="feed" verified live on /groups/feed/ specifically.
    "groups-feed": {
      selectors: ['div[role="feed"]'],
      confidence: "high",
      pathIncludes: "/groups",
    },
    // Verified live (2026-08-19). Hides the nav icon itself, plus (kept as belt-and-suspenders)
    // the two content surfaces found while this still showed the icon: the floating individual
    // chat popup windows, and the "Chats" list dropdown that opens from clicking the Messenger
    // icon (in case a popup ever opens some other way, e.g. from a notification).
    messages: {
      selectors: [
        'div[aria-label="Messenger" i]',
        'div.x5yr21d.x1uvtmcs:has([aria-label="Close chat" i])',
        'div[role="dialog"][aria-label="Messenger" i]',
      ],
      confidence: "high",
    },
    // Verified live (2026-08-19). "Video" in the product is Reels. Nav icon is left alone on
    // purpose — this only blanks the actual /reel/ page content (like Main feed does), scoped to
    // that path so it can't leak onto other pages. (First attempt hid a `div[role="group"]`
    // caption wrapper only — looked right in devtools but the video itself kept playing
    // underneath; hiding the <video> tag directly is what actually blanks it.)
    video: {
      selectors: ["[role=\"main\"] video", '[role="main"] div[role="group"]'],
      confidence: "high",
      pathIncludes: "/reel",
    },
    // Verified live (2026-08-19). Targets the right-sidebar ad cards via `attributionsrc` — the
    // Attribution Reporting API attribute browsers use for ad conversion tracking, present only
    // on ad links, never organic content. More reliable than the ad card's own wrapper classes,
    // which turned out to have more than one different DOM shape depending on which part of the
    // card (image vs. "..." menu) you climb up from.
    sponsored: {
      selectors: ["a[attributionsrc]"],
      confidence: "high",
    },
  },
  instagram: {
    "main-feed": { selectors: ["main > :nth-child(1) > div[style]"], confidence: "medium" },
    stories: { selectors: ["section > main div.xw7yly9 > div.xmnaoh6"], confidence: "medium" },
    "suggested-for-you": {
      selectors: ['div:has(> div > a[href="/explore/people/"])'],
      confidence: "medium",
    },
    "explore-suggestions": {
      selectors: ['main div:has(> div > div > a[href^="/p/"])'],
      confidence: "medium",
      pathIncludes: "/explore",
    },
  },
  youtube: {
    "main-feed": {
      selectors: ["ytd-browse[page-subtype=\"home\"] ytd-rich-grid-renderer", "ytd-browse"],
      confidence: "medium",
    },
    "shorts-button": {
      selectors: [
        "ytd-guide-entry-renderer:has(a[title=\"Shorts\"])",
        "ytd-mini-guide-entry-renderer:has(a[title=\"Shorts\"])",
      ],
      confidence: "high",
    },
    // Reference project's nth-child(4) assumes a sidebar layout that doesn't match every account
    // (verified live: on one account Explore was actually the 5th section, not the 4th, because
    // sidebar composition varies). Target by content (Explore always starts with "Music") instead
    // of position, with nth-child kept as a low-priority fallback.
    "explore-nav-menu": {
      selectors: ['ytd-guide-section-renderer:has(a[title="Music"])', "ytd-guide-section-renderer:nth-child(4)"],
      confidence: "high",
    },
    "end-screen-suggested": {
      selectors: [".ytp-fullscreen-grid", ".ytp-endscreen-content"],
      confidence: "medium",
    },
    "suggested-sidebar": { selectors: ["ytd-watch-next-secondary-results-renderer"], confidence: "high" },
    "video-comments": { selectors: ["ytd-comments"], confidence: "high" },
    "live-chat": { selectors: ["ytd-live-chat-frame"], confidence: "high" },
    notifications: { selectors: ["ytd-notification-topbar-button-renderer"], confidence: "high" },
    subscriptions: {
      selectors: ["ytd-guide-section-renderer:nth-child(2)", "ytd-mini-guide-renderer:nth-child(2)"],
      confidence: "medium",
    },
  },
  reddit: {
    feed: { selectors: ["#siteTable", "shreddit-feed"], confidence: "high", pathExcludes: "/r/" },
    "subreddit-feed": { selectors: ["#siteTable", "shreddit-feed"], confidence: "high", pathIncludes: "/r/" },
    "nav-tabs-old": { selectors: ["ul.tabmenu", "#sr-header-area"], confidence: "high" },
    "gallery-carousel": { selectors: ["shreddit-gallery-carousel"], confidence: "medium" },
    "left-sidebar": { selectors: ["reddit-sidebar-nav"], confidence: "medium" },
    "right-sidebar": { selectors: ["div.side", "#right-sidebar-contents"], confidence: "medium" },
    "recently-viewed": {
      selectors: ["div.spacer:has(div.sidecontentbox)", "recent-posts"],
      confidence: "medium",
    },
    games: {
      selectors: ['faceplate-tracker[noun="games_drawer"]', 'faceplate-tracker[noun="games_drawer"] + hr'],
      confidence: "medium",
    },
  },
  twitter: {
    "main-feed": {
      selectors: [
        'div[data-testid="primaryColumn"] > div > div > section[role="region"]',
        'div[aria-label="Home timeline" i] > div > section[role="region"]',
      ],
      confidence: "medium",
    },
    "explore-posts-for-you": {
      selectors: ['div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"]:has(article[data-testid="tweet"])'],
      confidence: "medium",
      pathIncludes: "/explore",
    },
    "todays-news": {
      selectors: ['div:has(> div[data-testid="news_sidebar"])', 'div:has(> div[data-testid^="news_sidebar_article_"])'],
      confidence: "medium",
    },
    trending: {
      selectors: ['section:has(div[aria-label="Timeline: Trending now" i])', 'div[aria-label="Timeline: Trending now" i]'],
      confidence: "medium",
    },
  },
  linkedin: {
    "main-feed": {
      selectors: ["main > div.relative > .scaffold-finite-scroll", 'div[componentkey^="container-update-list_mainFeed"]'],
      confidence: "medium",
    },
    "news-sidebar": {
      selectors: [
        "#feed-news-module",
        'div:has(> div > div[data-view-name="news-module"])',
        "main#workspace > div:nth-child(1) > div:nth-child(1) > aside:nth-child(3) > div:first-child > div:first-child",
      ],
      confidence: "medium",
    },
  },
};
