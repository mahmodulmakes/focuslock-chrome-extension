// Shared by bug-reports.ts and feed-requests.ts — both POST to the same Cloudflare Worker
// (worker/), distinguished by a "type" field so it can insert each into its own Turso table
// instead of mixing bug reports and feed requests together. See README's "Report Bug & Request
// New Feed" section for how the Worker/Turso backend is set up.

/** Deployed Cloudflare Worker URL — set 2026-08-22. Left empty, submitToEndpoint() is a no-op
 *  and callers fall back to local-only storage. */
export const REPORT_ENDPOINT_URL = "https://focuslock-report-api.mahmodulmakes.workers.dev";

/** Best-effort — never throws, since a failed network request shouldn't stop the local save
 *  (already done by the caller) from counting as a successful submission. Unlike the old Apps
 *  Script endpoint, this Worker sends back real CORS headers, so a normal "cors" fetch can read
 *  the actual response instead of firing blind with mode: "no-cors" — "sent" here means
 *  "confirmed written," not just "dispatched." */
export async function submitToEndpoint(type: string, payload: Record<string, string>): Promise<boolean> {
  if (!REPORT_ENDPOINT_URL) return false;
  try {
    const res = await fetch(REPORT_ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}
