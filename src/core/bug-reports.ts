// Bug reports live in chrome.storage.local, not the synced FocusLockData schema in storage.ts —
// chrome.storage.sync has a small quota (~100KB total across everything) and free-text
// descriptions could realistically blow past that over time; local storage has a much larger
// practical limit, and there's no reason for these to sync across the user's own devices anyway
// (they're meant to be reviewed/exported, not synced).
//
// Every report is always saved locally first (reliable regardless of network), and — once
// REPORT_ENDPOINT_URL in remote-submit.ts is set — also best-effort sent there, tagged
// type: "bug-report" so the Apps Script backend keeps these separate from feed-requests.ts'
// submissions. Left empty, the extension behaves exactly as before: local-only, exportable as
// CSV on request.
import { submitToEndpoint } from "./remote-submit";

export interface BugReport {
  id: string;
  name: string;
  email: string;
  description: string;
  /** ISO timestamp */
  submittedAt: string;
}

const STORAGE_KEY = "bugReports";

export async function getBugReports(): Promise<BugReport[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return (stored[STORAGE_KEY] as BugReport[] | undefined) ?? [];
}

export async function addBugReport(report: { name: string; email: string; description: string }): Promise<BugReport[]> {
  const reports = await getBugReports();
  const next: BugReport[] = [
    ...reports,
    {
      ...report,
      id: `bug-${Math.random().toString(36).slice(2, 9)}`,
      submittedAt: new Date().toISOString(),
    },
  ];
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

export async function submitBugReportRemote(report: { name: string; email: string; description: string }): Promise<boolean> {
  return submitToEndpoint("bug-report", report);
}

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function bugReportsToCsv(reports: BugReport[]): string {
  const header = ["Name", "Email", "Description", "Submitted At"].join(",");
  const rows = reports.map((r) => [csvField(r.name), csvField(r.email), csvField(r.description), csvField(r.submittedAt)].join(","));
  return [header, ...rows].join("\r\n");
}
