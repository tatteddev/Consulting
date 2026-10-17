import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import worker from "../cloudflare/worker.ts";
import { structuredDataJson } from "../shared/seo.ts";

const html = await readFile(
  new URL("../dist/client/index.html", import.meta.url),
  "utf8",
);
test("built HTML contains the actual identity, services and contact links before JavaScript", () => {
  assert.match(html, /<div id="root"><[^>]+/);
  for (const text of [
    "Oleg Novoselskyy",
    "Tatted Dev",
    "Architecture &amp; modernization",
    "Practical AI workflows",
    "THE PERSON BEHIND THE WORK",
  ])
    assert.ok(html.includes(text), text);
  assert.match(html, /href="https:\/\/github.com\/tatteddev"/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/olegnovoselskyy.com\/"/,
  );
  assert.match(
    html,
    /name="robots" content="index, follow, max-image-preview:large"/,
  );
  assert.match(html, /property="og:title"\s+content="Oleg Novoselskyy/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(
    !/\sstyle=|\sonclick=/.test(html),
    "No inline styles or handlers requiring a weaker CSP",
  );
});

test("structured data describes the visible person and its exact bytes are allowed by enforced CSP", async () => {
  const blocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0][1], structuredDataJson);
  const person = JSON.parse(blocks[0][1])["@graph"].find(
    (node) => node["@type"] === "Person",
  );
  assert.equal(person.name, "Oleg Novoselskyy");
  assert.equal(person.alternateName, "Tatted Dev");
  assert.ok(person.sameAs.includes("https://github.com/tatteddev"));
  const response = await worker.fetch(
    new Request("https://olegnovoselskyy.com/"),
    { ASSETS: { fetch: async () => new Response(html) } },
  );
  const policy = response.headers.get("Content-Security-Policy");
  const hash = createHash("sha256").update(blocks[0][1]).digest("base64");
  assert.ok(policy.includes(`'sha256-${hash}'`));
  assert.ok(policy.includes("frame-src https://challenges.cloudflare.com"));
  assert.ok(
    !policy.includes("unsafe-inline") && !policy.includes("unsafe-eval"),
  );
  assert.equal(
    response.headers.get("Content-Security-Policy-Report-Only"),
    null,
  );
});

test("discovery files expose the canonical homepage and missing-page content is noindex", async () => {
  const file = (name) =>
    readFile(new URL(`../dist/client/${name}`, import.meta.url), "utf8");
  assert.match(
    await file("robots.txt"),
    /Sitemap: https:\/\/olegnovoselskyy.com\/sitemap.xml/,
  );
  assert.match(await file("robots.txt"), /Allow: \/\s/);
  const sitemap = await file("sitemap.xml");
  assert.deepEqual(
    [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]),
    ["https://olegnovoselskyy.com/"],
  );
  assert.match(await file("404.html"), /name="robots" content="noindex"/);
});

