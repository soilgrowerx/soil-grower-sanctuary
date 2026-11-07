# Addendum: George's decisions and M's findings

Date: 2026-11-05. Supersedes the open questions in `ROCKY_DIRECTIVE_SOIL_GROWER_PLAN_20261105.md`.
Read after the contest brief, the concept seed, and `M_RESPONSE_SOILGAME_RESEARCH_20261108`.

## George's decisions

**The cooperative is a mechanic, not flavor.** It compounds: it gets stronger with usage and with cooperation. Design it as a system that rewards repeated, cooperative tending with a visibly larger shared stake, not a season-end summary line.

**Real grower data is the intent.** A modeled operation is acceptable where live data does not exist, but the target is numbers a working grower would recognize and eventually live data from real operations. Design for the substitution: a data interface that starts modeled and can accept a real source later without a redesign.

**The long arc is a franchise, not a single game.** George's framing: the game spawns the regeneration ecosystem, and a book called Soil Grower runs alongside it, futuristic in the register of Star Wars or Project Hail Mary, with soil growers on Mars as the horizon. Treat the game as the first artifact of an IP that can carry a novel, not as a standalone product. Do not build the novel into the game. Build the game so the world is coherent enough to write from.

## What M found that changes the design

**The real-money version cannot exist as a game.** Pooling player capital or labor with producer and landowner operations for financial return meets the investment-contract test under *SEC v. W.J. Howey Co.* and the 2024 *Dufoe v. DraftKings* line, and touches money-transmission rules. Across Steam, mobile and web3 registries, no shipped game splits real proceeds with retail players. This is a legal boundary, not a taste question.

Consequence for the build: the cooperative economy runs in game currency, in full, with real ecological logic behind it. Any real proceeds route offline through Soil Grower LLC or a Subchapter T cooperative and grant vehicles, never through the game.

**Contest operational constraints M verified:**
- The entry must be public with no login on a default `*.base44.app` URL. A custom domain disqualifies it.
- Launchpad listing requires passing Base44's automated security scan.
- Anonymous guests can read and write Entities only when RLS is set to allow all users, and any rule referencing `{{user.*}}` returns 403 to anonymous callers.
- Base44 recommends the hybrid pattern: high-frequency state in IndexedDB and localStorage keyed by a client-generated UUID, validated checkpoints to Entities.
- Entity CRUD costs zero integration credits on every plan, including free. `list()` and `filter()` cap at 5,000 records per request.
- Real-time ceiling is roughly 10 to 20 Hz over WebSocket actors.

**The five unfilled pillars M identified**, which is where the design should spend its novelty budget: vertical soil profile and physical decompaction by horizon, fungal to bacterial ratio as the succession engine rather than an XP bar, mycorrhizal network as a real graph that moves carbon and unlocks phosphorus, infiltration versus runoff physics under storm events, and accountless asynchronous root-zone cooperation.

## Two answers to questions George asked

**Core verb.** The one action the player performs most often, the thing their hands do. Not the theme, not the goal. In a farming sim it is plant and water. In a builder it is place and rotate. For Soil Grower the candidates are tend (amend, mulch, inoculate), diagnose (read the profile, find compaction or a buried root flare), or direct (assign crew and equipment). Pick one as the primary and let the others be secondary.

**Sandbox versus seasons.** A sandbox has no clock: the player builds freely, nothing resets, progress accumulates indefinitely. Seasons impose a cycle: a fixed window, a harvest or assessment at the end, and either a reset or a carried-forward bonus. George's compounding cooperative argues against resets, so the likely answer is a persistent sandbox with long-horizon growth and optional seasonal events that add pressure without erasing progress. Confirm rather than assume.

## What Rocky should do with this

Update the plan so that the recommended option reflects these decisions, states the legal boundary in the design itself, and treats the book and franchise as context for world coherence rather than scope. Keep the plan-only gate: no Base44 project, no asset generation, no credits, until George approves.
