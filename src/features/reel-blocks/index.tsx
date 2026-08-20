// FEATURE: Reel Blocks — page UI. Owns its own state; talks to storage only through logic.ts.
import { useEffect, useState } from "preact/hooks";
import { Toggle } from "@core/ui/Toggle";
import { PlatformIcon } from "@core/ui/PlatformIcon";
import { loadReelBlocks, togglePlatform } from "./logic";
import type { ReelBlocksSettings } from "./types";
import "./reel-blocks.css";

export function ReelBlocksPage() {
  const [settings, setSettings] = useState<ReelBlocksSettings | null>(null);

  useEffect(() => {
    loadReelBlocks().then(setSettings);
  }, []);

  if (!settings) {
    return <div className="fl-page-loading">Loading…</div>;
  }

  return (
    <div className="fl-page">
      <div className="fl-reel-header">
        <h1 className="fl-page-title">Reel Blocks</h1>
        <p className="fl-reel-header__desc">
          Hard block. Targets short-form video specifically — search and regular content keep working.
        </p>
      </div>

      <div className="fl-reel-panel">
        {settings.platforms.map((platform) => (
          <div className="fl-reel-row" key={platform.id}>
            <Toggle
              checked={platform.enabled}
              onChange={async (enabled) => setSettings(await togglePlatform(platform.id, enabled))}
              label={`Toggle ${platform.label}`}
            />
            <PlatformIcon platformId={platform.id} />
            <div className="fl-reel-row__text">
              <p className="fl-reel-row__name">{platform.label}</p>
              <p className="fl-reel-row__domains">{platform.domainsLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
