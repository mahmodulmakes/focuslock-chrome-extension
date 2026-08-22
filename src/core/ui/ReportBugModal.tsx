// Shared "Report a Bug" form — used by both the sidebar (options page) and the popup, so it
// lives in core rather than either one. Every submission is always saved locally first (see
// core/bug-reports.ts); once REPORT_ENDPOINT_URL there is set, it's also best-effort sent to the
// Cloudflare Worker in worker/, which writes it into a Turso database.
//
// ReportBugForm is the content only, no modal chrome — the options page wraps it in the shared
// Modal (ReportBugModal, below); the popup embeds it directly in its own body instead, since a
// modal-over-a-modal (plus a floating close button) doesn't read well at the popup's 360px size.
import { useState } from "preact/hooks";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { addBugReport, getBugReports, bugReportsToCsv, submitBugReportRemote } from "../bug-reports";
import { REPORT_ENDPOINT_URL } from "../remote-submit";
import "./report-bug-modal.css";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function downloadCsv() {
  const reports = await getBugReports();
  const csv = bugReportsToCsv(reports);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "focuslock-bug-reports.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export interface ReportBugFormProps {
  onClose: () => void;
  /** Popup uses this: the confirmation screen offers just "Done", no CSV export — exporting a
   *  file from a 360px popup is awkward, and the options page already covers that case. */
  compact?: boolean;
}

export function ReportBugForm({ onClose, compact = false }: ReportBugFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [remoteSent, setRemoteSent] = useState(false);

  const nameError = touched && !name.trim() ? "Name is required" : null;
  const emailError = touched && !isValidEmail(email) ? "Enter a valid email" : null;
  const descriptionError = touched && !description.trim() ? "Description is required" : null;
  const isValid = Boolean(name.trim()) && isValidEmail(email) && Boolean(description.trim());

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    const trimmed = { name: name.trim(), email: email.trim(), description: description.trim() };
    const reports = await addBugReport(trimmed);
    setSavedCount(reports.length);
    setRemoteSent(await submitBugReportRemote(trimmed));
  }

  const cardClass = compact ? "fl-report-bug fl-report-bug--compact" : "fl-report-bug";

  if (savedCount !== null) {
    const shortHint = remoteSent
      ? "Sent automatically."
      : REPORT_ENDPOINT_URL
        ? "Saved — couldn't send just now."
        : "Saved on this device only.";
    return (
      <div className={cardClass}>
        <p className="fl-report-bug__title">Thanks — saved</p>
        <p className="fl-report-bug__hint">
          {compact ? (
            shortHint
          ) : remoteSent ? (
            "Sent — this should show up in the spreadsheet and inbox it's connected to shortly."
          ) : REPORT_ENDPOINT_URL ? (
            "Saved on this device — couldn't reach the server just now, so it hasn't gone out yet."
          ) : (
            `Saved on this device only (${savedCount} report${savedCount === 1 ? "" : "s"} collected so far) — no server is connected yet, so it doesn't reach anyone automatically. Export everything collected so far as a CSV to see or share it.`
          )}
        </p>
        <div className="fl-report-bug__actions">
          {!compact && (
            <Button variant="secondary" onClick={downloadCsv}>
              Export all as CSV
            </Button>
          )}
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <form className={cardClass} onSubmit={handleSubmit}>
      <p className="fl-report-bug__title">Report a Bug</p>
      <p className="fl-report-bug__hint">
        {compact
          ? REPORT_ENDPOINT_URL
            ? "Sent automatically."
            : "Saved on this device only."
          : REPORT_ENDPOINT_URL
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
        <label>Description</label>
        <textarea
          className="fl-report-bug__input fl-report-bug__textarea"
          rows={4}
          value={description}
          onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
        />
        {descriptionError && <p className="fl-report-bug__error">{descriptionError}</p>}
      </div>
      <div className="fl-report-bug__actions">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
}

export function ReportBugModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <ReportBugForm onClose={onClose} />
    </Modal>
  );
}
