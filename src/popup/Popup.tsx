// Popup shell UI. Not a feature folder — reads Block Sites + Feed Blocks to decide which of
// three views to show for the tab the popup was opened on, and reuses each feature's own
// storage-backed logic (togglePlatform/toggleRegion, addCustomSite) rather than duplicating it.
import { useEffect, useState } from "preact/hooks";
import { Toggle } from "@core/ui/Toggle";
import { PlatformIcon, type BrandPlatformId } from "@core/ui/PlatformIcon";
import { BugIcon } from "@core/ui/icons";
import { ReportBugForm } from "@core/ui/ReportBugModal";
import { domainInitials } from "@core/domain";
import { togglePlatform, toggleRegion } from "@features/feed-blocks/logic";
import type { FeedPlatform } from "@features/feed-blocks/types";
import { resolvePopupView, blockCurrentSite, openOptionsPage, type PopupView } from "./logic";
import logoMark from "@core/ui/brand/logo-mark.svg";
import "./popup.css";

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function Header({ onReportBug }: { onReportBug: () => void }) {
  return (
    <div className="fl-popup-header">
      <div className="fl-popup-header__brand">
        <img src={logoMark} alt="FocusLock" className="fl-popup-header__logo" />
      </div>
      <div className="fl-popup-header__actions">
        <button type="button" className="fl-popup-report-bug" onClick={onReportBug}>
          <BugIcon /> Report Bug
        </button>
        <button
          type="button"
          className="fl-popup-icon-btn"
          aria-label="Open Settings"
          onClick={() => openOptionsPage()}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
}

function SiteIcon({ hostname, brandId }: { hostname: string; brandId: BrandPlatformId | null }) {
  if (brandId) return <PlatformIcon platformId={brandId} size={64} shape="circle" />;
  return (
    <div className="fl-popup-site-icon fl-popup-site-icon--letter">{domainInitials(hostname)}</div>
  );
}

export function Popup() {
  const [view, setView] = useState<PopupView>({ kind: "loading" });
  const [showReportBug, setShowReportBug] = useState(false);

  useEffect(() => {
    resolvePopupView().then(setView);
  }, []);

  return (
    <div className="fl-popup">
      <Header onReportBug={() => setShowReportBug(true)} />
      <div className="fl-popup-body">
        {showReportBug ? (
          <ReportBugForm onClose={() => setShowReportBug(false)} compact />
        ) : (
          <>
            {view.kind === "loading" && <p className="fl-popup-loading">Loading…</p>}

            {view.kind === "unsupported" && (
              <p className="fl-popup-loading">FocusLock doesn't do anything on this page.</p>
            )}

            {view.kind === "blocked" && (
              <div className="fl-popup-panel">
                <div className="fl-popup-panel__icon">
                  <SiteIcon hostname={view.hostname} brandId={view.brandId} />
                </div>
                <p className="fl-popup-panel__domain">{view.hostname}</p>
                <p className="fl-popup-panel__title">This Site Is Currently Blocked</p>
                <button type="button" className="fl-popup-btn fl-popup-btn--secondary" onClick={() => openOptionsPage("block-sites")}>
                  Edit Block List
                </button>
              </div>
            )}

            {view.kind === "default" && (
              <div className="fl-popup-panel">
                <div className="fl-popup-panel__icon">
                  <SiteIcon hostname={view.hostname} brandId={null} />
                </div>
                <p className="fl-popup-panel__domain">{view.hostname}</p>
                <button
                  type="button"
                  className="fl-popup-btn fl-popup-btn--primary"
                  onClick={async () => {
                    await blockCurrentSite(view.hostname);
                    window.close();
                  }}
                >
                  Block This Site
                </button>
                <button type="button" className="fl-popup-btn fl-popup-btn--secondary" onClick={() => openOptionsPage("block-sites")}>
                  Edit Block List
                </button>
              </div>
            )}

            {view.kind === "feed-platform" && (
              <FeedPlatformView platform={view.platform} onChange={(platform) => setView({ kind: "feed-platform", platform })} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeedPlatformView({
  platform,
  onChange,
}: {
  platform: FeedPlatform;
  onChange: (platform: FeedPlatform) => void;
}) {
  async function handleTogglePlatform(next: boolean) {
    if (next) {
      const origins = platform.hostnames.map((h) => `*://*.${h}/*`);
      const granted = await chrome.permissions.request({ origins });
      if (!granted) return;
    }
    const settings = await togglePlatform(platform.id, next);
    const updated = settings.platforms.find((p) => p.id === platform.id);
    if (updated) onChange(updated);
  }

  async function handleToggleRegion(regionId: string, next: boolean) {
    const settings = await toggleRegion(platform.id, regionId, next);
    const updated = settings.platforms.find((p) => p.id === platform.id);
    if (updated) onChange(updated);
  }

  return (
    <div className="fl-popup-feed">
      <div className="fl-popup-feed__platform">
        <Toggle checked={platform.enabled} onChange={handleTogglePlatform} label={`Toggle ${platform.label}`} />
        <PlatformIcon platformId={platform.id} size={42} />
        <div className="fl-popup-feed__platform-text">
          <p className="fl-popup-feed__platform-name">{platform.label}</p>
          {/* domainsLabel lists every matched host (e.g. "www.facebook.com, web.facebook.com") —
              the full list is right for the Feed Blocks page, but here there isn't room for more
              than the one main domain on a single line. */}
          <p className="fl-popup-feed__platform-domains">{platform.domainsLabel.split(",")[0].trim()}</p>
        </div>
      </div>
      <div className="fl-popup-feed__divider" />
      <p className="fl-popup-feed__regions-title">{platform.label} Hide regions:</p>
      <div className="fl-popup-feed__region-list">
        {platform.regions.map((region) => (
          <div key={region.id} className="fl-popup-feed__region-row">
            <p>{region.label}</p>
            <Toggle
              checked={platform.enabled && region.enabled}
              onChange={(next) => handleToggleRegion(region.id, next)}
              label={`Toggle ${region.label} on ${platform.label}`}
              disabled={!platform.enabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
