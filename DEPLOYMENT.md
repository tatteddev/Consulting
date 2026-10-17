# Cloudflare deployment

Production: https://olegnovoselskyy.com. The www hostname redirects to the apex.
Worker: `oleg-consulting`. `wrangler.jsonc` contains public configuration only.

## Form protections

- Cloudflare Managed Turnstile, restricted to the production hostname. The server checks success, hostname and the `contact` action. Tokens are short-lived and single-use at Siteverify; each form attempt resets the widget.
- Five POST attempts per visitor IP per hour, checked before reading the request body. Cloudflare supplies the trusted client IP; arbitrary forwarded headers are ignored.
- A shared SQLite Durable Object atomically reserves at most 25 provider calls per UTC day. Reservations are not refunded on failure or ambiguous timeouts, so provider problems cannot bypass the cap. Retries also consume capacity and retain the provider idempotency key to avoid duplicate delivery.
- Counter state survives Worker restarts and deployments. Salted IP hashes expire after one hour, with alarm cleanup; inquiry content is not stored in the counter database.
- Honeypot, exact origin, bounded request size, field validation, fixed recipient, plain-text messages, no automatic replies, and provider timeouts remain enforced.
- Missing secrets, storage failures, invalid cap configuration, or failed Turnstile verification stop email sending. Limit responses preserve the visitor's message and offer the email link.

The cap limits this form's provider attempts, not other uses of the Resend account. A determined attacker can exhaust the allowance; the limit bounds email volume, not every possible denial of service.

## Secrets

`RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` are Cloudflare Worker secrets. The Turnstile site key is intentionally public. Never use a VITE variable for secrets. `.env*`, `.dev.vars*`, and `.wrangler/` are ignored; only `.env.example` with empty credential placeholders is public.

For rotation, use `npx wrangler secret put RESEND_API_KEY` or `npx wrangler secret put TURNSTILE_SECRET_KEY` interactively. Never paste credentials into code, CLI arguments, logs or PRs. Resend keys should be sending-only and restricted to the verified mail domain. Rotating the Turnstile secret also changes the IP hash salt; the global daily cap remains unchanged.

## Release and recovery

Run `npm ci`, `npm run build`, all three test scripts, and `npm run check:secrets` before `npx wrangler deploy`. GitHub validation runs the same checks without email credentials. The Node runtime is local development only; production uses `cloudflare/worker.mjs`. The legacy static Sites adapter cannot deliver email.

Verify the homepage, www redirect, public config, missing-token rejection, one browser inquiry and Resend delivery after a release. Do not exhaust the real daily allowance during verification; the concurrent cap and persistence tests use isolated local Durable Objects.

Use Cloudflare Worker deployment history to roll back code to a previously verified version. A code rollback does not reset the daily counter or undo the Durable Object migration. To stop sending immediately, remove the Resend Worker secret; the endpoint fails closed.

This setup uses Workers and SQLite Durable Objects compatible with the Free plan; no paid-plan upgrade was made. Platform quotas still apply. Check Cloudflare usage before changing plans or increasing limits.
