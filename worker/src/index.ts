// Public write-only endpoint for FocusLock's "Report Bug" and "Request New Feed" forms.
// Holds the Turso auth token server-side (as a Wrangler secret) so the extension itself never
// carries a credential — a Chrome extension can't hold a database credential of its own, since
// its code ships unobfuscated and anyone could extract it.
import { createClient } from "@libsql/client/web";

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 5000;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    const name = body.name;
    const email = body.email;
    if (!isNonEmptyString(name) || !isNonEmptyString(email)) {
      return json({ ok: false, error: "Missing name or email" }, 400);
    }

    const client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    const submittedAt = new Date().toISOString();

    try {
      if (body.type === "feed-request") {
        const platform = body.platform;
        if (!isNonEmptyString(platform)) {
          return json({ ok: false, error: "Missing platform" }, 400);
        }
        await client.execute({
          sql: "INSERT INTO feed_requests (name, email, platform, submitted_at) VALUES (?, ?, ?, ?)",
          args: [name.trim(), email.trim(), platform.trim(), submittedAt],
        });
      } else {
        const description = body.description;
        if (!isNonEmptyString(description)) {
          return json({ ok: false, error: "Missing description" }, 400);
        }
        await client.execute({
          sql: "INSERT INTO bug_reports (name, email, description, submitted_at) VALUES (?, ?, ?, ?)",
          args: [name.trim(), email.trim(), description.trim(), submittedAt],
        });
      }
    } catch (err) {
      console.error("FocusLock report API: insert failed", err);
      return json({ ok: false, error: "Database write failed" }, 500);
    }

    return json({ ok: true });
  },
};
