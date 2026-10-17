import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
if (
  tracked.some((p) =>
    /(^|\/)(\.env(?!\.example$)|\.dev\.vars|\.wrangler\/)/.test(p),
  )
)
  throw new Error("A private configuration file is tracked by Git.");
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const secrets = readdirSync(".")
  .filter((p) => /^(\.env|\.dev\.vars)/.test(p) && p !== ".env.example")
  .flatMap((p) => readFileSync(p, "utf8").split(/\r?\n/))
  .filter((line) =>
    /^(RESEND_API_KEY|TURNSTILE_SECRET_KEY|CLOUDFLARE_API_TOKEN)=/.test(line),
  )
  .map((line) => line.slice(line.indexOf("=") + 1).replace(/^["']|["']$/g, ""))
  .filter((s) => s.length > 8);
function walk(path) {
  return readdirSync(path).flatMap((n) => {
    const p = join(path, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
for (const path of new Set([...files, ...walk("dist/client")])) {
  const bytes = readFileSync(path);
  if (
    secrets.some((secret) => bytes.includes(Buffer.from(secret))) ||
    /\bre_[A-Za-z0-9_]{20,}\b/.test(bytes.toString())
  )
    throw new Error("Credential detected in distributable file: " + path);
}
console.log(
  "Secret check passed: private files excluded; no known credentials in source or browser assets.",
);
