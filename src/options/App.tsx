import { useEffect, useState } from "preact/hooks";
import { Sidebar, type PageId } from "./Sidebar";
import { BlockSitesPage } from "@features/block-sites/index";
import { FeedBlocksPage } from "@features/feed-blocks/index";
import { ReelBlocksPage } from "@features/reel-blocks/index";
import { LimiterPage } from "@features/limiter/index";
import "./app.css";

const PAGE_LABELS: Record<PageId, string> = {
  "block-sites": "Block Sites",
  "reel-blocks": "Reel Blocks",
  "feed-blocks": "Feed Blocks",
  limiter: "Limiter",
  "focus-mode": "Focus Mode",
  insights: "Insights",
};

const PAGE_IDS = Object.keys(PAGE_LABELS) as PageId[];

/** The URL hash is the source of truth for which page is showing — so the address bar always
 *  tells you where you are, and reloading (or bookmarking) a page keeps you on it instead of
 *  bouncing back to Block Sites. */
function pageFromHash(): PageId {
  const hash = window.location.hash.slice(1);
  return (PAGE_IDS as string[]).includes(hash) ? (hash as PageId) : "block-sites";
}

export function App() {
  const [active, setActiveState] = useState<PageId>(pageFromHash);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = active;
    }
    const onHashChange = () => setActiveState(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function setActive(id: PageId) {
    window.location.hash = id;
    setActiveState(id);
  }

  return (
    <div className="fl-shell">
      <Sidebar active={active} onSelect={setActive} />
      <main className="fl-content">
        {active === "block-sites" ? (
          <BlockSitesPage />
        ) : active === "feed-blocks" ? (
          <FeedBlocksPage />
        ) : active === "reel-blocks" ? (
          <ReelBlocksPage />
        ) : active === "limiter" ? (
          <LimiterPage />
        ) : (
          <NotBuiltYet page={active} />
        )}
      </main>
    </div>
  );
}

function NotBuiltYet({ page }: { page: PageId }) {
  const isPlaceholder = page === "focus-mode" || page === "insights";
  return (
    <div className="fl-placeholder">
      <p className="fl-placeholder__title">{PAGE_LABELS[page]}</p>
      <p className="fl-placeholder__body">
        {isPlaceholder
          ? "Coming soon."
          : "Not built yet — this page is next up once Block Sites is confirmed working."}
      </p>
    </div>
  );
}
