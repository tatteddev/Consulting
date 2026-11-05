import { isRecord } from "../shared/json.ts";
import { createHash } from "node:crypto";

const RECIPIENT = "oleg.novoselskyy@gmail.com";
const TOPICS = new Set([
  "Let's figure it out",
  "Architecture & modernization",
  "Engineering leadership & delivery",
  "Practical AI workflows",
]);
const MAX_BODY_BYTES = 16_384;
const EMAIL = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;

export interface ContactEnv {
  CONTACT_ORIGIN?: string;
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
}
interface ContactOptions {
  env?: ContactEnv;
  fetchEmail?: typeof fetch;
  now?: () => number;
  checkAttempt?: (ip: string) => Promise<Response | null>;
  verifyVisitor?: (token: unknown, ip: string) => Promise<Response | null>;
  reserveSend?: () => Promise<Response | null>;
}
const fields = [
  "name",
  "email",
  "topic",
  "message",
  "website",
  "requestId",
] as const;
type ContactInput = Record<(typeof fields)[number], string> & {
  turnstileToken?: unknown;
};
function isContactInput(input: unknown): input is ContactInput {
  return (
    isRecord(input) && fields.every((field) => typeof input[field] === "string")
  );
}
function json(
  status: number,
  value: { error: string } | { ok: true },
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function createContactHandler({
  env = process.env,
  fetchEmail = fetch,
  now = Date.now,
  checkAttempt,
  verifyVisitor,
  reserveSend,
}: ContactOptions = {}) {
  // Process-local limits protect the single-server deployment. Hosting with replicas
  // must provide a shared gateway limit as documented in README.
  const attempts = new Map<string, { count: number; until: number }>();
  function limited(ip: string) {
    const time = now();
    for (const [key, bucket] of attempts)
      if (bucket.until <= time) attempts.delete(key);
    if (!attempts.has(ip) && attempts.size >= 5000) return true;
    const bucket = attempts.get(ip) ?? { count: 0, until: time + 3_600_000 };
    bucket.count++;
    attempts.set(ip, bucket);
    return bucket.count > 5;
  }
  return async function contact(
    request: Request,
    { ip = "unknown" }: { ip?: string } = {},
  ) {
    if (request.method !== "POST")
      return json(
        405,
        { error: "Use the contact form to send an inquiry." },
        { Allow: "POST" },
      );
    const expectedOrigin = env.CONTACT_ORIGIN || "http://127.0.0.1:4173";
    if (request.headers.get("origin") !== expectedOrigin)
      return json(403, { error: "Please submit this form from the website." });
    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json")
    )
      return json(415, { error: "Invalid request format." });
    if (checkAttempt) {
      const rejected = await checkAttempt(ip);
      if (rejected) return rejected;
    }
    const reader = request.body?.getReader();
    if (!reader)
      return json(400, { error: "Please complete the inquiry form." });
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY_BYTES) {
          await reader.cancel();
          return json(413, { error: "Please shorten your message." });
        }
        chunks.push(value);
      }
    } catch {
      return json(400, {
        error: "The request was interrupted. Please try again.",
      });
    }
    let input: unknown;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return json(400, { error: "Invalid request format." });
    }
    if (!isContactInput(input))
      return json(400, { error: "Please complete the inquiry form." });
    if (input.website)
      return json(400, { error: "We could not submit this inquiry." });
    const name = input.name.trim(),
      email = input.email.trim(),
      message = input.message.trim(),
      topic = input.topic;
    if (
      !name ||
      name.length > 100 ||
      /[\r\n\x00-\x1f]/.test(name) ||
      email.length > 254 ||
      !EMAIL.test(email) ||
      message.length < 20 ||
      message.length > 2500 ||
      !TOPICS.has(topic) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        input.requestId,
      )
    ) {
      return json(400, {
        error:
          "Please check your name, email address and message (20–2,500 characters).",
      });
    }
    if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL)
      return json(503, {
        error:
          "The contact form is temporarily unavailable. Please try again later.",
      });
    if (!checkAttempt && limited(ip))
      return json(
        429,
        { error: "Too many attempts. Please try again in an hour." },
        { "Retry-After": "3600" },
      );
    if (verifyVisitor) {
      const rejected = await verifyVisitor(input.turnstileToken, ip);
      if (rejected) return rejected;
    }
    if (reserveSend) {
      const rejected = await reserveSend();
      if (rejected) return rejected;
    }
    const text = `New consulting inquiry\n\nName: ${name}\nEmail: ${email}\nArea: ${topic}\n\n${message}`;
    // Stable across ambiguous retries; edited content gets a different key.
    const digest = createHash("sha256")
      .update(JSON.stringify({ name, email, topic, message }))
      .digest("hex");
    const payload = {
      from: env.CONTACT_FROM_EMAIL,
      to: [RECIPIENT],
      reply_to: email,
      subject: `Consulting inquiry: ${topic}`,
      text,
    };
    try {
      const response = await fetchEmail("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `consulting/${input.requestId}/${digest}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      const result: unknown = await response.json().catch(() => null);
      if (
        !response.ok ||
        !isRecord(result) ||
        typeof result.id !== "string" ||
        !result.id
      )
        return json(502, {
          error:
            "We couldn't send your inquiry. Your message is still here—please try again.",
        });
      return json(200, { ok: true });
    } catch {
      return json(502, {
        error:
          "We couldn't confirm submission. Your message is still here—please try again.",
      });
    }
  };
}
