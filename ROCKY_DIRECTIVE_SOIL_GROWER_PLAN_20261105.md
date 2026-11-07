# ROCKY DIRECTIVE: Soil Grower game, platform study and master plan

Task id: ROCKY-SOILGAME-PLAN-20261105
Due back: Wednesday 2026-11-12, 6:00 PM Central (plan only, no build)
Owner: Rocky. Base44 is your platform. George approves the spec before a single asset is generated.

## Read first, in this order

1. `ARBORETUM/Active/Soil_Grower_Game/CONTEST_BRIEF_20261105.md` — verified rules, dates, judging weights, IP terms.
2. `ARBORETUM/Active/Soil_Grower_Game/CONCEPT_SEED_20261105.md` — George's intent and the four decisions he owes.
3. Base44's own documentation for game builds, assets, state, hosting and tier limits.

## Phase 1: platform study, before design

You have the Base44 skill set. Prove what the platform actually does rather than what the landing page claims:

- What a browser game on Base44 can do for persistence with no login: local storage, URL seed state, export and import, anything server-side without accounts.
- Performance ceiling: how much runs client-side, frame budget, what breaks at mobile sizes.
- Asset handling: how generated images and audio are stored and served, size limits, and whether assets survive a project export.
- Hosting and longevity: what the free tier allows, what paid tiers add, and whether the submitted URL stays live for the required 90 days after the winner announcement.
- The build loop: what a prompt produces, what has to be hand-edited, and where agents can and cannot act.

Report this as a capability table with limits, and mark anything unverified as UNVERIFIED rather than plausible.

## Phase 2: three concepts, one recommendation

From the seed, produce three distinct lock-in options at different scope:

- **A, small and complete.** One verb, one screen, a loop that closes in five minutes and a season summary that shows the cooperative split.
- **B, medium.** Sanctuary layout plus tending plus a cooperative ledger the player manages.
- **C, ambitious.** The full idea with multiple sites, seasons, and a visible economy.

For each: the moment-to-moment verb, what the player sees in the first thirty seconds, what the loop rewards, what it costs to build, and what breaks first. Then recommend one and say plainly why the others lose under a four-week clock and three equally weighted judging criteria.

## Phase 3: the master spec, for the recommended option

- **Game design document.** Core loop, progression, economy in game currency only, failure states, session length, mobile behavior.
- **Cooperative mechanic, honest version.** How the soil grower, the landowner and the player each hold a share in game currency, and how that surfaces. No real-money framing, no wagering language. The contest forbids it and the later commercial version must not be pre-committed by a contest build.
- **Technical architecture.** What lives on Base44 versus what must be hand-written, state model, save strategy without accounts, asset pipeline.
- **Asset plan.** Every asset class needed, generation source, licence status, and a provenance log. All original or fully licensed; the terms allow disqualification for unlicensed third-party material.
- **Four-week schedule.** Week by week, with a milestone that is playable at the end of each. Include the cut list: what gets dropped first if a week slips, decided now rather than in a panic on December 1.
- **Submission package.** Both tracks, the Typeform for the main competition, the Launchpad entry, the required URL longevity, and a 90 second demo script that shows the game working rather than describing it.

## Constraints

- **Plan only.** No building, no Base44 project creation, no asset generation, no credits spent beyond platform study, until George approves the spec.
- Free to play, no login, no paywall, no in-game purchase. These are contest rules, not preferences.
- No gambling, no wagering, no real-world value transfer.
- Assume children will play: no account, no data collection, no age gate that collects information.
- Four weeks is the real constraint. A finished small loop beats an unfinished large one, and the judges score polish as a third of the total.

## Output

`ROCKY_SOILGAME_PLAN_20261112.md` in the same project folder, ordered as phases 1 to 3, with the capability table and the three-concept comparison before the spec. Lead with the recommendation and the single decision George has to make.
