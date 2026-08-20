// FEATURE: Block Sites — page UI. Owns its own state; talks to storage only through logic.ts.
import { useEffect, useState } from "preact/hooks";
import { Toggle } from "@core/ui/Toggle";
import { Button } from "@core/ui/Button";
import { Icon } from "@core/ui/Icon";
import { Modal } from "@core/ui/Modal";
import { CategoryIcon } from "./CategoryIcon";
import { RedirectIcon } from "./icons";
import { EditIcon, DeleteIcon } from "@core/ui/icons";
import { domainInitials } from "@core/domain";
import {
  loadBlockSites,
  toggleCategory,
  addCustomSite,
  updateCustomSite,
  toggleCustomSite,
  removeCustomSite,
  setRedirectUrl,
} from "./logic";
import type { BlockSitesSettings, CustomSiteRule } from "./types";
import "./block-sites.css";

export function BlockSitesPage() {
  const [settings, setSettings] = useState<BlockSitesSettings | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRedirectField, setShowRedirectField] = useState(false);

  useEffect(() => {
    loadBlockSites().then(setSettings);
  }, []);

  if (!settings) {
    return <div className="fl-page-loading">Loading…</div>;
  }

  return (
    <div className="fl-page">
      <section className="fl-section">
        <div className="fl-section__header">
          <div className="fl-section__heading">
            <h1 className="fl-page-title">Block by Category</h1>
            <p className="fl-section__subtitle">Choose categories to block across your feed.</p>
          </div>
          <Button variant="secondary" onClick={() => setShowRedirectField((v) => !v)}>
            <RedirectIcon size={18} /> Redirect
          </Button>
        </div>

        {showRedirectField && (
          <Modal onClose={() => setShowRedirectField(false)}>
            <RedirectCard
              value={settings.redirectUrl}
              onSave={async (url) => {
                setSettings(await setRedirectUrl(url));
                setShowRedirectField(false);
              }}
            />
          </Modal>
        )}

        <div className="fl-category-grid">
          {settings.categories.map((category) => (
            <div className="fl-card" key={category.id}>
              <div className="fl-card__top">
                <div className="fl-card__icon-wrap">
                  <CategoryIcon categoryId={category.id} />
                </div>
                <Toggle
                  checked={category.enabled}
                  onChange={async (enabled) => setSettings(await toggleCategory(category.id, enabled))}
                  label={`Toggle ${category.label}`}
                />
              </div>
              <p className="fl-card__title">{category.label}</p>
              <p className="fl-card__desc">{category.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fl-section">
        <div className="fl-section__header">
          <div className="fl-section__heading">
            <h1 className="fl-page-title">Custom Sites</h1>
            <p className="fl-section__subtitle">Add specific websites you want to block.</p>
          </div>
          <Button onClick={() => setShowAddForm((v) => !v)}>
            <Icon name="plus" size={16} /> Add Site
          </Button>
        </div>

        {showAddForm && (
          <AddSiteForm
            onSubmit={async (pattern) => {
              setSettings(await addCustomSite("", pattern));
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <div className="fl-site-list">
          {settings.customSites.length === 0 && !showAddForm && (
            <p className="fl-empty-state">No sites blocked yet. Add your first one above.</p>
          )}
          {settings.customSites.map((site) =>
            editingId === site.id ? (
              <EditSiteRow
                key={site.id}
                site={site}
                onSave={async (changes) => {
                  setSettings(await updateCustomSite(site.id, changes));
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <SiteRow
                key={site.id}
                site={site}
                onToggle={async (enabled) => setSettings(await toggleCustomSite(site.id, enabled))}
                onEdit={() => setEditingId(site.id)}
                onDelete={async () => setSettings(await removeCustomSite(site.id))}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}

/** Accepts "example.com", "www.example.com/path", "https://example.com" — rejects anything that isn't a domain-shaped string. */
function isValidWebsiteLink(value: string): boolean {
  const withoutProtocol = value.trim().replace(/^https?:\/\//i, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(withoutProtocol);
}

function RedirectCard({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (url: string | null) => void;
}) {
  const [url, setUrl] = useState(value ?? "");
  const invalid = url.trim() !== "" && !isValidWebsiteLink(url);
  return (
    <div className="fl-redirect-card">
      <p className="fl-redirect-card__title">Redirect Blocked Pages</p>
      <div className="fl-redirect-card__field">
        <div className="fl-redirect-card__row">
          <div
            className={`fl-redirect-card__input-wrap ${url ? "fl-redirect-card__input-wrap--filled" : ""} ${
              invalid ? "fl-redirect-card__input-wrap--invalid" : ""
            }`}
          >
            <input
              className="fl-redirect-card__input"
              placeholder="URL pattern, e.g. reddit.com/*"
              value={url}
              onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
            />
          </div>
          {url && (
            <button type="button" className="fl-redirect-card__delete" onClick={() => setUrl("")} aria-label="Clear redirect URL">
              <DeleteIcon size={16} />
            </button>
          )}
        </div>
        {invalid && <p className="fl-redirect-card__error">Enter a valid website link, e.g. example.com</p>}
      </div>
      <Button onClick={() => !invalid && onSave(url.trim() || null)}>Add</Button>
    </div>
  );
}

function AddSiteForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (pattern: string) => void;
  onCancel: () => void;
}) {
  const [pattern, setPattern] = useState("");
  return (
    <form
      className="fl-add-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!pattern.trim()) return;
        onSubmit(pattern);
      }}
    >
      <input
        className="fl-input fl-input--mono"
        placeholder="URL pattern, e.g. reddit.com/*"
        value={pattern}
        onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
      />
      <Button type="submit">Add</Button>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

function EditSiteRow({
  site,
  onSave,
  onCancel,
}: {
  site: CustomSiteRule;
  onSave: (changes: { label: string; pattern: string }) => void;
  onCancel: () => void;
}) {
  const [pattern, setPattern] = useState(site.pattern);
  return (
    <form
      className="fl-add-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ label: pattern.trim(), pattern: pattern.trim() });
      }}
    >
      <input
        className="fl-input fl-input--mono"
        value={pattern}
        onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
      />
      <Button type="submit">Save</Button>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

function SiteRow({
  site,
  onToggle,
  onEdit,
  onDelete,
}: {
  site: CustomSiteRule;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const badge = domainInitials(site.label);
  return (
    <div className={`fl-site-row ${!site.enabled ? "fl-site-row--disabled" : ""}`}>
      <div className="fl-site-row__badge">{badge}</div>
      <p className="fl-site-row__pattern">{site.pattern}</p>
      <Toggle checked={site.enabled} onChange={onToggle} label={`Toggle ${site.label}`} />
      <button type="button" className="fl-icon-btn" onClick={onEdit} aria-label={`Edit ${site.label}`}>
        <EditIcon size={18} />
      </button>
      <button
        type="button"
        className="fl-icon-btn fl-icon-btn--danger"
        onClick={onDelete}
        aria-label={`Delete ${site.label}`}
      >
        <DeleteIcon size={18} />
      </button>
    </div>
  );
}
