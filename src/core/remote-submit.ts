// Shared by bug-reports.ts and feed-requests.ts — both POST to the same Google Apps Script Web
// App, distinguished by a "type" field so the script can route each to its own sheet/email
// instead of mixing bug reports and feed requests together. See README's "Report Bug" section
// for what this endpoint is and how it was set up.

/** Deployed Google Apps Script Web App URL — set 2026-08-19. Left empty, submitToEndpoint() is a
 *  no-op and callers fall back to local-only storage. */
export const REPORT_ENDPOINT_URL =
  "https://script.google.com/macros/s/AKfycbxX6z--ak8xg61tkahKIpdcYzSn8LjOQ0uk6xlXr_LEBQ4_Zx0FYcXWOlV19-fZgQ2lhw/exec";

/** Best-effort — never throws, since a failed network request shouldn't stop the local save
 *  (already done by the caller) from counting as a successful submission. Uses "text/plain" so
 *  the request qualifies as a CORS "simple request" — Apps Script Web Apps don't send back
 *  Access-Control-Allow-Origin, so a normal "cors" fetch would have the browser reject the
 *  promise on the response even when the script ran successfully server-side (the row got added,
 *  the email got sent) — the request itself isn't blocked, only reading its response is. Fetching
 *  with mode: "no-cors" avoids that false failure: the request still goes out and the promise
 *  resolves once it's sent, at the cost of not being able to read anything back (the response
 *  comes back opaque) — meaning "sent" here really means "dispatched," not "confirmed received." */
export async function submitToEndpoint(type: string, payload: Record<string, string>): Promise<boolean> {
  if (!REPORT_ENDPOINT_URL) return false;
  try {
    await fetch(REPORT_ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ type, ...payload }),
    });
    return true;
  } catch {
    return false;
  }
}
