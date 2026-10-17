# Consulting design and delivery QA

final result: passed for local browser preview and live provider delivery

Reviewed 2026-10-17. Public hosting and physical-device acceptance are not included.

## Evidence

- Visual reference: ../../outputs/consulting-mockups-v2/03-systems-playground-purple.png.
- Preview: http://127.0.0.1:4173/.
- Revised captures: desktop-revised.png, mobile-revised.png and mobile-320-revised.png in ../../outputs/consulting-preview/.
- Real form success: contact-sent.png. Approved DNS: cloudflare-email-dns.png.
- Earlier design-comparison.png and type-comparison.png document the initial reference comparison. Draft-form captures are historical and superseded.

## Requested adaptations

The approved graphite/purple art, Manrope and Instrument Serif typography, editable content and interactive controls remain. DOM inspection confirms one real headshot in the hero and no About image. About uses a two-column text layout on desktop.

Mobile places the scene directly after the headline, followed by compact controls, supporting copy, CTA and portrait. The separate scene title is hidden there. This intentionally supersedes the original copy-first stack following user feedback.

Screenshots were inspected at 320, 390 and 1433 CSS-pixel widths with no horizontal overflow or clipped controls. Captures omit the scrollbar strip. Purple connections, dark background, prominent art and readable hierarchy remain. About and form success were inspected separately. No blocking visual issues remain.

## Live delivery

The browser submitted one labeled verification inquiry through the form at 14:37 UTC. Fields disabled during sending, then cleared with an in-page success notice. No email app opened. Resend email 01a14a4b-782e-7cc7-86ed-a0f5b4ad8afd was reported delivered to the configured Gmail recipient. This confirms provider delivery, not inbox folder placement or reading.

All four Cloudflare records were saved and verified by Resend. The credential is domain-restricted and kept in ignored local .env, excluded from distributable source.

## Validation and explicit source review

- Production build passed.
- Eleven contact/runtime tests passed, covering fixed recipient, Reply-To, input bounds, validation, honeypot, origin checks, missing configuration, provider failure, retry idempotency, limits and actual static/API routes.
- Four static-adapter tests passed.
- Mobile navigation opened and closed through contact navigation. Form labels and success were checked. Browser error/warning log was empty.
- Prior checks covered workbench pointer/keyboard controls, reduced motion and tablet layouts; these retained behaviors were not redesigned.
- Explicit review covered submission state, server validation, credentials, provider errors, retry behavior, static path boundaries and responsive order. Fixed a trailing-path-separator bug in the Node static root and covered it with a runtime test. Moved URL parsing inside request error handling. Final browser reload caught a missing Check icon import introduced during cleanup; restored it before handoff.
- No unresolved blocking findings for local implementation.

## Launch limits

- Hosting, website DNS/HTTPS and GitHub publication remain pending.
- The optional Sites adapter is static only; deploy Node or port and verify contact delivery.
- Proxies/multiple instances require trusted client-IP handling and a shared gateway limit.
- Physical iOS Safari and Android Chrome checks remain.
- The scene is raster art with accessible controls, not live 3D.


## Animated workbench revision — 2026-10-17

final result: passed

Source of truth: prior approved workbench art (../../outputs/consulting-assets/workbench-purple.png), the user's request to remove repeated upper/lower modules and add motion, and the generated stage plus three transparent module assets. Built-in generation prompts and paths are recorded in ../../outputs/consulting-assets/animated-workbench-assets.md.

Evidence: workbench-before.png and workbench-animated-desktop.png were opened together for the full hero comparison. Desktop CSS width 1433px; the comparison uses the shared top hero region because capture heights differ. Mobile screenshots workbench-animated-mobile.png and workbench-animated-320.png cover CSS widths 390 and 320px at height 844px. Browser density is approximately 1; scrollbar strips are excluded. Compare the default Explore state with the new motion paused so module positions can be inspected.

Required fidelity surfaces:
- Typography: existing Manrope/Instrument Serif, sizes, wrapping and hero hierarchy retained. No content headings changed.
- Spacing: existing copy-left/art-right desktop and headline-first mobile layouts retained. The three modules occupy the lower circuit landing areas. Pause control fits beside the tabs with 44px minimum height.
- Color: graphite, porcelain and purple lighting retained. Gentle 6-second brightness/saturation pulse replaces a static glow; no flashing.
- Image quality: generated stage removes every repeated screen building and label; three individual transparent WebPs provide independent motion. Assets loaded correctly. The monitor now has an abstract network overview. This is an intentional user-requested change, not fidelity drift.
- Content: no employer/client claims changed. Visible duplicate module labels were removed; accessible scene text explains architecture, delivery and AI.

Comparison history: initial layered preview exposed overlapping module name tags (P2). Removed those tags and recaptured desktop and both phone widths. The resulting clean scene has no blocking P0/P1/P2 findings. The 320px and 390px screenshots provide a focused view of the illustration and controls at their smallest required sizes.

Motion checks: sampled independent module transforms while running; Pause froze all three at identical transforms across separate observations; Play resumed them. Scrolling to About set data-motion-running=false. Pointer and ArrowRight workbench navigation still selected the correct explanation. At 320px all three animations were running, no horizontal overflow was present, and the final browser warning/error log was empty. Reduced-motion CSS and matchMedia change handling were explicitly reviewed; OS reduced-motion switching and physical-device performance were not emulated in this browser.

Explicit source review: effect observers/listeners are disconnected on unmount, animation uses transforms for modules, pauses offscreen and on hidden pages, and has no per-frame React state updates. The form/server implementation was untouched. Production build and all 15 existing contact/runtime/static-adapter checks passed. Live email was not resent for this visual revision.

Checklist: artwork saved and optimized; mobile and desktop inspected; pause/play and offscreen behavior verified; source reviewed; build/tests passed. Public launch and physical-device acceptance remain as previously documented.
`nCapture dimensions: before 1418 x 865; revised desktop 1418 x 1092; mobile 375 x 812; narrow mobile 305 x 804. Widths exclude scrollbars; the common desktop hero region is compared at equal pixel width.

## Four stationary buildings and moving data — latest correction

The user's final direction supersedes the earlier three-module floating treatment: Product, Services, Data and Delivery each appear once on the lower board. All four are smaller and stationary. The upper screen contains only the network overview. Light textures travel across two screen routes and four board routes; no building has an animation or transform.

Source review confirmed module-float was removed, data sprites are decorative, all four labels are real text, effects retain pause/play and reduced-motion support, and the existing visibility handling pauses the new packet effects. Independent browser observations showed changing packet transforms while all four building transforms remained none; Pause changed all six packets to paused. Images loaded successfully. An initial mobile Services-label overlap was corrected by separating the right-hand buildings vertically and horizontally.

Build and all 15 existing regression tests passed for the revision. Mail delivery was not resent. Final responsive screenshots and visual acceptance are recorded below.

Final visual acceptance: passed. Latest evidence is four-buildings-desktop.png (1433px CSS viewport), four-buildings-mobile.png (390px) and four-buildings-320.png (320px), under ../../outputs/consulting-preview/. The previous three-building screenshot and latest desktop screenshot were opened together at equal width for comparison. Browser captures omit the scrollbar; mobile screenshots also serve as focused checks of all four labels and the art. The final scene has four distinct labeled buildings with no label overlap, no repeated upper-screen miniatures, retained purple/graphite materials, unchanged typography and no horizontal overflow. Six packet effects were present; all four building animation names were none. Final browser error/warning log was empty. Physical-device motion performance and OS reduced-motion switching remain unverified.

final result: passed

## Laptop and front-face labels - current revision

final result: passed

The latest user directions supersede earlier controls and label treatments. All four structures have porcelain-white materials, violet light, and text engraved into front-facing plinths. Removed floating HTML labels, the scene heading and the visible pause/play button. The upper display has a thinner laptop lid and hinge. The four buildings form a tighter two-by-two grouping; desktop tabs are grouped instead of stretched across the full row.

QA iteration: initial generated Services artwork used dark graphite (P2), and the buildings/tabs were too spread out (P2). Replaced Services with matching white artwork and tightened spacing. Compared four-buildings-desktop.png and laptop-final-desktop.png together in the same visual input; common hero composition and Explore state are retained. Source viewport 1433px and final 1440px differ by 7px; this negligible width difference is recorded, not mistaken for a layout defect. Fonts, purple palette, copy, hierarchy and surrounding sections remain consistent. Individual full-resolution labeled assets were also inspected for text/material fidelity. No remaining P0/P1/P2 findings. Decorative lettering is naturally tiny at phone size; accessible scene text names the four structures.

Final browser evidence: laptop-final-desktop.png, laptop-final-mobile.png and laptop-final-320.png in outputs/consulting-preview. Phone CSS widths 390 and 320, height844; no horizontal overflow and all images loaded. Four modules have animation-name:none and transform:none; six data sprites change positions while running. Offscreen navigation sets data-motion-running=false. Pointer and arrow-key tab navigation passed. No scene heading, HTML label spans or motion-toggle remain. Reduced-motion media rule and event cleanup reviewed; OS preference switching and physical-device performance were not tested. Browser warning/error log empty.

Production build passed. All 11 contact/runtime tests and 4 static adapter tests passed; the loopback runtime test required execution outside the restricted network sandbox. No live email resent for visual edits. Subsequent material/spacing changes were rebuilt and browser-verified. Explicit source review found no unresolved issues: no credential changes, no floating-building animation, retained observer cleanup and reduced-motion support. Versioned laptop asset URLs avoid stale browser caching.

## Services grounding adjustment

final result: passed

Follow-up user direction: the corrected white round Services building looked suspended. Moved its static position right by 3 percentage points and down by 4, aligning its base over the existing right-hand circuit pad. Reversed and aligned the Services packet route from the central junction into its base. No floating motion added. Compared laptop-final-desktop.png and services-planted-desktop.png together at identical 1440x1100 viewport and Explore state. White materials, front-face labels and composition retained, with visible pad/connection alignment improved. No blocking findings. Inspected services-planted-mobile.png and services-planted-320.png at390/320px: four buildings remain distinct, no horizontal overflow. Services image loads at512px and computed animation is none. Production build passed; backend unchanged since the 15 passing regression checks. Latest screenshot evidence supersedes prior positioning screenshots.

## Right-hand pair spacing correction

final result: passed

The user identified overlap between Services and Delivery in the previous grounding adjustment (P2). Preserved both left-hand buildings and all artwork scales. Shifted Services from left59% to60%, and Delivery from left49%/top50% to47%/52%. This creates a clear diagonal gap while keeping Services on its pad and Delivery inside the front edge. Inspected actual alpha silhouettes with padding before applying the change, then compared services-planted-desktop.png and right-pair-desktop.png together at1440x1100, Explore state. The formerly overlapping outlines and labels are now separated. No remaining blocking findings.

Browser evidence: right-pair-desktop.png, right-pair-mobile.png (390px) and right-pair-320.png. Both phone layouts inspected; images loaded, no horizontal overflow, no browser warnings/errors. No changes to motion, palette, typography or left-hand placement. Build and all15 existing contact/runtime/static checks passed. No live email sent. Updated source archive excludes credentials.

## Unified clean-deck scene, hub motion and neon labels - latest

final result: passed

The user rejected the perspective and edge overhangs from individually composited building images. Replaced those layers with one coherent generated illustration; the laptop, four white buildings and their contact shadows share one perspective. Lower deck is smooth dark glass with sparse constellation points, no exposed pins or circuit clutter. All four structures fit inside the rails. Exactly one main wire per building connects through the violet hub. Removed an initially duplicated Product arc (P2) before final acceptance. Product, Data, Services and Delivery now use consistent neon-purple front-wall lettering with a restrained glow.

Source target: outputs/consulting-assets/workbench-neon.png, incorporating the user's approved unified layout and subsequent clean deck, single-wire and label directions. Opened that source and neon-hub-detail.png together for component comparison. Source1448x1086; rendered component760x570, same4:3 composition at1440x1100 desktop viewport, defaultExplore state. Expected differences are responsive scaling, the existing edge blend and live light textures. Building placement, label spelling, wire count, smooth board and color match. Full-page composition inspected in neon-hub-desktop.png; surrounding typography, layout and content retained. No blocking P0/P1/P2 findings.

Mobile: neon-hub-mobile.png at390px and neon-hub-320.png at320px, height844. All assets loaded, no horizontal overflow, four distinct structures remain visible. Neon lettering is clearer than prior dark engravings; decorative labels remain small on narrow phones and accessible scene text lists their names. Physical phone acceptance remains pending.

Animation: nine lightweight image sprites. Two incoming routes reach the central hub during the first half of an8-second cycle; hub glow strengthens, then two outgoing routes light up. Two screen paths and two restrained background routes add motion. Browser samples verified incoming and outgoing phases and changing hub opacity. There are zero separately positioned building layers. All nine effects pause offscreen after contact navigation; reduced-motion CSS remains effective by inspection. Pointer/keyboard mode controls passed. Browser warning/error log empty. No per-frame React updates.

Validation: final build passed;11 contact/runtime and4 static-adapter tests passed during this revision. Final changes after tests were image replacement and asset URL versioning, then rebuilt and browser-verified. No live mail resent. Source review confirmed removal of obsolete module positioning styles, no new dependencies, unchanged server/credentials, retained lifecycle cleanup and motion preferences. Images produced with built-in image editing; Pillow used only for responsive encoding. Source archive refreshed with credential exclusion check.

## Prominent wire traffic and traced screen routes

final result: passed

User requested clearer moving traffic and correction of screen pulses drifting away from the network. Kept the approved illustration unchanged. Replaced the old sparse screen routes with29/30-point traces measured against the1448x1086 final artwork, using cumulative distance for steady travel speed. Also refined four board routes to match their wires. Lower heads increased from2.4cqw to4.4cqw, brightness2.4, with one softer trailing sprite per route delayed180ms. Screen heads use2.8cqw and brightness1.8. The existing in/hub/out timing remains.

Compared neon-hub-desktop.png with traced-pulses-desktop.png in one input; composition, typography, buildings, labels and wire layout are unchanged. Screenshots depict different animation phases, intentionally. Observed brighter heads on the network branches and lower wire paths; no new blocking visual findings. Inspected traced-pulses-mobile.png and traced-pulses-320.png at390/320px. All images loaded, no horizontal overflow at390px, four trails present. Mobile wire head measured16.48px at390px, versus about9px previously. Browser samples confirmed head/trail positions differ along the same routes. Browser warning/error log empty. Captured full viewport after restoring a screenshot-clip capture artifact; final screenshots show the full page correctly.

Production build and all15 existing tests passed. Explicit source review: paused-state selector still outranks individual packet rules; reduced-motion!important remains in force; no per-frame JS, new dependencies, server changes or credential changes. Source archive refreshed. Real-device performance and OS motion preference switching remain launch checks.

## Descending neuron branch correction

final result: passed

Corrected the lower half of screen-two after the central junction. The pulse now follows the curved neuron tail to source coordinate (1240,480), instead of diverting onto the straight grid line ending at (1229,377). All other routes, brightness, illustration and layout remain unchanged. Compared the approved workbench-neon.png and neuron-branch-desktop.png together: the visible pulse sits on the curved lower branch; artwork and page composition match. Browser transform sampling also confirmed travel along the corrected curve. No remaining blocking finding for this correction.

Production build and all15 existing contact/runtime and static-adapter tests passed. At320px, document width and scroll width both305px, with no horizontal overflow. Mobile screenshot capture had a scaling artifact, so this check does not replace the earlier mobile visual acceptance. Desktop proof: neuron-branch-desktop.png. Source archive refreshed with credential exclusion validation.

## Desktop headline clearance

final result: passed

Removed negative desktop artwork margins and added a32px grid gap. Headline sizing now follows the text column using container units, preserving the two-line composition. At1440px and1024px, browser measurements confirm32px separation and no heading overflow. Desktop screenshot: desktop-headline-spacing.png. Mobile390px remains unchanged with no horizontal overflow. Build and all15 existing tests passed. Source review found only desktop layout rules changed; animation paths and server behavior remain unchanged.

Secret check: .env is ignored by Git, .env.example contains an empty key placeholder, and the known Resend key is absent from packaged source and browser assets. No source files are currently tracked in this local checkout. This is a local source/build check, not an audit of remote repository history. Turnstile and Cloudflare deployment remain proposed launch work; current rate limiting is process-local and needs production replacement.
