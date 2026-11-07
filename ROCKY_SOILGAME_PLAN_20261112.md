# Soil Grower Game: Base44 Platform Study and Master Plan

**Task ID:** ROCKY-SOILGAME-PLAN-20261105  
**File:** `ROCKY_SOILGAME_PLAN_20261112.md`  
**Date:** 2026-11-05 (Updated with George Steward's Addendum and M's Research Findings)  
**Owner:** Rocky  
**Status:** Plan Only (Zero Base44 projects created, zero assets generated, zero credits spent)

---

## Executive Recommendation and Gate Decision

### The Recommendation: Option B (Medium Scope, Persistent Sanctuary and Compounding Cooperative)

Build **Option B**: an accountless, browser-native vertical soil profile and sanctuary builder on a default `*.base44.app` URL (`Public (no login)`), where the player restores compacted urban land into a living multi-horizon tree sanctuary while operating a visible, compounding tripartite cooperative economy in game currency.

Why Option B wins under the 28-day clock (closing 2026-12-03 at 17:59 Central / 23:59 UTC) and the contest's three equally weighted judging criteria (**Gameplay Quality**, **Creativity**, and **Technical Execution**, with tie-break order Gameplay Quality, then Technical Execution, then Creativity):

* **Why Option A (Small, One-Screen 5-Minute Loop) loses:** Option A relegates the cooperative split to a season-end summary line. In `ADDENDUM_GEORGE_DECISIONS_20261105.md`, George ruled that the cooperative is a compounding mechanic that gets stronger with usage and cooperation, not season-end flavor. A five-minute single-screen loop also lacks the session depth required to win the Gameplay Quality tie-breaker or drive multi-day return upvotes on the Base44 Launchpad track ($15,000 across 11 winners selected from the top 25 most-upvoted apps).
* **Why Option C (Ambitious, Multiple Sites and Explicit Mars Campaign) loses:** Building multiple biome sites, synchronous multiplayer lobbies, and a multi-act narrative in four weeks invites the *Glitch* onboarding overload failure mode and sacrifices mobile frame rates and visual polish. Polish and stability account for a full third of the $50,000 judging score.
* **Why Option B hits the target:** Option B spends its entire novelty budget on the **five unfilled ecological pillars** verified by M's research (vertical O, A, and B soil horizons with root flare decompaction; fungal-to-bacterial F:B ratio as the plant succession engine; subterranean mycorrhizal hyphal graph unlocking mineral-bound phosphorus; hydrological infiltration versus surface runoff under storm pulses; and accountless asynchronous root-zone cooperation). It pairs those five pillars with a compounding three-party cooperative ledger (Soil Grower, Landowner, and Players) backed by a modular grower data interface that starts with calibrated arboricultural numbers and accepts live grower telemetry later without a redesign.

### How George's Addendum Decisions Shape This Plan

1. **The Cooperative as a Compounding Mechanic:** Every tending action and asynchronous neighbor contribution feeds a live **Cooperative Prosperity Pool** split across the Soil Grower stake (equipment and inoculant brewing capacity), the Landowner stake (Critical Root Zone acreage and hydrological retention infrastructure), and the Player stake (cultivar unlocks and mycelial network reach). Nothing relegates the cooperative to a passive end-of-season text box.
2. **Configurable Grower Data Interface:** All soil physics and biological rates read through a strict TypeScript interface (`src/api/growerTelemetry.ts`). In the contest build, the interface serves a deterministic modeled operation using real arboricultural metrics (bulk density in `g/cm3`, O-horizon woodchip depth in inches, F:B ratio from `0.1` to `5.0+`, infiltration rate, and phosphorus availability). When live field telemetry from Soil Grower LLC operations is connected later, the data source swaps without altering the rendering canvas or cooperative ledger.
3. **Franchise and Book Coherence Without Scope Expansion:** The game is built as the first artifact of the *Soil Grower* universe, where Earth sanctuary restoration establishes the biological protocols that future soil growers carry to Mars (in the register of *Star Wars* or *Project Hail Mary*). The contest build stays grounded on Earth so cozy and ecological simulation players experience warm, tactile flora and soil biology (avoiding the *Lost Nova* alien ray-gun trap documented by Chris Zukowski), while the field handbook, telemetry nomenclature, and cooperative rules establish canonical lore ready for the *Soil Grower* book.
4. **Hard Legal Boundary in the Design:** Per M's legal verification (*SEC v. W.J. Howey Co.*, *Dufoe v. DraftKings Inc.*, FinCEN guidance FIN-2019-G001, and Internal Revenue Code Subchapter T, 26 U.S.C. sections 1381 to 1388), pooling player money or labor with producer and landowner operations for in-game fiat payouts constitutes an unregistered security and unlicensed money transmission, and is prohibited by contest terms, Steam, Apple, Google, Stripe, and Base44. The game runs 100% in non-redeemable game currency. Real-world cooperative proceeds and STIM Biosciences LLC funding route strictly offline through Soil Grower LLC, Subchapter T agricultural patronage, and conservation grant vehicles.

### The Single Gate Decision George Must Make to Start Execution

Before Rocky initializes a Base44 project, generates an asset, or spends a single credit, confirm these three lock-in items:

1. **Confirm Option B Scope and Primary Verb:** Lock **Option B** with **Tend** (air-spade decompact, woodchip mulch, fungal inoculate) as the primary hand action, **Diagnose** (vertical soil horizon and root-collar inspection) as the secondary view, and **Direct** (cooperative crew allocation) as the tertiary compounding unlock.
2. **Confirm Persistent Sandbox with Seasonal Weather Pulses (No Resets):** Lock a persistent, non-resetting sanctuary sandbox where soil biology and cooperative stakes compound indefinitely, tested by periodic storm and summer heat-dome events that pressure infiltration without erasing player progress.
3. **Confirm Base44 Builder Tier Upgrade:** Approve upgrading the Base44 workspace to the **Builder** tier ($40/month annual or $50/month monthly, or **$20/month annual / $25/month monthly** with George's `@oregonstate.edu` 50% academic discount) so Rocky can build locally via CLI, two-way GitHub sync, and Cloud Sandbox MCP at **0 message-credit burn**, deploy Deno backend functions and WebSocket Actors, and hide the "Edit with Base44" clone badge during community voting.

---

## Phase 1: Base44 Platform Study

All capabilities below are verified from the installed `base44-cli` (`v0.1.7`) and `base44-sdk` (`0.8.52+`) skill specifications and official Base44 developer documentation (`docs.base44.com`). Any limit not published in primary documentation is marked `UNVERIFIED`.

### 1.1 Platform Capability and Limit Matrix

| Capability Domain | Verified Base44 Mechanism | Verified Quotas, Ceilings, and Operational Traps | Unverified / Unpublished Parameters |
|:---|:---|:---|:---|
| **Frontend Runtime & Rendering** | Static Single Page Application (SPA) built with **React**, **Vite**, and **Tailwind CSS** (`outputDirectory: "./dist"`). Supports any public npm package (`HTML5 <canvas>`, WebGL, PixiJS, Phaser, Three.js). All routes serve from `index.html`. | Runs at **60 fps** client-side in desktop and mobile browsers. Requires **Node.js 20.19.0+** for local CLI execution. Server-side rendering (SSR) and React Server Components are **not** supported. On iOS Safari/WebKit, total `<canvas>` memory caps at **256 MB to 384 MB** (reuse one canvas rather than allocating multiple offscreen layer canvases). | `[UNVERIFIED: maximum compiled dist/ bundle byte limit on Base44 static hosting not published in Base44 documentation]` |
| **Accountless Local Persistence** | Browser `localStorage`, `sessionStorage`, `IndexedDB` (`navigator.storage.persist()`), URL query/hash seeds, and Base64 string export/import work natively inside Base44 React apps. | `localStorage` caps at **5 MiB per origin** and throws `SecurityError` or `QuotaExceededError` in Incognito tabs and sandboxed iframes; every `localStorage` call must be wrapped in `try/catch`. High-frequency soil grid arrays belong in `IndexedDB` keyed by a client-generated `crypto.randomUUID()`. | None (standard W3C browser storage specifications apply). |
| **Accountless Cloud Persistence (Entities)** | Managed MongoDB-compatible NoSQL database defined in `base44/entities/{kebab-case}.jsonc`. Accessed via `base44.entities.<Name>.create()`, `list()`, `filter()`, `get()`, `update()`, `updateMany()`, `bulkCreate()`, `bulkUpdate()`, and `subscribe()`. | **0 integration credits** per Entity CRUD operation on all plans (including Free). `list()` and `filter()` cap at **5,000 records per request** (`distinct` caps at **1,000**). When App Visibility is `public` (`Public (no login)`) and RLS sets `"create": true, "read": true, "update": true`, anonymous guests can read and write records (`created_by` stores `"anonymous"`). **Trap:** Any RLS rule referencing `{{user.*}}` or `user_condition` rejects anonymous callers with HTTP **403/404**. JSON Schema RLS supports `$or`, `$and`, `$nor`, `$in`, `$nin`, `$ne`, `$all`, but **not** `$gt`, `$lt`, or `$regex`. | `[UNVERIFIED: maximum total entity collection count and total row count beyond the plan's database byte cap are not published in Base44 documentation]` |
| **Database Byte & Record Quotas** | Storage and single-document size caps enforced across all Entities in an app (for apps created from October 18, 2026). | **Free:** 200 MB DB / 100 KB max record. **Starter:** 2 GB DB / 100 KB max record. **Builder:** 5 GB DB / 100 KB max record. **Pro:** 10 GB DB / 250 KB max record. **Elite:** 25 GB DB / 250 KB max record. **Business:** 50 GB DB / 250 KB max record. **Enterprise:** Unlimited DB / 1 MB max record. | `[UNVERIFIED: write-requests-per-second rate limit on direct client Entity mutations is not published in Base44 documentation]` |
| **Realtime WebSockets (Actors & Subscriptions)** | **Actors:** Stateful Cloudflare Durable Object rooms (`base44/actors/<ActorName>/entry.ts`) connected via `base44.actors.<Name>(roomId).connect()`. **Entity Subscriptions:** `base44.entities.<Name>.subscribe(cb)` for live `"create"`, `"update"`, `"delete"` events. | Actors support anonymous connections (`conn.identity` is `{ type: "anonymous", anonymousId }`). Managed game ticker (`shouldTick()` / `handleTick()`) defaults to **100 ms (10 Hz)** and configures down to **50 ms (20 Hz)**. Quiet rooms hibernate in-memory state after **~10 seconds** (even with sockets attached), requiring `this.storage.put()` checkpoints and `handleStart()` reconciliation against `this.getConnections()`. Throttle client pointer messages to **20 to 30 msg/sec max**. Requires **Builder** plan or higher. No native WebRTC. | `[UNVERIFIED: hard platform cap on concurrent sockets per Actor room beyond the 32-user sample constant, max WebSocket frame bytes, and whether Actor ticks consume integration credits are not published in Base44 documentation]` |
| **Serverless Backend Functions** | Deno TypeScript runtime (`base44/functions/<kebab-name>/entry.ts`) invoked via `base44.functions.invoke(name, payload)` (`res.data` holds returned JSON). Supports `base44.asServiceRole` to bypass RLS for validated server writes. | Hard **5-minute (300-second) timeout**; max call-chain depth of **7 functions** (8th fails with HTTP 403, error code `1000`). Shared code must reside in `base44/shared/`. Requires **Builder** plan or higher. | `[UNVERIFIED: per-invocation Deno RAM ceiling and CPU millisecond allocation are not published in Base44 documentation]` |
| **Asset Storage & Project Export** | Static files uploaded to the per-app File Library (`media.base44.com`) do not count against the DB byte cap and have no total storage limit. `npx base44 eject` downloads full managed source code locally. | Per-file File Library upload limits: **40 MB** images (`PNG`, `JPG`, `GIF`, `WEBP`), **5 MB** `SVG`, **100 MB** audio (`MP3`, `WAV`) and video (`MP4`, `WEBM`), **10 MB** `JSON`/`CSV`. **Critical Trap:** The Editor File Library **automatically downscales any image larger than `1024x1024` pixels**. Commit sprite atlases (`<= 1024x1024`) or SVG/procedural assets directly in `public/` or `src/assets/` via CLI/GitHub so they avoid resizing and survive `npx base44 eject`. | `[UNVERIFIED: network bandwidth throttling threshold on media.base44.com under viral traffic is not published in Base44 documentation]` |
| **Hosting, URL Rules & 90-Day Longevity** | Hosted on `https://<slug>.base44.app` via `npx base44 deploy --build -y` or `npx base44 site deploy -y`. Visibility set via `npx base44 visibility public`. | Contest rules require a **default `*.base44.app` URL** (`Public (no login)`); attaching a custom domain **disqualifies** the entry. On the Free tier, public apps show a mandatory **"Edit with Base44"** badge allowing one-click cloning by competitors; Starter ($16/mo) and Builder ($40/mo, or $20/mo `.edu`) hide the clone badge. Static hosting + Entity CRUD cost **0 runtime integration credits**, so keeping the URL live for **90 days after December 10, 2026** (through March 10, 2027) incurs zero credit overage if runtime AI calls (`InvokeLLM`, `GenerateImage`, `aiGateway`) are excluded from player loops. | `[UNVERIFIED: standalone legal modal text beyond the 18-item contest FAQ on nitropay.com/base44webgame and general Nitro Terms of Use is not indexed as a separate URL]` |
| **Build Loop & Agent Execution** | Local CLI (`npx base44 create`, `dev`, `build`, `deploy`, `entities push`, `functions deploy`, `actors deploy`, `types generate`), two-way GitHub sync, and Cloud Sandbox MCP (`https://app.base44.com/mcp`). | Browser AI chat prompts burn **2 to 4 message credits per turn**. Local CLI / GitHub sync / Cloud Sandbox MCP edits cost **0 message credits** (requires Builder tier). **CLI Traps:** Never run bare `npm run build` (`npx base44 build` is required to inject `VITE_BASE44_APP_ID`). `npx base44 dev` runs entities/functions locally (throwaway DB) but does **not** run Actors locally. Cloud Sandbox caps at **~120 reads/min, ~60 mutations/min, ~30 commands/min**, and 2-min default / 10-min max timeout. | None (verified directly from `base44-cli` and `base44-sdk` skill specifications). |

---

## Phase 2: Three Concepts, One Recommendation

All three concepts honor the contest rules (100% free, no login, default `*.base44.app` URL, zero real-money wagering or cash-out) and draw from George's seed and addendum.

### 2.1 Concept Comparison Table

| Dimension | Option A: Small & Complete ("Root Collar Care") | Option B: Medium ("The Living Sanctuary") [RECOMMENDED] | Option C: Ambitious ("Full Biome Guild Network") |
|:---|:---|:---|:---|
| **Moment-to-Moment Primary Verb** | **Diagnose & Clear** (one-screen click-to-clear root collar burial and apply one mulch layer on a single tree). | **Tend** (paint air-spade decompaction channels, layer arborist woodchips, apply fungal inoculants, and plant companion guilds across a dual surface + vertical O/A/B soil profile), with **Diagnose** (profile inspection) and **Direct** (cooperative crew dispatch) as secondary verbs. | **Direct & Trade** (manage multi-site crews, tractors, hydrology networks, and cross-site resource logistics across 4 biomes plus an unlockable Mars regolith biodome). |
| **First 30 Seconds (Zero-Menu Onboarding)** | Browser opens directly onto a stressed urban oak cross-section. Player drags an AirSpade nozzle across compacted gray clay hiding the root flare; bark breathes, sap flows, and a 5-minute rain timer starts. | Browser opens in `< 5 seconds` (`<= 5 MB` bundle, zero login/title wall) onto a crusted, compacted urban lot (`F:B = 0.15`, bulk density `1.65 g/cm3`) with a dying Live Oak. A pulsing cursor invites the player to air-spade the buried root flare and drop 4 inches of woodchips. A passing rain shower immediately infiltrates the mulched trench instead of running off, lighting up the first golden mycorrhizal hyphae. | Browser opens to a regional map where the player selects a degraded parcel, drafts a 3-person crew, configures a Soil Grower cooperative contract, and dispatches equipment to clear construction fill. |
| **What the Loop Rewards** | Closing a 5-minute seasonal cycle awards a static end-of-season scorecard showing how harvest points split between Grower, Landowner, and Player. | **Compounding Ecological & Cooperative Loop:** Moving from `0.15` (weed-dominated clay) past `1:1` to `5:1+` unlocks understory guilds and climax canopy trees, grows a subterranean mycorrhizal graph that solubilizes locked phosphorus, banks deep B-horizon storm water against summer heat domes, and compounds the tripartite **Cooperative Ledger** (upgrading Grower equipment, expanding Landowner sanctuary parcels, and multiplying Player & Neighbor patronage dividends). | Managing multi-site supply chains, balancing regional carbon budgets, ratifying server governance rules, and unlocking the late-game Mars regolith act. |
| **Build Cost (4-Week Clock)** | **Low:** ~40 engineering hours, 1 React view, 1 HTML5 `<canvas>`, `localStorage` only, 0 Base44 Entities or Actors required. | **Focused:** ~110 engineering hours across 4 weeks; 1 reusable dual-mode HTML5 `<canvas>` (Surface + Vertical O/A/B Horizon), 3 Base44 Entities (`Sanctuary`, `Commons`, `ActivityLog`), 1 Backend Function (`validate-checkpoint`), 1 optional WebSocket Actor (`BoardRoom`), and procedural/SVG + `<= 1024x1024` sprite atlas assets. | **High Risk:** ~280+ engineering hours; 5 distinct biome tilemaps, complex pathfinding AI, multi-room Actor synchronization, and 100+ bespoke sprites. |
| **What Breaks First** | **George's Addendum & Retention:** Fails George's mandate that the cooperative is a compounding live mechanic rather than a season-end summary line. Sessions end in 5 minutes with low D1/D7 retention and weak Launchpad upvote momentum. | **Scope Expansion on Crew Graphics:** If bespoke animated crew sprites or 10Hz live cursor streaming take too long in Week 3, they can be cleanly cut to asynchronous Entity subscriptions without hurting the core soil physics or cooperative ledger. | **Onboarding & Polish Collapse:** Hits the *Glitch* failure mode (high Day-0 cognitive drop-off), exceeds mobile `<canvas>` memory budgets, and ships unpolished across all three judging criteria. |

### 2.2 Plain Verdict: Why Option B Wins and A and C Lose

1. **Against the Judging Criteria (Gameplay Quality 33.3%, Creativity 33.3%, Technical Execution 33.3%):**
   * **Gameplay Quality (First Tie-Break):** Option A is a five-minute vignette that players finish once and close. Option C spreads four weeks of engineering thin across five maps, producing unpolished menus. Option B delivers a tactile, high-feedback core loop (air-spade decompaction, mulching, fungal inoculation, and storm infiltration physics) that hooks in 10 seconds like *Sandspiel* and sustains 15-to-30-minute sanctuary-building sessions like *Dorfromantik* and *Roots of Pacha*.
   * **Creativity (Third Tie-Break):** As M's landscape study proved across 15 comparable games, every shipped farming sim (*Stardew Valley*, *Roots of Pacha*, *Farm Together 2*) treats soil as an inert 1x1 timer slot, and every restoration puzzle (*Terra Nil*, *Preserve*) deletes player structures at 100% greenery. Option B owns all **five unfilled ecological pillars** plus a compounding cooperative ledger.
   * **Technical Execution (Second Tie-Break):** Option B uses Base44's exact architectural strengths (60 fps single-canvas React SPA, `try/catch` `localStorage` + `IndexedDB` hybrid persistence, zero-credit Entity CRUD with anonymous RLS, and a configurable grower data interface) while staying well inside the `<= 5 MB` initial load and 256 MB iOS Safari memory limits.

---

## Phase 3: Master Specification (Option B: The Living Sanctuary)

### 3.1 Game Design Document

#### World Coherence and Franchise Horizon (Game + *Soil Grower* Book Alignment)
* **Setting the Stage Without Expanding the Build:** In the *Soil Grower* universe, climate instability and urban compaction forced a new discipline of biological engineering: growers who rebuild dead mineral dirt and compacted clay into self-sustaining living sanctuaries using rhizosphere physics and cooperative stewardship. The contest game takes place at **Sanctuary Zero (Alkaline Calcareous Clay & Acidic Volcanic Soil Testing Ground)**, the Earth site where the **Soil Grower Cooperative Standard** is forged.
* **The Connection to the Book (Mars Horizon):** As the player shifts their sanctuary's Fungal-to-Bacterial (F:B) ratio from `0.15` (dead compacted fill) to `5.0+` (climax canopy), entries unlock in the **Field Handbook**. Each handbook entry pairs real soil science (air-spade decompaction, glomalin aggregation, ectomycorrhizal phosphorus solubilization) with forward-looking notes on how the same biological equations apply to closed-loop soil genesis on Mars. This gives the *Soil Grower* novel a coherent, scientifically grounded world without introducing sci-fi ray guns or alien sprites that alienate cozy and ecological restoration players.

#### Core Loop and Moment-to-Moment Verbs
* **Primary Verb: TEND (70% of player hands-on time)**
  1. **Air-Spade Decompaction & Root Collar Care:** Use the pneumatic AirSpade tool across crusted A-horizon and B-horizon clay (`bulkDensity > 1.55 g/cm3`) and buried tree root flares. Direct air shatters compaction pans into porous channels (`bulkDensity -> 1.15 g/cm3`) without cutting fine feeder roots.
  2. **Organic Horizon Mulching (Woodchips & Biochar):** Apply 3 to 4 inches of coarse arborist woodchips, leaf mold, and biochar into the O-horizon and vertical mulch trenches. Woodchips shade the mineral soil, lower soil temperature during heat domes, and feed saprophytic fungi.
  3. **Biological Inoculants & Guild Planting:** Apply fungal compost tea, inoculate roots with arbuscular and ectomycorrhizal spores, and plant successive polyculture guilds (pioneer nitrogen-fixers -> perennial understory herbs -> climax canopy trees: Live Oak, Douglas-fir, Pecan).
* **Secondary Verb: DIAGNOSE (20% of player time)**
  * Switch cleanly between the **Canopy Sanctuary View** (isometric/top-down layout) and the **Rhizosphere Profile View** (vertical O, A, and B soil horizons). Inspect three live overlays:
    1. *Compaction & Bulk Density Heatmap* (`1.10 g/cm3` porous aggregate vs. `1.75 g/cm3` root-blocking hardpan).
    2. *Microbial Succession Meter (F:B Ratio)* showing bacterial dominance (`< 0.3`, ruderal weeds only) vs. fungal dominance (`1.0` to `5.0+`, supporting woody perennials and climax trees).
    3. *Mycorrhizal Hyphal Graph & Hydrology Overlay* showing carbon flow from sunlit canopy leaves down into fungal hyphae, enzymatic unlocking of mineral-bound phosphorus (`P`), and deep B-horizon moisture banks.
* **Third Verb: DIRECT (10% of player time, compounding unlock)**
  * As the Cooperative Ledger compounds, players assign automated **Cooperative Crew Shifts** (soil technician, compost tea unit, hydrology trencher) that maintain mulched zones and share surplus inoculant across the asynchronous co-op room.

#### The Five Ecological Pillars in Simulation Math
Each sanctuary parcel is modeled as a **16-column x 4-horizon grid** (`O` Surface Mulch, `A` Topsoil Root Zone, `B` Subsoil Mineral Bank, `C` Parent Calcareous Clay Substrate) running at a deterministic 4 Hz simulation tick (decoupled from the 60 fps `requestAnimationFrame` render loop):

1. **Horizon Compaction & Root Flare Health:**
   * Every cell tracks `bulkDensity` (`1.05` to `1.85 g/cm3`). Roots cannot penetrate cells where `bulkDensity > 1.60 g/cm3`.
   * Trees planted or found with mulch or fill piled against their trunk suffer root collar stress (`collarBurialDepth > 0`), throttling canopy photosynthate output by `40%` until cleared with the AirSpade.
2. **Fungal-to-Bacterial (F:B) Succession Engine:**
   * Every column tracks `bacterialBiomass` and `fungalBiomass`, yielding `fbRatio = fungalBiomass / Math.max(1, bacterialBiomass)`.
   * **Succession Tiers:**
     * `F:B < 0.4`: Bacterial fill. Only ruderal weeds thrive; tree saplings suffer stress.
     * `0.4 <= F:B < 1.2`: Early succession. Pioneer annuals, nitrogen-fixers, and pollinator herbs establish.
     * `1.2 <= F:B < 3.0`: Forest edge. Mycorrhizal shrubs, fruit guilds, and young saplings establish rapid root extension.
     * `F:B >= 3.0` (up to `8.0`): Climax sanctuary. Climax canopy trees (Live Oak, Douglas-fir, Pecan) achieve maximum carbon pumping, deep drought resilience, and high spore production.
   * **The Synthetic N-P-K Trap:** An optional "Quick N-P-K Buff" action gives a brief 30-second green flash but spikes salinity, kills `45%` of `fungalBiomass`, collapses glomalin aggregates, and increases `bulkDensity` by `+0.12 g/cm3`, teaching players why regenerative arboriculture rejects synthetic N-P-K regimes.
3. **Mycorrhizal Hyphal Graph & Phosphorus Solubilization:**
   * B-horizon cells contain locked mineral phosphorus (`lockedPhosphorus`, such as allophane/iron-bound P in acidic volcanic soils or calcium-bound P in alkaline calcareous clays). Roots alone cannot absorb `lockedPhosphorus`.
   * When a living root tip contacts mycorrhizal inoculum in a porous cell (`bulkDensity < 1.45`), a visible golden hyphal edge grows across adjacent cells at a rate proportional to canopy carbon allocation (`photosynthateFlow`).
   * Hyphal nodes secrete organic acids and phosphatases, converting `lockedPhosphorus` into `availablePhosphorus` and routing it back through the hyphal graph to every connected plant in the sanctuary.
4. **Hydrological Infiltration vs. Runoff Physics (Storm & Heat-Dome Pulses):**
   * Every 4 minutes of active play (or on player-triggered "Call Storm Pulse" once ready), a **Weather Event** tests the sanctuary:
     * **Flash Storm Pulse:** Rain falls across the top of the 16 columns. In each column, `infiltrationRate` is computed from `O-horizon mulch depth`, `A-horizon glomalin/organic matter`, and inverse `bulkDensity`. Water exceeding `infiltrationRate` becomes lateral **Surface Runoff**, eroding unprotected topsoil (`-A_horizon_depth`). Water that infiltrates percolates into the **B-Horizon Moisture Bank**, where biochar micropores and fungal hyphae hold it against gravity.
     * **Summer Heat Dome:** Surface evaporation spikes `3x`. Bare soil bakes (`soilTemp > 105 F`), stressed roots wither, while columns protected by 3 to 4 inches of arborist woodchip mulch (`soilTemp < 78 F`) and connected to the deep B-horizon moisture bank via mycorrhizal hyphae continue photosynthesizing without stress.
5. **Progression Without Resets (Persistent Sandbox):**
   * **Verified Structure:** Nothing resets. A player's sanctuary accumulates soil depth, fungal network complexity, tree canopy maturity, and cooperative equity continuously across sessions. Weather pulses act as stress tests that reward well-built soil structure with massive growth surges (post-rain fungal flushes and canopy expansion) rather than wiping the board.

#### Failure States, Session Length, and Mobile Behavior
* **Restorative Failure States:** There is no terminal "Game Over" screen. If a storm causes runoff on bare clay or a heat dome wilts an unmulched sapling, the **Diagnose** view highlights the exact physical cause (for example, `Compaction Pan at 8 inches blocked infiltration` or `Buried Root Flare limited sap flow`) and gives the player an immediate, satisfying 10-second remediation action.
* **Session Length Targets:** Designed for **5-to-8-minute micro-sessions** (clear two root flares, mulch a guild bed, weather one storm pulse, dispatch a cooperative spore packet; exceeding Poki's `> 3 min` Stage 2 and `> 5 min` Stage 3 benchmarks) and **20-to-40-minute deep sessions** (connecting a full 16-column mycorrhizal network across three climax trees).
* **Mobile and Browser Behavior:**
  * Responsive split-view layout: on desktop (`>= 1024px`), the Canopy + Vertical Soil Cross-Section sits left/center (75% width) with the Cooperative Ledger & Tool Controls on the right (25% width). On mobile portrait (`< 768px`), the interactive Soil Cross-Section + Canopy occupies the top 72% of the viewport with a thumb-friendly 4-button bottom bar (`Tend`, `Diagnose`, `Co-op Ledger`, `Handbook`).
  * Touch controls: single-finger drag for AirSpade and mulch painting; two-finger pinch or single-tap toggle to inspect horizon details; minimum `48x48 px` tap targets.

---

### 3.2 Cooperative Mechanic: The Honest, Compounding Tripartite System

#### Legal Boundary Stated in Design
In compliance with *SEC v. W.J. Howey Co.* (1946), *Dufoe v. DraftKings Inc.* (2024), *United Housing Foundation, Inc. v. Forman* (1975), FinCEN guidance FIN-2019-G001, Base44 Terms of Service Section 4.3, and the Base44 x Nitro Contest Rules (which prohibit gambling, wagering, or anything of monetary value), the in-game economy operates **exclusively in non-redeemable ecological game currencies**:
* **Carbon Biomass Credits:** Earned when tending actions measurably increase soil organic matter, lower bulk density, or infiltrate storm water.
* **Mycorrhizal Patronage (`MP`):** Generated by connected mycorrhizal networks and asynchronous cooperation between players.

Zero real money enters or leaves the game client. An optional "About the Soil Grower Cooperative" modal explains in plain language how real-world agricultural and arboricultural cooperatives operate under Internal Revenue Code Subchapter T (26 U.S.C. sections 1381 to 1388) and how Soil Grower LLC and STIM Biosciences LLC apply regenerative soil biology in the physical world.

#### How the Tripartite Cooperative Share Model Works and Compounds
Instead of a single personal wallet, every sanctuary is governed by a live **Tripartite Cooperative Ledger** visible on the main interface. Every unit of ecological yield (`Carbon Biomass Credits` and `Biomass Surplus` produced when canopy trees photosynthesize through healthy soil) flows into the **Cooperative Prosperity Pool** and distributes across three stakeholder shares that **compound each other**:

```
                    +-------------------------------------------+
                    |   LIVING SANCTUARY ECOLOGICAL YIELD       |
                    | (Photosynthate + Storm Water Infiltration |
                    |  + Phosphorus Unlock + Co-op Spores)      |
                    +---------------------+---------------------+
                                          |
                                          v
                    +-------------------------------------------+
                    |     TRIPARTITE COOPERATIVE LEDGER         |
                    |   (Compounds with Usage & Cooperation)    |
                    +------+--------------+--------------+------+
                           |              |              |
         +-----------------+              |              +-----------------+
         | 35% Grower Share               | 30% Landowner Share            | 35% Player Co-op Share
         v                                v                                v
+------------------------+    +-------------------------+    +-------------------------+
|   SOIL GROWER STAKE    |    |  LAND STEWARD STAKE     |    |  PLAYER PATRONAGE STAKE |
| (Producer & Crew)      |    | (Property & Sanctuary)  |    | (Community & Stewards)  |
+------------------------+    +-------------------------+    +-------------------------+
| Unlocks & Compounds:   |    | Unlocks & Compounds:    |    | Unlocks & Compounds:    |
| * AirSpade Pressure    |    | * Critical Root Zone    |    | * Climax Canopy Seeds   |
|   (wider decompaction) |    |   plot width expansion  |    |   & Companion Guilds    |
| * Compost Tea System   |    | * Trench & Water Bank   |    | * Co-op Spore Share     |
|   (2x F:B shift rate)  |    |   storm retention       |    |   Multiplier (1.1x-3.0x)|
| * Automated Crew       |    | * Surface runoff        |    | * Sanctuary Patronage   |
|   Tending Ticks        |    |   protection            |    |   Rank & Handbook Lore  |
+------------------------+    +-------------------------+    +-------------------------+
```

1. **The Soil Grower Stake (Producer Share, Default 35%):**
   * *Role:* Models the working arborist and soil technician who brings tools, inoculum, and physical labor.
   * *How it compounds:* As the Soil Grower Stake accumulates equity, it automatically upgrades the player's physical tools: Level 1 unlocks wider AirSpade cones (clearing 3 cells per drag instead of 1); Level 2 unlocks the **Fungal Compost System** (generating passive fungal inoculum every 60 seconds); Level 3+ unlocks **Cooperative Crew Shifts** that automatically repair surface mulch crusting during heat domes.
2. **The Land Steward Stake (Landowner Share, Default 30%):**
   * *Role:* Models the property or commons steward who commits physical land to long-term sanctuary custody rather than extractive paving.
   * *How it compounds:* As the Land Steward Stake grows, the landowner commits adjacent compacted lots into the protected **Critical Root Zone**, expanding the sanctuary from 8 columns to 16 columns and installing passive hydrological trenching that captures 50% of storm overflow for dry spells.
3. **The Player Patronage Stake (Community Co-op Share, Default 35%):**
   * *Role:* Models the kids and players directing sanctuary restoration and collaborating across the network.
   * *How it compounds:* Tracks **Patronage Dividends** based on ecological work contributed. Higher Player Patronage unlocks keystone climax species (Live Oak, Douglas-fir, Pecan), companion polyculture guilds, and boosts the **Cooperative Compounding Multiplier** (`1.00x` up to `3.00x`).
4. **Active Ledger Management (Player Agency):**
   * At any time, the player can adjust the **Cooperative Split Slider** within cooperative bounds (for example, shifting allocation to `50% Grower / 25% Landowner / 25% Player` when preparing to clear a heavily compacted clay pan, or `25% Grower / 50% Landowner / 25% Player` before a major storm season to build water-bank capacity).
   * **Asynchronous Root-Zone Co-op (STIM Layer-Zero Safe):** Through Base44 Entities, a player's sanctuary connects to a shared 12-sanctuary **Cooperative Room**. When a player clicks **"Send Spore & Mulch Care Package"** (costing 0 real money and using surplus in-game mulch/inoculum), it increments the recipient sanctuary's fungal inoculum and raises the sender's and receiver's **Cooperative Compounding Multiplier** by `+0.05x`. Per M's *Ultima Online* and *Everdale* failure-mode analysis, solo play is 100% self-sufficient, and co-op actions are strictly additive (no player can drain, chop, or compact another player's sanctuary).

---

### 3.3 Configurable Grower Data Architecture

Per George's addendum decision (*"Design for the substitution: a data interface that starts modeled and can accept a real source later without a redesign"*), the game never hardcodes ecological constants inside UI components or canvas renderers. Instead, all soil and operation metrics flow through a typed module (`src/simulation/growerTelemetry.ts`):

```typescript
// src/simulation/growerTelemetry.ts

export interface Horizon_Data {
  horizon: "O" | "A" | "B";
  depthInches: number;
  bulkDensityGcm3: number;        // Working grower range: 1.05 (ideal) to 1.80 (compacted pan)
  moisturePercent: number;        // Water content: 5% (wilting) to 45% (saturated)
  temperatureFahrenheit: number;  // Root zone temp: 55 F to 110 F
  organicMatterPercent: number;   // 0.5% (subsoil clay) to 65% (O-horizon woodchips)
}

export interface Sanctuary_Telemetry {
  siteId: string;
  siteName: string;
  substrateType: string;          // e.g., "Alkaline Calcareous Clay" or "Acidic Volcanic Soil"
  timestampIso: string;
  sourceMode: "modeled_calibrated" | "live_grower_telemetry";
  rootCollarBurialInches: number;
  fungalToBacterialRatio: number; // e.g., 0.15 (degraded urban fill) to 5.2 (climax)
  hyphalConnectivity: number;     // 0.0 to 1.0
  availablePhosphorusPpm: number;
  lockedPhosphorusPpm: number;
  infiltrationRateInPerHr: number;
  horizons: [Horizon_Data, Horizon_Data, Horizon_Data];
  growerInputLog: {
    airSpadeMinutesApplied: number;
    woodchipMulchCubicYards: number;
    biocharLbsApplied: number;
    compostTeaGallonsApplied: number;
  };
}

export interface Grower_Telemetry_Source {
  getInitialBaseline(siteId: string): Promise<Sanctuary_Telemetry>;
  fetchLatestFieldTelemetry(siteId: string): Promise<Sanctuary_Telemetry | null>;
  recordStewardshipAction(siteId: string, snapshot: Sanctuary_Telemetry): Promise<void>;
}
```

* **Contest Build Implementation (`modeledGrowerSource`):** Loads validated baseline profiles modeled on real calcareous clay and urban construction fill (`Alkaline Calcareous Clay`, initial `bulkDensityGcm3: 1.68`, `fungalToBacterialRatio: 0.18`, `infiltrationRateInPerHr: 0.25`, `lockedPhosphorusPpm: 140`, `availablePhosphorusPpm: 4`).
* **Future Live Operation Substitution (`entityGrowerSource`):** Reads real operational records pushed to a Base44 Entity from Soil Grower LLC field tablets, AirSpade job logs, or soil lab reports. Switching from modeled to live data is a one-line dependency injection swap in `src/simulation/engine.ts`.

---

### 3.4 Technical Architecture on Base44

#### What Lives Where (Base44 Managed vs. Hand-Written by Rocky)

```
soil-grower-game/
├── base44/
│   ├── config.jsonc                         # visibility: "public", site.outputDirectory: "./dist"
│   ├── entities/
│   │   ├── task.jsonc                       # Cloud save checkpoints & shareable sanctuary seeds
│   │   ├── board.jsonc                      # Asynchronous co-op spore/mulch pool
│   │   └── document.jsonc                   # Configurable real-grower telemetry feed
│   ├── functions/
│   │   └── process-order/
│   │       └── entry.ts                     # Checkpoint validation via base44.asServiceRole
│   └── actors/
│       └── BoardRoom/
│           └── entry.ts                     # Live 10Hz room presence & spore broadcast
├── public/
│   └── audio/                               # Original synthesized ambient loops (MP3/WAV <= 1.5 MB)
├── src/
│   ├── api/
│   │   └── base44Client.ts                  # Pre-configured @base44/sdk client
│   ├── simulation/
│   │   ├── growerTelemetry.ts               # Modeled + Live grower telemetry interface
│   │   ├── rhizosphereEngine.ts             # 4Hz O/A/B horizon, F:B, hyphal & storm physics
│   │   └── cooperativeLedger.ts             # Tripartite compounding patronage calculator
│   ├── storage/
│   │   └── localPersistence.ts              # try/catch localStorage + IndexedDB + Entity sync
│   ├── canvas/
│   │   └── sanctuaryView.tsx                # Single reusable 60fps HTML5 <canvas> renderer
│   ├── audio/
│   │   └── soundEngine.ts                   # Web Audio API procedural soil/rain/hyphal audio
│   ├── components/
│   │   ├── toolControls.tsx                 # Tend / Diagnose / Direct responsive controls
│   │   ├── cooperativeView.tsx              # Live tripartite stake meters & split slider
│   │   ├── roomPanel.tsx                    # Accountless async co-op spore sharing & leaderboard
│   │   └── handbookModal.tsx                # Earth soil science + franchise lore handbook
│   └── App.tsx                              # Zero-menu instant entry orchestrator
├── package.json
└── vite.config.ts
```

#### Entity Schemas and Anonymous-Safe Row Level Security (RLS)
Per M's verification of Base44's RLS engine, any rule referencing `{{user.*}}` returns HTTP 403 to unauthenticated contest players. To pass Base44's automated **Security Scan** for Launchpad while remaining 100% accountless (`Public (no login)`):

1. **Sanctuary Checkpoints (`base44/entities/task.jsonc`):**
   * Stores compact validated summaries (`< 15 KB` per record, well under the 100 KB cap) keyed by `client_uuid` and `share_code`.
   * **RLS:** `"read": true, "create": true, "update": false, "delete": false` (with validated updates routed through the backend function using `base44.asServiceRole` so anonymous clients cannot overwrite or delete other players' checkpoints).
2. **Cooperative Commons Pool (`base44/entities/board.jsonc`):**
   * Stores shared room pools (`room_code`, `total_credits`, `shared_spore_packets`, `average_fb_ratio`, `player_count`, `recent_contributions`).
   * **RLS:** `"read": true, "create": true, "update": true, "delete": false`. Connected live via `base44.entities.Board.subscribe(cb)`.
3. **Grower Field Telemetry (`base44/entities/document.jsonc`):**
   * Holds baseline and live Soil Grower field operation snapshots for `Grower_Telemetry_Source`.
   * **RLS:** `"read": true, "create": { "user_condition": { "role": "admin" } }, "update": { "user_condition": { "role": "admin" } }, "delete": { "user_condition": { "role": "admin" } }`. Anonymous players have full read access; only George (admin) can push new field telemetry logs.

#### Dual-Layer Accountless Save Strategy
1. **Layer 1 (Fast Local Storage):**
   * On first load, `localPersistence.ts` generates a `sanctuaryUuid = crypto.randomUUID()` and stores it in `try/catch`-wrapped `localStorage`.
   * Every 5 seconds (and on `visibilitychange`), the full 16-column x 4-horizon soil grid and cooperative ledger state save asynchronously to `IndexedDB` (`soil_grower_idb_v1`), requesting durable storage via `navigator.storage.persist()`.
2. **Layer 2 (Shareable Seed + Zero-Credit Base44 Entity Sync):**
   * At the end of every weather pulse (or when the player clicks **"Share Sanctuary / Sync Co-op"**), the client compresses the sanctuary state into a Base64 seed (`?seed=...`) and writes a checkpoint via `base44.functions.invoke()`.
   * Players can move between desktop and mobile without an account simply by copying their 6-character **Sanctuary Seed Code** (e.g., `OAK-7F4`) or opening the share URL.

---

### 3.5 Asset Plan and Provenance Protocol

The contest terms disqualify any submission containing unlicensed third-party intellectual property. Every visual, audio, and font asset in *Soil Grower* will be **100% original procedural code, hand-authored SVG, or generated from George's licensed tools with a full provenance log** stored in `ASSET_PROVENANCE_LOG.md`.

| Asset Class | Quantity & Format | Generation / Authoring Source | Base44 Storage & Delivery Path | License & Provenance Status |
|:---|:---|:---|:---|:---|
| **Vertical Soil Horizons (O, A, B, C), Water Flow & Hyphal Graph** | Procedural 2D Canvas Rendering + Cellular Automata particles | Hand-authored TypeScript HTML5 `<canvas>` rendering engine by Rocky (`src/canvas/sanctuaryView.tsx`). | Bundled directly in compiled JS (`dist/`), `< 80 KB` gzipped. | **100% Original Work** owned by George Steward / Soil Grower LLC. |
| **Canopy Trees & Companion Guild Sprites (3 Succession Tiers x 3 Climax Trees: Live Oak, Douglas-fir, Pecan)** | 2 Sprite Atlases (`PNG`, strictly `<= 1024x1024 px` each, `< 400 KB` total) | Generated only after spec approval via George's authenticated generation pipeline or hand-authored vector-to-sprite rasterization; every prompt, seed, and timestamp logged. | Committed directly in `src/assets/sprites/` via CLI/GitHub to bypass the Base44 Editor File Library `1024x1024` auto-downscaler and guarantee inclusion in `npx base44 eject`. | **100% Original Work** with full prompt/seed provenance log. |
| **Tool Cursor & Interface Elements (AirSpade, Woodchip Mulch, Compost Tea, Profile View, Co-op Stakes)** | 18 SVG Elements (`< 25 KB` total) | Hand-authored React SVG components by Rocky (`src/components/icons/`) plus `lucide-react` (ISC License). | Compiled directly into the Vite bundle (0 extra HTTP requests). | **100% Original SVG + ISC Open Source License** (`lucide-react`). |
| **Tactile Audio Feedback (AirSpade hiss, woodchip crunch, rain percolation, hyphal chime)** | Procedural Web Audio API Engine (`src/audio/soundEngine.ts`) | 100% code-synthesized in browser using Web Audio API noise filters for air-spade and rain plus harmonic oscillators for mycorrhizal connection chimes. | Bundled in code (`< 12 KB`), zero external audio file latency. | **100% Original Code** owned by George Steward. |
| **Sanctuary Audio Loop** | 1 Audio Loop (`MP3`/`WAV`, `<= 1.2 MB`) | Generated original acoustic audio loop (or synthesized generative wind/birdsong via Web Audio API). | Served from `public/audio/` with mute/volume toggle on screen. | **100% Original Work** with provenance record. |
| **Web Font** | System UI & Open Font Stack (`system-ui`, `monospace`) | Native browser font stack plus SIL Open Font License web font if needed. | Zero external license encumbrance. | **SIL Open Font License / Native System Stack** (permits commercial and promotional distribution). |

---

### 3.6 Four-Week Build Schedule and Cut List

**Schedule Window:** 2026-11-05 to 2026-12-03 at 17:59 Central (23:59 UTC).  
**Gate Rule:** Week 1 coding starts immediately upon George's approval of this plan (due Wednesday 2026-11-12 at 18:00 Central).

#### Week-by-Week Playable Milestone Table

| Week & Dates (Central) | Primary Engineering & Design Tasks | Playable Weekly Milestone & Verification Gate |
|:---|:---|:---|
| **Week 1: Core Subsurface Loop & Telemetry Interface** (Approve by Nov 12 -> Build Nov 12 to Nov 18) | 1. Upgrade Base44 workspace to **Builder** tier ($20/mo `.edu` or $40/mo annual).<br>2. Scaffold project via `npx base44 create soil-grower -p ./soil-grower -t backend-and-client` and set `visibility: "public"`.<br>3. Build `growerTelemetry.ts` (`modeledGrowerSource`) and `rhizosphereEngine.ts` (16x4 O/A/B/C grid, bulk density, root collar burial, F:B succession math, mycorrhizal graph, phosphorus unlocking).<br>4. Build `sanctuaryView.tsx` with instant zero-menu onboarding and primary **Tend** tools (AirSpade, Woodchip Mulch, Fungal Inoculate) + **Diagnose** horizon view. | **Playable Milestone 1 (Nov 18):** Opens in `< 5 seconds` in browser. Player can air-spade a compacted root flare, apply woodchips and fungal inoculum, watch F:B climb from `0.15` to `3.0+`, see golden mycorrhizal hyphae unlock B-horizon phosphorus, and survive a simulated storm pulse. |
| **Week 2: Compounding Cooperative & Persistence** (Nov 19 to Nov 25) | 1. Implement `cooperativeLedger.ts`: live tripartite split (Soil Grower, Land Steward, Player Patronage), split slider, tool/plot/multiplier compounding upgrades, and **Direct** crew shifts.<br>2. Build `localPersistence.ts`: `try/catch` `localStorage` + `IndexedDB` auto-save + Base64 URL seed export/import.<br>3. Push Entity schemas via `npx base44 entities push -y` and deploy checkpoint validation function via `npx base44 functions deploy`. | **Playable Milestone 2 (Nov 25):** Full single-player and asynchronous co-op loop closes. Player progress persists across tab reloads and Incognito mode; Cooperative Ledger visibly compounds tool power, plot width, and patronage multiplier; 6-character seed transfers state across desktop and mobile. |
| **Week 3: Asynchronous Co-op, Audio & Mobile Polish** (Nov 26 to Nov 30) | 1. Deploy `BoardRoom` Actor (`npx base44 actors deploy`) and wire `roomPanel.tsx` so players can send/receive additive Spore & Mulch Care Packages across a shared 12-sanctuary co-op room.<br>2. Connect `soundEngine.ts` (Web Audio API tactile feedback for air-spade, rain percolation, and hyphal links), `handbookModal.tsx` (soil science + Mars franchise horizon lore), and sprite atlases (`<= 1024x1024`).<br>3. Mobile viewport (`375x667` and `390x844`) and 4 GB Chromebook 60 fps audit. | **Playable Milestone 3 (Nov 30):** Complete feature-locked candidate deployed on `https://<slug>.base44.app`. Zero console errors, `< 5 MB` initial payload, 60 fps on desktop and mobile touch, anonymous Entity/Actor sync verified from an unauthenticated browser profile. |
| **Week 4: Security Scan, Launchpad & Final Submission** (Dec 1 to Dec 3, 17:59 Central) | 1. Run Base44 automated **Security Scan** and verify all RLS rules pass with zero `{{user.*}}` anonymous 403 errors.<br>2. Publish to **Base44 Launchpad** by **Dec 1** (locking tagline, description, and categories so the listing is not pulled back into moderation during voting).<br>3. Capture the 90-second gameplay video and screenshots.<br>4. Submit official entry form at `nitropay.com/base44webgame/` by **Wednesday Dec 2 at 18:00 Central** (24-hour buffer before the Dec 3 17:59 Central hard cutoff). | **Final Milestone (Dec 2, 24h early):** Live on default `*.base44.app` URL (`Public (no login)`), verified active on Base44 Launchpad, and confirmation receipt logged from `nitropay.com/base44webgame/`. |

#### Cut List (In Exact Drop Order if a Week Slips)
To protect the one-third Technical Execution score and one-third Gameplay Quality score, any schedule slip triggers cuts in this exact order, decided now rather than on December 1:

1. **Cut First (Zero Core Impact): Live WebSocket Actor (`BoardRoom`) Cursor Presence.** If Actor hibernation tuning takes more than 1 day in Week 3, drop live multi-cursor room presence and run asynchronous co-op 100% through `base44.entities.Board.subscribe()` (costs 0 integration credits and still delivers live spore sharing).
2. **Cut Second (Cosmetic Only): Surface Crew Sprites for `Direct` Verb.** Keep Cooperative Crew Shifts as active mechanical rate multipliers and periodic tending pulses on the soil grid without drawing walk-cycle sprites on the surface layer.
3. **Cut Third (Asset Count, Not Depth): Secondary Tree Options.** Ship with the flagship **Live Oak** (3 detailed growth tiers + root architecture) plus **Douglas-fir** and **Pecan** saplings rather than expanding the plant sprite sheet.
4. **Never Cut (Protected Core):** Sub-10-second zero-menu onboarding; vertical O/A/B soil horizon + root flare AirSpade decompaction; F:B ratio succession; mycorrhizal phosphorus graph; storm infiltration vs. runoff physics; compounding tripartite Cooperative Ledger; and `Grower_Telemetry_Source`.

---

### 3.7 Submission Package and 90-Second Demo Script

#### Two-Track Submission Plan
1. **Track 1: Main Judging Panel ($50,000 Prize Pool)**
   * **Portal:** Submit via the official Typeform linked at `https://nitropay.com/base44webgame/`.
   * **Submitted URL:** Default `https://<slug>.base44.app` with App Visibility set to `Public (no login)` (`npx base44 visibility public`). Never attach a custom domain before Winners Announced + 90 days.
   * **Audit Verification:** Maintain clean git/CLI commit history and `ASSET_PROVENANCE_LOG.md` inside the repository in case Overwolf requests project access and edit history verification under Contest Terms.
2. **Track 2: Base44 Launchpad Community Vote ($15,000 Prize Pool)**
   * **Portal:** Submit separately inside the Base44 Dashboard -> **Launchpad** (`docs.base44.com/promoting-your-app/submitting-to-launchpad`).
   * **Security Scan Gate:** Run and pass Base44's automated **Security Scan**.
   * **Moderation Lock Rule:** Lock the app's **tagline, description, and category tags** before publishing to Launchpad. Per Base44 documentation, editing text metadata after publication pulls the app out of the public Launchpad feed back into moderation review, whereas updating screenshots and the logo does not trigger re-review.
   * **Anti-Manipulation Rule:** One upvote per signed-in natural person per day. Zero vote-buying, zero bot accounts, zero in-game rewards gated on voting (any incentivized voting risks disqualifying the game from both tracks).
3. **90-Day URL Longevity Plan**
   * Winners are announced on or about **2026-12-10**; the URL must remain live, free, and publicly playable with no login through at least **2027-03-10** (90 days).
   * Because the architecture uses zero runtime AI credits (`InvokeLLM` and `aiGateway` are never called by players) and relies on client-side `<canvas>` + zero-credit Entity CRUD, the game can handle unlimited judge and public traffic on the `*.base44.app` subdomain without exhausting integration credit quotas. Keep the Builder plan active ($20/month `.edu`) through March 2027 so backend validation and clone-badge hiding remain active throughout the 90-day window.

#### 90-Second Demo Video Script (Showing Gameplay, Not Describing It)

| Segment | Visual on Screen (Live Browser Capture on `*.base44.app`) | Spoken / Text Script |
|:---|:---|:---|
| **0:00 to 0:10** | Browser tab loads `soil-grower.base44.app` with no login screen. A crusted urban clay lot (`Bulk Density: 1.68 g/cm3`, `F:B Ratio: 0.15`) appears in cross-section beneath a stressed Live Oak with soil buried high up its trunk. | *"Every farm game treats soil as a flat timer tile. In Soil Grower, you steward the living underground."* |
| **0:10 to 0:28** | Player selects the **AirSpade** (`Tend` verb) and sweeps across the buried root collar and compacted B-horizon pan. Gray hardpan shatters into porous dark channels (`Bulk Density -> 1.18 g/cm3`). Player layers 4 inches of arborist woodchips across the O-horizon and drops fungal compost tea. | *"Clear buried root flares with an AirSpade, decompact hardpan, and lay arborist woodchips. See the Fungal-to-Bacterial ratio shift from bacterial fill toward forest fungi."* |
| **0:28 to 0:48** | Player switches to the **Diagnose** view. Active mycorrhizal hyphae sprout from the oak's feeder roots, bridging across porous channels to locked purple phosphorus pockets in the B-horizon. Phosphorus converts and flows back into the canopy; understory guilds sprout on the surface as `F:B` crosses `2.4`. | *"Canopy trees pump carbon into mycorrhizal networks, unlocking mineral-bound phosphorus and feeding companion guilds without a drop of synthetic fertilizer."* |
| **0:48 to 1:05** | A **Flash Storm Pulse** hits. On the un-restored right edge, rain sheets off compacted clay as muddy runoff. Across the restored sanctuary, rain percolates through the woodchip mulch into the deep B-horizon moisture bank, followed by a **Summer Heat Dome** where mulched soil stays `74 F` while bare clay spikes past `104 F`. | *"When storms and heat domes hit, bare clay erodes while decompacted, glomalin-rich soil banks deep water to carry the canopy through drought."* |
| **1:05 to 1:22** | View focuses on the **Tripartite Cooperative Ledger** on the right panel. As canopy biomass rises, **Carbon Biomass Credits** distribute across the **Soil Grower Stake** (unlocking the Fungal Compost System), **Land Steward Stake** (expanding the Critical Root Zone parcel), and **Player Patronage Stake** (`1.85x` compounding dividend). Player clicks **Send Spore Care Package** in the co-op panel. | *"Built as a compounding cooperative: the Soil Grower, the Land Steward, and the Players each hold an active stake that grows stronger with every tended root zone and shared spore."* |
| **1:22 to 1:30** | Wide shot of the thriving multi-layered sanctuary above and glowing mycorrhizal web below. URL `soil-grower.base44.app` and *"Play Free in Browser / Zero Login"* appear cleanly on screen. | *"Soil Grower. Restore the rhizosphere. Compound the commons. Play instantly in your browser on Base44."* |
