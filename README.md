# FocusLock — v2

A Chrome extension (Manifest V3) that blocks distracting sites, short-form video ("reels"), and
infinite-scroll feeds — with a daily time-budget limiter, and (planned) password-gated site
protection.

This is the **v2 codebase**, built fresh — it does not extend an earlier v1 build. Read
[CLAUDE.md](CLAUDE.md) before making changes: it's the operating manual for how this repo is
organized and the rules for working in it (most important: features are isolated in
`src/features/<name>/` and must not import from each other — shared logic goes in `src/core/`).

## Setup

```bash
npm install
npm run dev        # local dev server, for iterating on UI in a normal browser tab (chrome.* APIs
                    # aren't available here — see "Developing without the real extension" below)
npm run build       # produces dist/ — a loadable, unpacked Chrome extension
npm run typecheck
npm test            # runs the rule-engine unit tests
```

## Load it in Chrome

1. `npm run build`
2. Go to `chrome://extensions`
3. Turn on **Developer mode** (top right)
4. Click **Load unpacked**, select the `dist` folder
5. Click the FocusLock icon to see the popup (its view depends on the site in your active tab —
   see "Popup" below), or the gear icon inside it to open full Settings

After changing code, `npm run build` again and click the reload icon on the extension's card in
`chrome://extensions`.

### Developing without the real extension

`chrome.*` APIs (storage, tabs, permissions, alarms, webNavigation) only exist inside a real
loaded extension — `npm run dev`'s plain browser tab doesn't have them, and neither does an
automated browser tool driving a real page. To iterate on UI quickly, mock `window.chrome` in a
throwaway HTML file that loads the real `main.tsx` as a module script (before the module script
tag, so it's guaranteed to exist first):

```html
<script>
  window.chrome = {
    storage: {
      sync: { get: async () => ({}), set: async () => {} },
      local: { get: async () => ({}), set: async () => {} },
      onChanged: { addListener() {}, removeListener() {} },
    },
    tabs: { query: async () => [{ id: 1, url: "https://example.com/" }] },
    permissions: { request: async () => true },
    runtime: { getURL: (p) => "chrome-extension://mockid/" + p },
  };
</script>
<div id="root"></div>
<script type="module" src="./main.tsx"></script>
```

`storage.sync.get` returning `{}` is enough — `core/storage.ts`'s `getData()` fills in defaults
for anything not stored. This only covers UI logic; anything that runs exclusively in the
background service worker (navigation redirects, the Limiter alarm) needs a real loaded extension
to verify.

## Architecture

- **Preact + TypeScript** (strict mode), **Vite + @crxjs/vite-plugin** for the build.
- Three mechanisms, used per-feature — don't mix them up:
  - **Hard redirect** (Block Sites, Reel Blocks, Limiter): `background/index.ts` +
    `chrome.webNavigation` catch a matching navigation and redirect the tab. No content script.
  - **Content script, element-hiding** (Feed Blocks): `content-scripts/feed-blocks.ts` injects a
    `<style>` tag that hides matched DOM regions. Not a redirect.
  - **Content script, overlay gate** (Password Protection — not yet built): would show an overlay
    requiring a password, no timer, refresh re-prompts.
- All persisted state goes through `src/core/storage.ts` (`chrome.storage.sync`, one typed
  `FocusLockData` schema). Bug reports and feed requests are the one exception — they use
  `chrome.storage.local` under their own keys, since they're free text that could exceed
  `storage.sync`'s ~100KB quota and have no reason to sync across devices.
- Shared UI primitives live in `src/core/ui/` (`Toggle`, `Button`, `Modal`, `Icon`, `PlatformIcon`,
  design tokens in `tokens.css`).

## Status

| Page | Status |
|---|---|
| Block Sites | ✅ Built — categories (Social Media, Adult Sites, Shopping Sites, Gambling, News), custom site list (add/edit/delete/toggle), optional redirect URL |
| Reel Blocks | ✅ Built — 4 platforms (Facebook, Instagram, LinkedIn, YouTube), single toggle each |
| Feed Blocks | ✅ Built — 6 platforms (Facebook, Instagram, YouTube, Reddit, Twitter/X, LinkedIn), per-region hide toggles, "Request New Feed" form |
| Limiter | ✅ Built — per-site daily time budget, add/edit/delete, live progress bar |
| Popup | ✅ Built — 3 views depending on the active tab (default / blocked / platform quick-toggle) |
| Report Bug | ✅ Built — sidebar + popup, local storage + optional remote endpoint |
| Focus Mode | Coming Soon placeholder (matches design) |
| Insights | Coming Soon placeholder (matches design) |
| Password Protection | Not built |

## How each feature works

### Block Sites

`features/block-sites/logic.ts` is plain CRUD over `BlockSitesSettings` (categories +
`customSites`), all reads/writes going through `core/storage.ts`. `matchBlockSites()` (called from
`background/index.ts` on every navigation) checks categories first, then custom sites, via
`core/rule-engine.ts`'s pattern matcher. If `redirectUrl` is set, any match redirects there instead
of the internal blocked page — that's a single global redirect, not per-category; flag it if a
different scope is wanted.

### Reel Blocks

Same hard-redirect mechanism as Block Sites, scoped to one hardcoded path per platform:
`facebook.com/reel/*`, `instagram.com/reels/*`, `youtube.com/shorts/*`,
`linkedin.com/video/*`. The LinkedIn pattern is a best-effort guess, not live-verified against a
real LinkedIn session — worth checking before relying on it. `matchReelBlocks()` in
`core/rule-engine.ts` is a thin wrapper around the same `matchCustomSites()` Block Sites uses. No
redirect-URL option here (the design doesn't have one for this page) — a match always goes to the
internal blocked page.

### Feed Blocks

`content-scripts/feed-blocks.ts` runs on the 6 supported platforms and injects a `<style>` tag
that `display: none`s the selectors for whatever regions are toggled on. Selectors live in
`features/feed-blocks/selectors.ts` — one file, easy to patch, one entry per platform/region, each
optionally scoped to a URL path (`pathIncludes`/`pathExcludes`) for platforms that reuse the same
markup in more than one place. Live-updates via `chrome.storage.onChanged`, no reload needed. Since
these are all client-side-routed SPAs, the content script also polls `location.pathname` every
500ms and re-applies unconditionally (not just on path-change) so it self-heals if a platform's own
SPA wipes the injected `<style>` tag mid-session.

Selector source and verification status, per platform:
- **Facebook** — verified live against a real session. Main feed selector varies by
  account/locale (`role="article"` isn't always present), so it lists multiple candidates; a match
  on any one is enough.
- **YouTube** — verified live; 8 of 9 regions confirmed directly, the 9th (live chat) confirmed
  present in the DOM but untestable without an active livestream.
- **LinkedIn** — verified live, both selectors matched on the first try.
- **Twitter/X** — main feed verified live; three sidebar-widget selectors matched real DOM content
  but couldn't be visually confirmed (that account's session doesn't render those widgets).
- **Reddit** — confirmed working by direct testing.
- **Instagram** — not yet live-verified.

All 6 platforms' selectors are seeded from
[News Feed Eradicator's sitelist](https://github.com/jordwest/news-feed-eradicator/tree/master/src/sitelist)
(an actively-maintained open-source project targeting the same platforms), with the Facebook
entries above added as extra candidates on top. Every region across all 6 platforms has at least
one real selector.

Toggling a platform on calls `chrome.permissions.request()` for that platform's hosts — but since
`manifest.json` already grants `host_permissions: ["<all_urls>"]` (needed for Block Sites, which
has to match arbitrary user-added domains), that resolves instantly without showing Chrome's
native permission dialog. The code is written to request properly regardless, so it'll start
prompting correctly the moment `<all_urls>` is ever narrowed to something less broad.

Reddit and Twitter/X show a plain lettermark instead of a brand logo — the Figma file only
exported Facebook/Instagram/YouTube/LinkedIn logo assets.

### Limiter

The one feature that needed a genuinely new mechanism — actually measuring time spent, which
Chrome's extension platform has no direct API for.

- **`chrome.alarms` ticks once a minute.** Each tick (`tickActiveTab()` in
  `features/limiter/logic.ts`) checks whether the active tab in the *focused* window matches a
  Limiter site's pattern, and if so adds a minute to that site's `usedSeconds`. Switching apps or
  tabs stops the clock immediately (checked next tick).
- **Usage is tracked in whole-minute increments**, not to the second — `chrome.alarms`' minimum
  repeating period is 1 minute, a hard platform floor for MV3 service workers, not a simplicity
  choice. Worst case a site gets up to ~1 extra minute past budget before it's blocked.
- **Two enforcement paths**: the same `webNavigation` listener Block Sites/Reel Blocks use catches
  a *fresh* navigation to an already-over-budget site instantly; the alarm tick itself redirects a
  tab that's already open the moment its usage crosses the budget.
- **Daily reset is local-calendar-date based** (`core/local-date.ts`), not a rolling 24-hour
  window — resets the first time it's checked after local midnight.
- **No per-site enable/disable toggle** — the Figma design doesn't have one; a budget is always
  active once added, until edited or removed.
- `chrome.windows.getLastFocused()` throws "No last-focused window" whenever Chrome itself isn't
  the OS-frontmost app — a normal, frequent condition (the user is on another app), not a failure.
  `tickActiveTab()` catches this and just skips that tick.

### Popup

Three states, decided by `resolvePopupView()` in `popup/logic.ts` based on the *active tab* at the
moment the popup opens, not a setting:

- **Blocked** — the current site matches Block Sites (category or custom site) → brand icon (or
  lettermark) + domain + "This Site Is Currently Blocked" + "Edit Block List" (opens Settings on
  the Block Sites page via `src/options/index.html#block-sites`).
- **Feed platform** — the site is a known Feed Blocks platform, not currently blocked → a compact
  version of the Feed Blocks page for just that platform: its own master toggle plus its real
  region list, reusing `togglePlatform`/`toggleRegion` from `features/feed-blocks/logic.ts`
  directly.
- **Default** — anything else → site icon/lettermark + domain, "Block This Site" (adds it to Block
  Sites' custom list and immediately redirects the current tab) and "Edit Block List".

Block Sites is checked before Feed Blocks, so a domain that's both blocked and a known platform
shows "blocked", not the platform toggle. Reel Blocks/Limiter aren't part of this check — they
block specific paths, not a whole site, so they don't fit the "is this whole site blocked"
question the popup asks.

Once a page is actually blocked, the tab's real URL is the extension's own blocked-page URL, not
the original site — `resolvePopupView()` resolves against the *original* site (carried through as
the blocked page's own `?url=` query param) in that case, so the popup can still tell it's looking
at a blocked page.

### Blocked page

`src/blocked/` shows a white card: site icon, "Blocked site: {name}" title, the original URL, a
fixed message, and a "Go do something else" button. That button calls `history.back()` when
there's somewhere to go back to, falling back to closing the tab (`window.close()`) when there
isn't (e.g. a tab opened directly to a blocked URL).

Redirects into this page use one of two modes depending on when the triggering signal fires,
handled in `background/index.ts`:
- **`onBeforeNavigate`** fires *before* a navigation commits, so nothing bad is in history yet — a
  plain `chrome.tabs.update` pushes the blocked page as a new entry.
- **`onHistoryStateUpdated`** and **`tabs.onUpdated`** fire *after* an in-app (SPA) navigation
  already committed — e.g. clicking a Reel inside Facebook already pushed that URL to history
  before the listener sees it. Redirecting with a plain update would sandwich the bad URL in the
  middle of history, breaking Back. Instead these use `chrome.scripting.executeScript` running
  `location.replace()` in the tab, which replaces the already-committed bad entry instead of
  stacking on top of it.

`chrome.webNavigation.onHistoryStateUpdated` alone isn't fully reliable on every SPA router
(YouTube Shorts in particular sometimes doesn't fire it for an in-app route change) —
`chrome.tabs.onUpdated` runs as a second, independent signal for the same check.

### Report Bug & Request New Feed

Both are the same pattern (`core/ui/ReportBugModal.tsx` / `core/ui/RequestFeedModal.tsx`,
`core/bug-reports.ts` / `core/feed-requests.ts`), kept as separate data (not mixed into one form)
since they're conceptually different. Every submission is always saved locally first
(`chrome.storage.local`), with a CSV export available from the confirmation screen. Report Bug
also renders inline (no modal chrome) inside the popup — see the `compact` prop on
`ReportBugForm`.

There's no backend built into a Chrome extension by itself — every install only has its own local
storage. To actually collect submissions from real users, both features best-effort `fetch()`-POST
to whatever URL is set as `REPORT_ENDPOINT_URL` in `core/remote-submit.ts`, tagged with a `type`
field (`"bug-report"` or `"feed-request"`) so a shared backend can route them separately. The
request uses `mode: "no-cors"` since Apps Script Web Apps don't return CORS headers — the request
still executes server-side even though the response is unreadable from the extension.

Setting up the recommended endpoint (free, no server code, one Google account) — a Google Sheets
**Apps Script Web App** that appends each submission as a row and emails the developer:

1. Create a Google Sheet.
2. **Extensions → Apps Script**, add a `doPost(e)` function that parses `e.postData.contents` as
   JSON, branches on `data.type` to append to the right sheet tab, and calls `MailApp.sendEmail()`.
3. **Deploy → New deployment → Web app**, with **Execute as: Me** and **Who has access: Anyone**
   (must be "Anyone", not "Anyone with a Google account" — the extension calls it anonymously).
4. Authorize the script when prompted.
5. Copy the deployed Web app URL (`https://script.google.com/macros/s/.../exec`) into
   `REPORT_ENDPOINT_URL`.

Editing the script's code later requires **Deploy → Manage deployments → edit (pencil) icon →
Version: New version → Deploy** to push the change to the existing URL — saving in the editor
alone does not update the live deployment.

## Known gaps and decisions

- **Adult Sites ships with an empty domain list on purpose** — the toggle works, it just doesn't
  block anything yet. It needs a maintained, vetted domain list before it's useful. Gambling/
  Shopping/News have small starter lists, not exhaustive ones.
- **Fonts fall back to the system UI font.** The design uses Inter (body) and Hanken Grotesk
  (headings), not bundled yet — self-host the font files before shipping; don't load them from
  Google Fonts at runtime inside the extension.
- **Icons are simple placeholders**, not final assets.
- **No privacy policy exists yet.** Report Bug and Request New Feed collect Name + Email and send
  them to an external endpoint — Chrome Web Store requires a privacy policy URL for any listing
  that collects personal data. This blocks store approval until written.
- **`host_permissions: ["<all_urls>"]`** needs a written justification in the Web Store review
  form. It's necessary here — Block Sites/Limiter must be able to redirect on any arbitrary
  user-added domain, not a fixed list — but Chrome's review flags broad host permissions and asks
  for the reasoning explicitly.

## Publishing to the Chrome Web Store

1. `npm run build` — verify it completes cleanly (`typecheck` runs as part of `build`).
2. Zip the **contents** of `dist/` (not the `dist` folder itself) into a `.zip`.
3. Resolve the "Known gaps" above that block submission — at minimum, a privacy policy URL.
4. Upload the zip in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole),
   fill in the store listing (screenshots, description, category), and provide the
   `<all_urls>` justification when prompted.
