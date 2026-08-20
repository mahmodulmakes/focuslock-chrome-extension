import { useState } from "preact/hooks";
import "./sidebar.css";
import logoMark from "@core/ui/brand/logo-mark.svg";
import wordmark from "@core/ui/brand/wordmark.svg";
import { BugIcon } from "@core/ui/icons";
import { ReportBugModal } from "@core/ui/ReportBugModal";
import { NavIcon } from "./NavIcon";

export type PageId =
  | "block-sites"
  | "reel-blocks"
  | "feed-blocks"
  | "limiter"
  | "focus-mode"
  | "insights";

interface NavItem {
  id: PageId;
  label: string;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "block-sites", label: "Block Sites" },
  { id: "reel-blocks", label: "Reel Blocks" },
  { id: "feed-blocks", label: "Feed Blocks" },
  { id: "limiter", label: "Limiter" },
  { id: "focus-mode", label: "Focus Mode", comingSoon: true },
  { id: "insights", label: "Insights", comingSoon: true },
];

export function Sidebar({ active, onSelect }: { active: PageId; onSelect: (id: PageId) => void }) {
  const [showReportBug, setShowReportBug] = useState(false);

  return (
    <nav className="fl-sidebar">
      <div className="fl-sidebar__logo">
        <img src={logoMark} alt="" className="fl-sidebar__logo-mark" />
        <img src={wordmark} alt="FocusLock" className="fl-sidebar__wordmark" />
      </div>
      <div className="fl-sidebar__divider" />
      <div className="fl-sidebar__nav">
        <div className="fl-sidebar__nav-items">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`fl-nav-item ${active === item.id ? "fl-nav-item--active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="fl-nav-item__main">
                <NavIcon name={item.id} />
                <span>{item.label}</span>
              </span>
              {item.comingSoon && <span className="fl-soon-pill">Coming</span>}
            </button>
          ))}
        </div>
        <button type="button" className="fl-sidebar__report-bug" onClick={() => setShowReportBug(true)}>
          <BugIcon /> Report Bug
        </button>
      </div>
      {showReportBug && <ReportBugModal onClose={() => setShowReportBug(false)} />}
    </nav>
  );
}
