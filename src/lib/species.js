/**
 * Subsurface Soil Food Web & Symbiosis Dossier Cards.
 * Maps each subterranean functional guild to its live simulation metrics and educational mechanism.
 */

export const GROUP_MECHANIC = {
  amf: {
    label: "Mycorrhizal Symbiosis",
    functionTitle: "AMF Arbuscules",
    sentence:
      "Hyphae penetrate root cortical cells to form tree-like arbuscules, trading mined phosphorus and water for liquid-carbon root sugars while secreting glomalin glue.",
    tacticHint: "Boosted by Kelp & Humic Biostimulant and Pre-Charged Biochar. Harmed by Tillage and Synthetic N-P-K.",
    metric: (soil) =>
      `Arbuscules ${Math.round(soil.biology.arbusculeDensity ?? 18)}% | Glomalin ${Math.round(
        (soil.biology.glomalinIndex ?? 0.2) * 100
      )}%`,
  },
  tardigrade: {
    label: "Micro-Fauna",
    functionTitle: "Soil Tardigrades",
    sentence:
      "Eight-legged water bears traverse thin water menisci on moss and humus. Under salt shock or drought they curl into dormant tuns until humic hydration returns.",
    tacticHint: "Woken from tuns by Humic Soak, Aerated Compost Tea, and Biochar micropore moisture.",
    metric: (soil) =>
      `${soil.biology.tardigradeCount ?? 6}/cm³ (${
        (soil.biology.tardigradeState || "tun") === "active" ? "Active in pore film" : "Dormant tun"
      })`,
  },
  nematode: {
    label: "Microbial Loop",
    functionTitle: "Beneficial Nematodes",
    sentence:
      "Microscopic roundworms swim through pore water channels to graze rhizosphere bacteria and release plant-available ammonium right at the root tips.",
    tacticHint: "Multiplied by Aerated Compost Tea and Kelp root exudates.",
    metric: (soil) =>
      `${soil.biology.nematodeCount ?? 14}/cm³ | Bacteria ${
        soil.biology.rhizosphereBacteriaMgPerKg ?? 210
      } mg/kg`,
  },
  biochar: {
    label: "Carbon Architecture",
    functionTitle: "Biochar & PGPR Reef",
    sentence:
      "Porous honeycomb carbon lattices act as permanent microbial condominiums that hold water, trap cations, and shelter AMF hyphae from compaction.",
    tacticHint: "Built permanently in the A horizon by Pre-Charged Biochar.",
    metric: (soil) =>
      `Biochar ${Math.round((soil.biology.biocharCarbonFraction ?? 0.04) * 100)}% | F:B ${soil.biology.fungalToBacterialRatio.toFixed(
        2
      )}`,
  },
  earthworm: {
    label: "Macropore Engineer",
    functionTitle: "Earthworm Burrows",
    sentence:
      "Nightcrawlers pull surface mulch down into vertical channels lined with vermicast, letting cloudbursts infiltrate deep into the B horizon moisture bank.",
    tacticHint: "Recruited by Compost & Woodchip Mulch and preserved by zero tillage.",
    metric: (soil) =>
      `${soil.biology.earthwormActivityIndex} burrows/m² | Infil ${soil.water.infiltrationRateMmPerHr} mm/hr`,
  },
  fungus: {
    label: "Mycorrhizal Symbiosis",
    functionTitle: "AMF Arbuscules",
    sentence:
      "Hyphae penetrate root cortical cells to form tree-like arbuscules, trading mined phosphorus and water for liquid-carbon root sugars.",
    tacticHint: "Boosted by Kelp & Humic Biostimulant and Aerated Compost Tea.",
    metric: (soil) => `F:B ${soil.biology.fungalToBacterialRatio.toFixed(2)}`,
  },
  plant: {
    label: "Rhizosphere Pump",
    functionTitle: "Root Exudate Halo",
    sentence:
      "Roots pump liquid-carbon sugars and organic acids into the rhizosphere to feed bacteria and invite mycorrhizal colonization.",
    tacticHint: "Stimulated by Kelp & Humic Biostimulant; shut off by Synthetic N-P-K salts.",
    metric: (soil) => `${Math.round(soil.plants[0]?.rootDepthMm || 0)} mm root depth`,
  },
  invertebrate: {
    label: "Micro-Fauna",
    functionTitle: "Tardigrades & Worms",
    sentence:
      "Water bears, nematodes, and nightcrawlers keep micropores and macropores cycling water and minerals.",
    tacticHint: "Woken by Humic Soak, Compost Tea, and Woodchip Mulch.",
    metric: (soil) => `${soil.biology.earthwormActivityIndex} burrows/m²`,
  },
};

export const SUBSURFACE_DECK = [
  {
    id: "subsurface-amf",
    group: "amf",
    common_name: "Arbuscular Mycorrhizal Fungi (AMF)",
    scientific_name: "Rhizophagus irregularis",
    specimen_type: "amf",
    credit: "Subsurface Rhizosphere Atlas : 400x Darkfield",
  },
  {
    id: "subsurface-tardigrade",
    group: "tardigrade",
    common_name: "Soil & Moss Water Bear",
    scientific_name: "Macrobiotus hufelandi",
    specimen_type: "tardigrade",
    credit: "Subsurface Pore-Film Atlas : 200x Phase Contrast",
  },
  {
    id: "subsurface-nematode",
    group: "nematode",
    common_name: "Bacterial-Feeding Nematode",
    scientific_name: "Acrobeloides buetschlii",
    specimen_type: "nematode",
    credit: "Subsurface Microbial Loop Atlas : 300x Darkfield",
  },
  {
    id: "subsurface-biochar",
    group: "biochar",
    common_name: "Pre-Charged Biochar & PGPR Guild",
    scientific_name: "Pyrogenic Carbon + Pseudomonas putida",
    specimen_type: "biochar",
    credit: "Subsurface Micro-Habitat Atlas : 500x Epifluorescence",
  },
  {
    id: "subsurface-earthworm",
    group: "earthworm",
    common_name: "Deep-Burrowing Nightcrawler",
    scientific_name: "Lumbricus terrestris",
    specimen_type: "earthworm",
    credit: "Subsurface Macropore Atlas : Cross-Section",
  },
];

export function fieldGuideCards(bioregion = "rogue_valley") {
  return SUBSURFACE_DECK.map((c) => ({
    ...c,
    id: `${c.id}-${bioregion}`,
    source: "subsurface_atlas",
  }));
}

export function groupMechanic(group, soil) {
  const m = GROUP_MECHANIC[group] || GROUP_MECHANIC.amf;
  return { ...m, metric: m.metric(soil) };
}
