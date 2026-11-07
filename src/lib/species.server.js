/**
 * Subsurface Soil Food Web cards, server handler.
 * Returns the subterranean functional guilds (AMF arbuscules, tardigrades, nematodes,
 * pre-charged biochar + PGPR bacteria, and earthworm macropore engineers).
 */

import { fieldGuideCards } from "@/lib/species";

export async function getSpeciesCards({ bioregion = "rogue_valley", season = 1 }) {
  const all = fieldGuideCards(bioregion);
  return {
    cards: all,
    source: "subsurface_atlas",
    season,
    fetched_at: new Date().toISOString(),
  };
}
