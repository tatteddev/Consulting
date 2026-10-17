import { build } from "vite";
import { readFile, writeFile } from "node:fs/promises";

// Render the same React tree as the browser, avoiding a second copy of the copy/layout.
await build({
  build: {
    ssr: "src/entry-server.tsx",
    outDir: "dist/prerender",
    rollupOptions: { output: { entryFileNames: "entry-server.js" } },
  },
});
const { render } = await import("../dist/prerender/entry-server.js");
const { markup, structuredDataJson } = render();
const path = new URL("../dist/client/index.html", import.meta.url);
let html = await readFile(path, "utf8");
if (!html.includes('<div id="root"></div>'))
  throw new Error("Missing prerender root");
html = html.replace(
  '<div id="root"></div>',
  () => `<div id="root">${markup}</div>`,
);
html = html.replace(
  "</head>",
  () =>
    `<script type="application/ld+json">${structuredDataJson}</script></head>`,
);
await writeFile(path, html);
console.log(
  "Prerendered homepage content and structured data into crawlable HTML.",
);
