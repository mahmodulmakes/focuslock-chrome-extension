// FEATURE: Limiter — page UI. Owns its own state; talks to storage only through logic.ts.
import { useEffect, useState } from "preact/hooks";
import { Button } from "@core/ui/Button";
import { Icon } from "@core/ui/Icon";
import { EditIcon, DeleteIcon } from "@core/ui/icons";
import { domainInitials } from "@core/domain";
import { onLimiterChange } from "@core/storage";
import { loadLimiter, addSite, updateSite, removeSite } from "./logic";
import type { LimiterSettings, LimiterSite } from "./types";
import "./limiter.css";

export function LimiterPage() {
  const [settings, setSettings] = useState<LimiterSettings | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadLimiter().then(setSettings);
    return onLimiterChange(setSettings);
  }, []);

  if (!settings) {
    return <div className="fl-page-loading">Loading…</div>;
  }

  return (
    <div className="fl-page">
      <section className="fl-section">
        <div className="fl-section__header">
          <div className="fl-section__heading">
            <h1 className="fl-page-title">Limiter</h1>
            <p className="fl-section__subtitle">Set a daily time budget.</p>
          </div>
          <Button onClick={() => setShowAddForm((v) => !v)}>
            <Icon name="plus" size={16} /> Add Site
          </Button>
        </div>

        {showAddForm && (
          <SiteForm
            onSubmit={async (pattern, minutes) => {
              setSettings(await addSite(pattern, minutes));
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <div className="fl-site-list">
          {settings.sites.length === 0 && !showAddForm && (
            <p className="fl-empty-state">No time budgets set yet. Add your first one above.</p>
          )}
          {settings.sites.map((site) =>
            editingId === site.id ? (
              <SiteForm
                key={site.id}
                initialPattern={site.pattern}
                initialMinutes={site.dailyBudgetMinutes}
                onSubmit={async (pattern, minutes) => {
                  setSettings(await updateSite(site.id, { pattern, dailyBudgetMinutes: minutes }));
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <LimiterRow
                key={site.id}
                site={site}
                onEdit={() => setEditingId(site.id)}
                onDelete={async () => setSettings(await removeSite(site.id))}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function SiteForm({
  initialPattern = "",
  initialMinutes = 0,
  onSubmit,
  onCancel,
}: {
  initialPattern?: string;
  initialMinutes?: number;
  onSubmit: (pattern: string, minutes: number) => void;
  onCancel: () => void;
}) {
  const [pattern, setPattern] = useState(initialPattern);
  const [hours, setHours] = useState(initialMinutes ? String(Math.floor(initialMinutes / 60)) : "");
  const [minutes, setMinutes] = useState(initialMinutes ? String(initialMinutes % 60) : "");

  const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const canSubmit = pattern.trim() !== "" && totalMinutes > 0;

  return (
    <form
      className="fl-limiter-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit(pattern.trim(), totalMinutes);
      }}
    >
      <input
        className="fl-input fl-input--mono"
        placeholder="URL pattern, e.g. reddit.com/*"
        value={pattern}
        onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
      />
      <span className="fl-limiter-form__label">Daily Limit</span>
      <div className="fl-limiter-form__time-field">
        <input
          className="fl-limiter-form__time-input"
          type="number"
          min={0}
          placeholder="00"
          value={hours}
          onInput={(e) => setHours((e.target as HTMLInputElement).value)}
        />
        <span className="fl-limiter-form__time-label">Hour</span>
      </div>
      <div className="fl-limiter-form__time-field">
        <input
          className="fl-limiter-form__time-input"
          type="number"
          min={0}
          max={59}
          placeholder="00"
          value={minutes}
          onInput={(e) => setMinutes((e.target as HTMLInputElement).value)}
        />
        <span className="fl-limiter-form__time-label">Min</span>
      </div>
      <Button type="submit" disabled={!canSubmit}>
        {initialPattern ? "Save" : "Add"}
      </Button>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

function LimiterRow({
  site,
  onEdit,
  onDelete,
}: {
  site: LimiterSite;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const budgetSeconds = site.dailyBudgetMinutes * 60;
  const percent = budgetSeconds > 0 ? Math.min(100, (site.usedSeconds / budgetSeconds) * 100) : 0;
  const usedMinutes = Math.floor(site.usedSeconds / 60);

  return (
    <div className="fl-site-row">
      <div className="fl-site-row__badge">{domainInitials(site.pattern)}</div>
      <p className="fl-site-row__pattern">{site.pattern}</p>
      <div className="fl-limiter-progress">
        <div className="fl-limiter-progress__labels">
          <span>{formatMinutes(usedMinutes)} used</span>
          <span>{formatMinutes(site.dailyBudgetMinutes)}/day</span>
        </div>
        <div className="fl-limiter-progress__bar">
          <div
            className={`fl-limiter-progress__fill ${percent >= 100 ? "fl-limiter-progress__fill--full" : ""}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <button type="button" className="fl-icon-btn" onClick={onEdit} aria-label={`Edit ${site.pattern}`}>
        <EditIcon size={16} />
      </button>
      <button
        type="button"
        className="fl-icon-btn fl-icon-btn--danger"
        onClick={onDelete}
        aria-label={`Delete ${site.pattern}`}
      >
        <DeleteIcon size={16} />
      </button>
    </div>
  );
}
