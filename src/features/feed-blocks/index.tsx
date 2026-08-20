// FEATURE: Feed Blocks — page UI. Owns its own state; talks to storage only through logic.ts.
// Turning a platform on requests that site's host permission live (chrome.permissions.request) —
// that's what triggers Chrome's native "wants to read/change your data on X" prompt.
import { useEffect, useState } from "preact/hooks";
import { Toggle } from "@core/ui/Toggle";
import { Button } from "@core/ui/Button";
import { Icon } from "@core/ui/Icon";
import { PlatformIcon } from "@core/ui/PlatformIcon";
import { RequestFeedModal } from "@core/ui/RequestFeedModal";
import { loadFeedBlocks, togglePlatform, toggleRegion } from "./logic";
import type { FeedBlocksSettings, FeedPlatform, PlatformId } from "./types";
import "./feed-blocks.css";

function originsFor(platform: FeedPlatform): string[] {
  return platform.hostnames.map((h) => `*://*.${h}/*`);
}

export function FeedBlocksPage() {
  const [settings, setSettings] = useState<FeedBlocksSettings | null>(null);
  const [selectedId, setSelectedId] = useState<PlatformId | null>(null);
  const [showRequestFeed, setShowRequestFeed] = useState(false);

  useEffect(() => {
    loadFeedBlocks().then(setSettings);
  }, []);

  if (!settings) {
    return <div className="fl-page-loading">Loading…</div>;
  }

  const selected = settings.platforms.find((p) => p.id === selectedId) ?? null;

  async function handleTogglePlatform(platform: FeedPlatform, next: boolean) {
    if (next) {
      const granted = await chrome.permissions.request({ origins: originsFor(platform) });
      if (!granted) return;
      // Turning a platform on jumps straight to its region controls. Turning one off leaves
      // whatever's currently selected alone.
      setSelectedId(platform.id);
    }
    setSettings(await togglePlatform(platform.id, next));
  }

  async function handleToggleRegion(platformId: PlatformId, regionId: string, next: boolean) {
    setSettings(await toggleRegion(platformId, regionId, next));
  }

  return (
    <div className="fl-page">
      <div className="fl-feed-header">
        <div>
          <h1 className="fl-page-title">Feed Blocks</h1>
          <p className="fl-feed-header__desc">
            Completely hides the infinite scroll feed without affecting the rest of the site.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowRequestFeed(true)}>
          <Icon name="plus" size={16} /> Request New Feed
        </Button>
      </div>

      {showRequestFeed && <RequestFeedModal onClose={() => setShowRequestFeed(false)} />}

      <div className="fl-feed-panel">
        <div className={`fl-feed-list ${selected ? "" : "fl-feed-list--full"}`}>
          {settings.platforms.map((platform) => (
            <div
              key={platform.id}
              className={`fl-feed-row ${platform.id === selectedId ? "fl-feed-row--selected" : ""}`}
              onClick={() => setSelectedId(platform.id)}
            >
              <span onClick={(e) => e.stopPropagation()}>
                <Toggle
                  checked={platform.enabled}
                  onChange={(next) => handleTogglePlatform(platform, next)}
                  label={`Toggle ${platform.label}`}
                />
              </span>
              <PlatformIcon platformId={platform.id} />
              <div className="fl-feed-row__text">
                <p className={`fl-feed-row__name ${platform.id === selectedId ? "fl-feed-row__name--selected" : ""}`}>
                  {platform.label}
                </p>
                <p className="fl-feed-row__domains">{platform.domainsLabel}</p>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <>
            <div className="fl-feed-divider" />
            <div className="fl-feed-detail">
              <p className="fl-feed-detail__title">{selected.label} Hide regions:</p>
              {!selected.enabled && (
                <p className="fl-feed-detail__hint">Turn on {selected.label} above to use these.</p>
              )}
              <div className="fl-feed-region-list">
                {selected.regions.map((region) => (
                  <div key={region.id} className="fl-feed-region-row">
                    <p className="fl-feed-region-row__label">{region.label}</p>
                    <Toggle
                      checked={selected.enabled && region.enabled}
                      onChange={(next) => handleToggleRegion(selected.id, region.id, next)}
                      label={`Toggle ${region.label} on ${selected.label}`}
                      disabled={!selected.enabled}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
