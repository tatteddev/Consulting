# Prototype Instructions

## Consulting decisions

- Personal website for Oleg Novoselskyy in tatteddev/Consulting, not HoneyDrunk Studios.
- Selected concept: purple systems playground with graphite workbench imagery, large sans-serif headline and italic serif accent. Preserve that direction.
- Mobile is a primary layout. Verify 320px and 390px widths, comfortable touch targets, no horizontal overflow, and reduced motion.
- Public copy uses the user's career summary; do not name employers or clients or add unverified credentials/testimonials.
- Inquiries send directly through the form to oleg.novoselskyy@gmail.com. The Node endpoint uses Resend with verified mail.olegnovoselskyy.com. Keep credentials server-only in ignored .env and exclude them from archives.
- Show the headshot once, in the hero. About is text-only.
- Mobile places the workbench directly below the headline. Do not show a separate scene title.
- Keep exactly four smaller, stationary buildings on the lower board, labeled Product, Services, Data and Delivery. The upper monitor shows an abstract network overview with no buildings or duplicate labels. This supersedes the earlier three-module interpretation.
- Animate neon light/data packets across the monitor and between the buildings; do not float or move the buildings. Keep the animation running without a visible pause/play control; honor reduced motion and pause outside the viewport or when the page is hidden.
- Labels belong directly on the front-facing structure/plinth walls in the image assets, never floating HTML badges. Use natural laptop display proportions and no "A clearer system" heading.
- All four structures use matching porcelain-white materials with violet lighting. Keep them in a compact, balanced two-by-two arrangement on the board; do not make Services dark.
- Use one coherent rendered scene for the laptop and four buildings, with shared perspective, contact shadows, visible spacing and all bases fully inside the rails. Do not return to separately positioned building cutouts.
- Lower deck is clean dark glass with sparse subtle network points, not exposed circuit clutter. Four main violet paths connect all buildings through a glowing central hub. Sequence light packets into the hub and back out to the structures.
- Exactly one main wire connects each building to the hub, including Product. Front-wall Product, Data, Services and Delivery lettering is readable neon purple, with restrained glow and consistent typography.
- Wire traffic uses prominent bright heads and soft short trails. Screen pulse routes must be traced against the current artwork's curved network lines; never reuse coordinates from a previous illustration.
- Keep deployment explicit. Production is Cloudflare Workers at olegnovoselskyy.com; preserve Turnstile, durable limits and Worker-secret handling.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/` and the mail endpoint in `server/`. Use `npm start` for the complete local website. Keep the static Sites adapter intact, but it does not deliver email; a Sites handoff requires porting and verifying the endpoint. Run `npm run build`, `npm run test:contact` and `npm run test:sites` before handoff.

- Desktop hero text and artwork must occupy separate columns with a visible gap. Size the headline to its text column; do not pull the artwork beneath the words using negative horizontal margins.

- Production hosting is Cloudflare Workers with Turnstile required server-side, five attempts per IP/hour and25 provider attempts per UTC day in a shared SQLite Durable Object. Keep production secrets in Worker secrets and keep .env/.dev.vars files ignored. Node is local development only. Preserve production fail-closed behavior.
