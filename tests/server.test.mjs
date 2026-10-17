import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

test("Node runtime serves the built page and assets without exposing server files", async (t) => {
  const child = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      PORT: "0",
      HOST: "127.0.0.1",
      RESEND_API_KEY: "",
      CONTACT_FROM_EMAIL: "",
      CONTACT_ORIGIN: "http://127.0.0.1:4173",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  const base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Server did not start")),
      5000,
    );
    child.once("error", reject);
    child.once("exit", () =>
      reject(new Error("Server exited before listening")),
    );
    child.stdout.on("data", (data) => {
      const match = data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    });
  });
  const page = await fetch(base);
  assert.equal(page.status, 200);
  const html = await page.text();
  const script = html.match(/src="([^"]+\.js)"/)[1];
  const asset = await fetch(base + script);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get("content-type"), /javascript/);
  for (const path of ["/.env", "/server/contact.ts", "/api/missing"]) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
  assert.equal((await fetch(base + "/api/contact")).status, 405);
  assert.equal(
    (
      await fetch(base + "/api/contact", {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:4173",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Runtime check",
          email: "test@example.com",
          topic: "Let's figure it out",
          message: "A runtime check without sending any mail.",
          website: "",
          requestId: "afde521c-7305-4b1c-85cc-254349650ab2",
        }),
      })
    ).status,
    503,
  );
});
