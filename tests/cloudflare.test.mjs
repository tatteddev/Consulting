import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import worker, { verifyTurnstile } from "../cloudflare/worker.ts";
import { createContactHandler } from "../server/contact.ts";

const env = {
  CONTACT_ORIGIN: "https://example.test",
  TURNSTILE_SECRET_KEY: "test-secret",
  TURNSTILE_SITE_KEY: "test-site",
  CONTACT_DAILY_CAP: "25",
};
test("Turnstile requires a token, success, correct action and exact hostname; failures close", async () => {
  const good = { success: true, action: "contact", hostname: "example.test" };
  assert.equal(
    await verifyTurnstile("token", "192.0.2.1", env, async () =>
      Response.json(good),
    ),
    null,
  );
  for (const result of [
    { ...good, success: false },
    { ...good, hostname: "evil.test" },
    { ...good, action: "login" },
  ])
    assert.equal(
      (
        await verifyTurnstile("token", "192.0.2.1", env, async () =>
          Response.json(result),
        )
      ).status,
      400,
    );
  for (const token of [null, "", "x".repeat(2049)])
    assert.equal(
      (await verifyTurnstile(token, "192.0.2.1", env, () => assert.fail()))
        .status,
      400,
    );
  assert.equal(
    (await verifyTurnstile("token", "192.0.2.1", {}, () => assert.fail()))
      .status,
    503,
  );
  assert.equal(
    (
      await verifyTurnstile("token", "192.0.2.1", env, () => {
        throw new Error("offline");
      })
    ).status,
    503,
  );
});

test("security guards run before email; failed verification never consumes daily capacity", async () => {
  const input = {
    name: "Test",
    email: "test@example.test",
    topic: "Practical AI workflows",
    message: "This is an integration test inquiry.",
    website: "",
    requestId: "2c6700b6-77ae-4cb2-9ac3-329d7afbfba5",
    turnstileToken: "token",
  };
  const request = () =>
    new Request(env.CONTACT_ORIGIN + "/api/contact", {
      method: "POST",
      headers: {
        Origin: env.CONTACT_ORIGIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  for (const stop of ["attempt", "verify", "reserve"]) {
    const calls = [];
    const gate = (name) => async () => {
      calls.push(name);
      return name === stop
        ? Response.json({ error: "blocked" }, { status: 429 })
        : null;
    };
    const handler = createContactHandler({
      env: {
        ...env,
        RESEND_API_KEY: "test",
        CONTACT_FROM_EMAIL: "test@example.test",
      },
      checkAttempt: gate("attempt"),
      verifyVisitor: gate("verify"),
      reserveSend: gate("reserve"),
      fetchEmail: () => assert.fail("blocked request sent email"),
    });
    assert.equal((await handler(request())).status, 429);
    assert.deepEqual(
      calls,
      ["attempt", "verify", "reserve"].slice(
        0,
        ["attempt", "verify", "reserve"].indexOf(stop) + 1,
      ),
    );
  }
});

test("production config exposes only public site key and missing limits fail closed", async () => {
  const config = await worker.fetch(
    new Request("https://example.test/api/contact-config"),
    env,
  );
  assert.deepEqual(await config.json(), {
    required: true,
    siteKey: "test-site",
  });
  const missing = await worker.fetch(
    new Request("https://example.test/api/contact", { method: "POST" }),
    env,
  );
  assert.equal(missing.status, 503);
});

test("security headers cover assets, redirects, API responses and failures with enforced CSP", async () => {
  const assetEnv = {
    ...env,
    ASSETS: {
      fetch: () =>
        new Response("page", {
          headers: { "Content-Type": "text/html", ETag: '"asset-v1"' },
        }),
    },
  };
  const cases = [
    ["https://example.test/", assetEnv, 200],
    ["https://www.olegnovoselskyy.com/?ref=test", assetEnv, 308],
    ["https://example.test/api/contact-config", assetEnv, 200],
    ["https://example.test/api/unknown", assetEnv, 404],
    ["https://example.test/api/contact", env, 503],
    [
      "https://example.test/",
      {
        ...env,
        ASSETS: {
          fetch: () => {
            throw new Error("offline");
          },
        },
      },
      503,
    ],
  ];
  for (const [url, bindings, status] of cases) {
    const response = await worker.fetch(new Request(url), bindings);
    assert.equal(response.status, status);
    assert.equal(
      response.headers.get("Strict-Transport-Security"),
      "max-age=31536000; includeSubDomains",
    );
    assert.equal(
      response.headers.get("Permissions-Policy"),
      "camera=(), microphone=(), geolocation=()",
    );
    assert.equal(response.headers.get("X-Frame-Options"), "DENY");
    assert.equal(response.headers.get("Content-Security-Policy-Report-Only"), null);
    const csp = response.headers.get("Content-Security-Policy");
    assert.ok(
      csp.includes("script-src 'self' https://challenges.cloudflare.com"),
    );
    assert.ok(csp.includes("frame-src https://challenges.cloudflare.com"));
    assert.ok(csp.includes("object-src 'none'"));
    assert.ok(!csp.includes("unsafe-inline") && !csp.includes("unsafe-eval"));
    if (status === 308)
      assert.equal(
        response.headers.get("Location"),
        "https://olegnovoselskyy.com/?ref=test",
      );
    if (url.endsWith("/api/contact-config"))
      assert.equal(response.headers.get("Cache-Control"), "no-store");
    if (url === "https://example.test/" && status === 200) {
      assert.equal(response.headers.get("ETag"), '"asset-v1"');
      assert.equal(await response.text(), "page");
    }
  }
});

test("real SQLite Durable Object enforces concurrent limits and persists across restarts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "consulting-limits-"));
  let mf;
  try {
    const scriptPath = join(dir, "worker.mjs");
    await build({
      entryPoints: ["cloudflare/worker.ts"],
      outfile: scriptPath,
      bundle: true,
      format: "esm",
      platform: "neutral",
      external: ["node:crypto"],
    });
    const options = convertV4MiniflareOptions({
      name: "consulting-limits-test",
      modules: true,
      modulesRoot: dir,
      scriptPath,
      compatibilityDate: "2026-08-01",
      compatibilityFlags: ["nodejs_compat"],
      bindings: env,
      durableObjects: {
        CONTACT_LIMITS: { className: "ContactLimits", useSQLite: true },
      },
    });
    // V5 replaced per-resource persistence options with a shared root.
    options.resourcePersistencePath = join(dir, "state");
    mf = new Miniflare(options);
    const ns = await mf.getDurableObjectNamespace("CONTACT_LIMITS");
    const stub = ns.get(ns.idFromName("test"));
    const hit = async (kind, key = "a".repeat(64)) =>
      (
        await stub.fetch("http://limits/", {
          method: "POST",
          body: JSON.stringify({ kind, key }),
        })
      ).json();
    const attempts = await Promise.all(
      Array.from({ length: 15 }, () => hit("attempt")),
    );
    assert.equal(attempts.filter((x) => x.allowed).length, 5);
    assert.equal((await hit("attempt", "b".repeat(64))).allowed, true);
    const sends = await Promise.all(
      Array.from({ length: 60 }, () => hit("send")),
    );
    assert.equal(sends.filter((x) => x.allowed).length, 25);
    assert.ok(
      sends
        .filter((x) => !x.allowed)
        .every((x) => x.retry > 0 && x.retry <= 86400),
    );
    await mf.dispose();
    mf = new Miniflare(options);
    const ns2 = await mf.getDurableObjectNamespace("CONTACT_LIMITS");
    const persisted = await ns2
      .get(ns2.idFromName("test"))
      .fetch("http://limits/", {
        method: "POST",
        body: JSON.stringify({ kind: "send" }),
      });
    assert.equal((await persisted.json()).allowed, false);
  } finally {
    await mf?.dispose();
    await rm(dir, { recursive: true, force: true });
  }
});
