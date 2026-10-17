# Oleg Novoselskyy — Consulting

Personal consulting website. Live: https://olegnovoselskyy.com. Repository: https://github.com/tatteddev/Consulting.

## Run locally

Application code uses strict TypeScript: React in `src/`, the local Node runtime and shared contact handler in `server/`, and the production Worker in `cloudflare/`. The static adapter is in `worker/`. Separate browser, Node and Worker type configurations keep platform APIs distinct; the shared contact handler is checked against both server runtimes. Network JSON still undergoes runtime validation.

`npm run typecheck` checks all application code without emitting files. `npm run build` requires that check before bundling, so both GitHub validation and Cloudflare Builds reject type errors. Vite and Wrangler emit JavaScript; `tsx` runs the local Node server and lets the existing JavaScript regression tests import TypeScript. Build utilities and tests remain JavaScript.

Use Node.js 22 or later. Run `npm ci` and `npm run build`. Copy `.env.example` to `.env`, supply a domain-restricted Resend sending key, and run `npm start` to serve the frontend and contact endpoint together at http://127.0.0.1:4173/.

`npm run dev` and `npm run preview` serve frontend assets only. Use `npm start` for email checks. Never put credentials in VITE variables or client code. The configured local `.env` is gitignored and excluded from archives.

## Contact delivery

The form posts to `/api/contact`. The production Cloudflare Worker sends plain-text email through Resend to the fixed recipient **oleg.novoselskyy@gmail.com**, from **inquiries@mail.olegnovoselskyy.com**, with the visitor's email as Reply-To. No automatic visitor email is sent.

The four approved Cloudflare DNS records and Resend sending domain were verified on 2026-10-17. A real browser submission was reported **delivered** by Resend at 14:37 UTC. Inbox folder placement and reading were not independently checked.

Pending, success and error states are shown in the form. Failed requests preserve visitor text. Server protections include bounded request size, field validation, an exact allowed origin, honeypot, rate limit and provider idempotency keys for retries. No inquiry database is maintained.

Production requires Managed Turnstile with server-side hostname and action verification. A shared SQLite Durable Object limits each IP to five POST attempts per hour and reserves at most25 provider attempts per UTC day. State persists across restarts; failed provider calls and retries consume reservations conservatively. Local Node development retains a process-local limit and does not require Turnstile. See DEPLOYMENT.md for details and recovery.

## Design and content

- Unified purple graphite workbench illustration: one abstract screen overview and four smaller stationary buildings labeled Product, Services, Data and Delivery, grounded in one shared perspective on a clean dark-glass deck. Neon packets enter a glowing central hub and then travel outward, with subtle background network points and screen motion. Includes Explore / Connect / Simplify controls, keyboard navigation, continuously running light animation, reduced-motion support and automatic offscreen pausing.
- Mobile workbench immediately below the headline. No separate scene title or visible animation toggle. Labels are engraved directly into each structure's front plinth, and the upper display has slim laptop proportions and a hinge.
- One headshot in the hero; text-only About section.
- Approved career summary, services, writing, personal lab and GitHub links.
- Self-hosted fonts, responsive WebP images and reduced-motion support.
- No named employers/clients, invented testimonials or unverified metrics.

## Validation and deployment

Run `npm run build`, `npm run test:contact`, `npm run test:sites`, `npm run test:cloudflare` and `npm run check:secrets`. Tests include the local HTTP runtime, provider stubs, Turnstile failure cases, and concurrent limits with real local SQLite Durable Objects and restart persistence. A production browser inquiry was reported delivered by Resend at17:20 UTC on2026-10-17.

The optional Sites/static adapter in worker/, scripts/ and .openai/ serves the frontend only. It does **not** implement contact delivery. Deploy the Node runtime or port and verify the endpoint for the chosen hosting platform. A static-only deployment leaves the form unavailable.

Cloudflare hosts production with HTTPS and a www redirect. Physical iOS Safari and Android Chrome acceptance remains a launch check. See design-qa.md and DEPLOYMENT.md for evidence and operations.

## Assets

public/assets/oleg-*.webp use the supplied headshot. workbench-*.webp are generated artwork from the selected purple concept. Font packages and Phosphor icons retain their upstream licenses.



## Production hosting update

Cloudflare Workers serves the website at https://olegnovoselskyy.com, with www redirected to the apex. The production contact endpoint requires Turnstile and uses durable per-IP rate limits plus a25-attempt UTC daily cap. See DEPLOYMENT.md for secret handling, checks and rollback. Earlier Node-only hosting notes above describe local development; production no longer uses its process-local limit.
