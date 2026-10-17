import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { createContactHandler } from "./contact.mjs";

const root = resolve(
  fileURLToPath(new URL("../dist/client/", import.meta.url)),
);
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const contact = createContactHandler();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};
const server = createServer(async (req, res) => {
  const base = process.env.CONTACT_ORIGIN || `http://127.0.0.1:${port}`;
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  try {
    const url = new URL(req.url, base);
    if (url.pathname === "/api/contact-config" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ required: false }));
      return;
    }
    if (url.pathname === "/api/contact") {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers))
        if (value !== undefined)
          headers.set(key, Array.isArray(value) ? value.join(",") : value);
      const request = new Request(url, {
        method: req.method,
        headers,
        ...(!["GET", "HEAD"].includes(req.method)
          ? { body: Readable.toWeb(req), duplex: "half" }
          : {}),
      });
      const response = await contact(request, {
        ip: req.socket.remoteAddress || "unknown",
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
      return;
    }
    if (
      !["GET", "HEAD"].includes(req.method) ||
      url.pathname.startsWith("/api/")
    ) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    let file = resolve(root, "." + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if (url.pathname === "/") file = resolve(root, "index.html");
    let exists = await stat(file).catch(() => null);
    if (!exists?.isFile()) {
      if (extname(url.pathname) || !req.headers.accept?.includes("text/html")) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      file = resolve(root, "index.html");
    }
    const body = await readFile(file);
    res.setHeader(
      "Content-Type",
      types[extname(file)] || "application/octet-stream",
    );
    res.setHeader(
      "Cache-Control",
      file.endsWith("index.html") ? "no-cache" : "public, max-age=3600",
    );
    res.writeHead(200);
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end("Request failed");
  }
});
server.requestTimeout = 20_000;
server.headersTimeout = 10_000;
server.listen(port, host, () =>
  console.log(`Consulting preview: http://${host}:${server.address().port}/`),
);
