// Hard-block landing page for Block Sites / Reel Blocks / Limiter-after-budget.
// No password field here on purpose — these lists have no unlock (see CLAUDE.md).
import { render } from "preact";
import "@core/ui/tokens.css";
import "./blocked.css";

function BlockedPage() {
  const params = new URLSearchParams(location.search);
  const reason = params.get("reason") ?? "This site is blocked.";
  const url = params.get("url");

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  }

  return (
    <div className="fl-blocked">
      <div className="fl-blocked-card">
        <div className="fl-blocked-icon">✕</div>
        <p className="fl-blocked-title">{reason}</p>
        {url && <p className="fl-blocked-url">{url}</p>}
        <p className="fl-blocked-message">This is blocked by FocusLock — go do something else.</p>
        <button type="button" className="fl-blocked-button" onClick={goBack}>
          Go do something else
        </button>
      </div>
    </div>
  );
}

render(<BlockedPage />, document.getElementById("root")!);
