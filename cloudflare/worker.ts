import { isRecord } from "../shared/json.ts";
import type { ContactEnv } from "../server/contact.ts";
import { createHash } from "node:crypto";
import { createContactHandler } from "../server/contact.ts";
import { structuredDataJson } from "../shared/seo.ts";

interface Env extends ContactEnv {
  CONTACT_ORIGIN: string;
  CONTACT_DAILY_CAP: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  ASSETS: Fetcher;
  CONTACT_LIMITS: DurableObjectNamespace;
}
const json = (status: number, error: string, retry?: number) =>
  Response.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(retry ? { "Retry-After": String(retry) } : {}),
      },
    },
  );

export async function verifyTurnstile(
  token: unknown,
  ip: string,
  env: Env,
  fetchVerify: typeof fetch = fetch,
) {
  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY)
    return json(
      503,
      "The contact form is temporarily unavailable. Please try again later.",
    );
  if (typeof token !== "string" || !token || token.length > 2048)
    return json(400, "Please complete the security check and try again.");
  try {
    const response = await fetchVerify(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    const result: unknown = await response.json();
    if (
      !response.ok ||
      !isRecord(result) ||
      result.success !== true ||
      result.action !== "contact" ||
      result.hostname !== new URL(env.CONTACT_ORIGIN).hostname
    )
      return json(
        400,
        "The security check expired or failed. Please try again.",
      );
    return null;
  } catch {
    return json(
      503,
      "The security check is temporarily unavailable. Please try again.",
    );
  }
}

export class ContactLimits {
  private readonly storage: DurableObjectStorage;
  private readonly env: Env;
  constructor(ctx: DurableObjectState, env: Env) {
    this.storage = ctx.storage;
    this.env = env;
    this.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)",
    );
    this.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS counters_expiry ON counters(expires)",
    );
  }
  async fetch(request: Request) {
    const input: unknown = await request.json();
    if (!isRecord(input)) return new Response(null, { status: 400 });
    const { kind, key } = input;
    if (
      (kind !== "attempt" && kind !== "send") ||
      (kind === "attempt" &&
        (typeof key !== "string" || !/^[a-f0-9]{64}$/.test(key)))
    )
      return new Response(null, { status: 400 });
    const now = Date.now();
    const limit = kind === "attempt" ? 5 : Number(this.env.CONTACT_DAILY_CAP);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
      return new Response(null, { status: 503 });
    const counterKey = kind === "attempt" ? `ip:${key}` : "daily";
    const expires =
      kind === "attempt"
        ? now + 3600000
        : (Math.floor(now / 86400000) + 1) * 86400000;
    const result = this.storage.transactionSync(() => {
      const sql = this.storage.sql;
      sql.exec("DELETE FROM counters WHERE expires <= ?", now);
      const existing = sql
        .exec<{ count: number; expires: number }>(
          "SELECT count, expires FROM counters WHERE key = ?",
          counterKey,
        )
        .toArray()[0];
      if (existing && existing.count >= limit)
        return {
          allowed: false,
          retry: Math.ceil((existing.expires - now) / 1000),
        };
      if (
        !existing &&
        sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM counters").one().n >=
          5000
      )
        return { allowed: false, retry: 3600 };
      sql.exec(
        "INSERT INTO counters(key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1",
        counterKey,
        expires,
      );
      return { allowed: true };
    });
    // Remove hashes even if there is no subsequent traffic. No inquiry content is stored.
    if ((await this.storage.getAlarm()) === null)
      await this.storage.setAlarm(now + 3600000);
    return Response.json(result);
  }
  async alarm() {
    this.storage.sql.exec(
      "DELETE FROM counters WHERE expires <= ?",
      Date.now(),
    );
    const next = this.storage.sql
      .exec<{ expires: number | null }>(
        "SELECT MIN(expires) AS expires FROM counters",
      )
      .one().expires;
    if (next !== null)
      await this.storage.setAlarm(Math.max(Date.now() + 1000, next));
  }
}

const app = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.hostname === "www.olegnovoselskyy.com") {
      url.hostname = "olegnovoselskyy.com";
      return Response.redirect(url.toString(), 308);
    }
    try {
      if (url.pathname === "/api/contact-config" && request.method === "GET")
        return Response.json(
          { required: true, siteKey: env.TURNSTILE_SITE_KEY || null },
          { headers: { "Cache-Control": "no-store" } },
        );
      if (url.pathname === "/api/contact") {
        const ip = request.headers.get("CF-Connecting-IP");
        if (!ip || !env.CONTACT_LIMITS || !env.TURNSTILE_SECRET_KEY)
          return json(
            503,
            "The contact form is temporarily unavailable. Please try again later.",
          );
        const limits = env.CONTACT_LIMITS.get(
          env.CONTACT_LIMITS.idFromName("consulting-contact-v1"),
        );
        async function check(kind: "attempt" | "send", key?: string) {
          const response = await limits.fetch("https://limits.internal/", {
            method: "POST",
            body: JSON.stringify({ kind, key }),
          });
          if (!response.ok) throw new Error("limits unavailable");
          const result: unknown = await response.json();
          if (!isRecord(result)) throw new Error("limits unavailable");
          return result.allowed === true
            ? null
            : json(
                429,
                kind === "send"
                  ? "The contact form has reached its daily limit. Please try again tomorrow or use the email link."
                  : "Too many attempts. Please try again later.",
                typeof result.retry === "number" && result.retry
                  ? result.retry
                  : 3600,
              );
        }
        // Salt the stored IP hash; raw visitor IPs never enter durable storage.
        const key = createHash("sha256")
          .update(env.TURNSTILE_SECRET_KEY + ":" + ip)
          .digest("hex");
        const handler = createContactHandler({
          env,
          checkAttempt: () => check("attempt", key),
          verifyVisitor: (token, address) =>
            verifyTurnstile(token, address, env),
          reserveSend: () => check("send"),
        });
        return await handler(request, { ip });
      }
      if (url.pathname.startsWith("/api/"))
        return new Response(null, { status: 404 });
      return await env.ASSETS.fetch(request);
    } catch {
      return json(
        503,
        "The contact form is temporarily unavailable. Please try again later.",
      );
    }
  },
};

const structuredDataHash = createHash("sha256")
  .update(structuredDataJson)
  .digest("base64");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' https://challenges.cloudflare.com 'sha256-${structuredDataHash}'`,
  "frame-src https://challenges.cloudflare.com",
  "connect-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export default {
  async fetch(request: Request, env: Env) {
    const response = await app.fetch(request, env);
    // Clone immutable asset/redirect headers and protect API/error responses too.
    const secured = new Response(response.body, response);
    secured.headers.set("X-Content-Type-Options", "nosniff");
    secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    secured.headers.set("X-Frame-Options", "DENY");
    secured.headers.set("Content-Security-Policy", contentSecurityPolicy);
    secured.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    secured.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    return secured;
  },
};
