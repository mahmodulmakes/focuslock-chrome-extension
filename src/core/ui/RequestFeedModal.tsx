// "Request New Feed" form — Feed Blocks' own request-a-platform button. Same shape as
// ReportBugModal (local storage first, best-effort remote send, CSV export), kept as its own
// component rather than a generalized one: the two forms' fields genuinely differ (Description
// vs. Platform) and only the options page uses this one — no popup/compact variant needed.
import { useState } from "preact/hooks";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { addFeedRequest, getFeedRequests, feedRequestsToCsv, submitFeedRequestRemote } from "../feed-requests";
import { REPORT_ENDPOINT_URL } from "../remote-submit";
import "./report-bug-modal.css";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function downloadCsv() {
  const requests = await getFeedRequests();
  const csv = feedRequestsToCsv(requests);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "focuslock-feed-requests.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function RequestFeedModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState("");
  const [touched, setTouched] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [remoteSent, setRemoteSent] = useState(false);

  const nameError = touched && !name.trim() ? "Name is required" : null;
  const emailError = touched && !isValidEmail(email) ? "Enter a valid email" : null;
  const platformError = touched && !platform.trim() ? "Platform is required" : null;
  const isValid = Boolean(name.trim()) && isValidEmail(email) && Boolean(platform.trim());

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    const trimmed = { name: name.trim(), email: email.trim(), platform: platform.trim() };
    const requests = await addFeedRequest(trimmed);
    setSavedCount(requests.length);
    setRemoteSent(await submitFeedRequestRemote(trimmed));
  }

  if (savedCount !== null) {
    return (
      <Modal onClose={onClose}>
        <div className="fl-report-bug">
          <p className="fl-report-bug__title">Thanks — saved</p>
          <p className="fl-report-bug__hint">
            {remoteSent
              ? "Sent — this should show up in the spreadsheet and inbox it's connected to shortly."
              : REPORT_ENDPOINT_URL
                ? "Saved on this device — couldn't reach the server just now, so it hasn't gone out yet."
                : `Saved on this device only (${savedCount} request${savedCount === 1 ? "" : "s"} collected so far) — no server is connected yet, so it doesn't reach anyone automatically. Export everything collected so far as a CSV to see or share it.`}
          </p>
          <div className="fl-report-bug__actions">
            <Button variant="secondary" onClick={downloadCsv}>
              Export all as CSV
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <form className="fl-report-bug" onSubmit={handleSubmit}>
        <p className="fl-report-bug__title">Request New Feed</p>
        <p className="fl-report-bug__hint">
          {REPORT_ENDPOINT_URL
            ? "Saved on this device, and sent along automatically."
            : "Saved on this device only — no server connected yet. Export as CSV any time to see everything collected."}
        </p>
        <div className="fl-report-bug__field">
          <label>Name</label>
          <input
            className="fl-report-bug__input"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
          />
          {nameError && <p className="fl-report-bug__error">{nameError}</p>}
        </div>
        <div className="fl-report-bug__field">
          <label>Email</label>
          <input
            className="fl-report-bug__input"
            type="email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          />
          {emailError && <p className="fl-report-bug__error">{emailError}</p>}
        </div>
        <div className="fl-report-bug__field">
          <label>Platform</label>
          <input
            className="fl-report-bug__input"
            placeholder="e.g. Pinterest, Threads, TikTok"
            value={platform}
            onInput={(e) => setPlatform((e.target as HTMLInputElement).value)}
          />
          {platformError && <p className="fl-report-bug__error">{platformError}</p>}
        </div>
        <div className="fl-report-bug__actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Modal>
  );
}
