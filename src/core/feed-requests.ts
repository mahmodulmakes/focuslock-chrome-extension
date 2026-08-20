// "Request New Feed" submissions — same storage/remote pattern as bug-reports.ts, kept as a
// separate module (not the synced FocusLockData schema, chrome.storage.local instead) so these
// stay a distinct data shape and a distinct sheet/email on the backend, tagged
// type: "feed-request" via submitToEndpoint().
import { submitToEndpoint } from "./remote-submit";

export interface FeedRequest {
  id: string;
  name: string;
  email: string;
  platform: string;
  /** ISO timestamp */
  submittedAt: string;
}

const STORAGE_KEY = "feedRequests";

export async function getFeedRequests(): Promise<FeedRequest[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return (stored[STORAGE_KEY] as FeedRequest[] | undefined) ?? [];
}

export async function addFeedRequest(request: { name: string; email: string; platform: string }): Promise<FeedRequest[]> {
  const requests = await getFeedRequests();
  const next: FeedRequest[] = [
    ...requests,
    {
      ...request,
      id: `feed-${Math.random().toString(36).slice(2, 9)}`,
      submittedAt: new Date().toISOString(),
    },
  ];
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

export async function submitFeedRequestRemote(request: { name: string; email: string; platform: string }): Promise<boolean> {
  return submitToEndpoint("feed-request", request);
}

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function feedRequestsToCsv(requests: FeedRequest[]): string {
  const header = ["Name", "Email", "Platform", "Submitted At"].join(",");
  const rows = requests.map((r) => [csvField(r.name), csvField(r.email), csvField(r.platform), csvField(r.submittedAt)].join(","));
  return [header, ...rows].join("\r\n");
}
