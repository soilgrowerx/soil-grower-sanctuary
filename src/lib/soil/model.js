/**
 * Soil Grower: Sanctuary Zero
 * Unified subsurface soil food web, rhizosphere symbiosis, and biostimulant simulation core.
 * Water in always equals water infiltrated + water shed + water retained at surface.
 */

export const SEASON_MS = 90000;
export const HORIZON_ORDER = ["O", "A", "E", "B", "C"];

export const BIOREGIONS = {
  rogue_valley: {
    bioregionId: "rogue_valley",
    bioregionName: "Rogue Valley, OR",
    shortName: "Rogue Valley",
    latitude: 42.3265,
    longitude: -122.8756,
    climateZone: "USDA Zone 8b, Mediterranean Warm Summer",
    soilSeries: "Medford / Kubli Clay Loam",
  },
  willamette_valley: {
    bioregionId: "willamette_valley",
    bioregionName: "Willamette Valley, OR",
    shortName: "Willamette",
    latitude: 44.5646,
    longitude: -123.262,
    climateZone: "USDA Zone 8b, Marine West Coast",
    soilSeries: "Jory Silty Clay Loam",
  },
  blackland_prairie: {
    bioregionId: "blackland_prairie",
    bioregionName: "Blackland Prairie, TX",
    shortName: "Blackland",
    latitude: 30.2672,
    longitude: -97.7431,
    climateZone: "USDA Zone 8b, Subtropical Subhumid",
    soilSeries: "Houston Black / Austin Silty Clay",
  },
  sandhills_nc: {
    bioregionId: "sandhills_nc",
    bioregionName: "Lumber River & Sandhills, NC",
    shortName: "Sandhills",
    latitude: 34.6282,
    longitude: -79.0086,
    climateZone: "USDA Zone 8a, Humid Subtropical",
    soilSeries: "Norfolk / Wagram Loamy Sand",
  },
};

const round = (n, d = 2) => Number(n.toFixed(d));
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function sumHorizonCarbonKg(pool) {
  return round(pool.O + pool.A + pool.E + pool.B + pool.C, 3);
}

export function createDefaultSoilState(bioregionId = "rogue_valley", seed = 42) {
  const horizons = {
    O: {
      type: "O",
      name: "Organic mulch & moss film",
      depthMm: 6,
      organicMatterPercent: 65,
      aggregateStability: 0.22,
      bulkDensityGcm3: 0.35,
      waterHoldingCapacityMm: 10,
      currentWaterMm: 2,
      saturatedConductivityMmPerHr: 120,
    },
    A: {
      type: "A",
      name: "Rhizosphere & biochar topsoil",
      depthMm: 145,
      organicMatterPercent: 1.9,
      aggregateStability: 0.22,
      bulkDensityGcm3: 1.6,
      waterHoldingCapacityMm: 46,
      currentWaterMm: 18,
      saturatedConductivityMmPerHr: 9,
    },
    E: {
      type: "E",
      name: "Eluviated mineral exchange zone",
      depthMm: 95,
      organicMatterPercent: 0.8,
      aggregateStability: 0.25,
      bulkDensityGcm3: 1.64,
      waterHoldingCapacityMm: 28,
      currentWaterMm: 12,
      saturatedConductivityMmPerHr: 12,
    },
    B: {
      type: "B",
      name: "Deep clay & mineral moisture bank",
      depthMm: 380,
      organicMatterPercent: 0.4,
      aggregateStability: 0.5,
      bulkDensityGcm3: 1.55,
      waterHoldingCapacityMm: 140,
      currentWaterMm: 65,
      saturatedConductivityMmPerHr: 4.5,
    },
    C: {
      type: "C",
      name: "Weathered parent bedrock matrix",
      depthMm: 500,
      organicMatterPercent: 0.1,
      aggregateStability: 0.85,
      bulkDensityGcm3: 1.8,
      waterHoldingCapacityMm: 90,
      currentWaterMm: 40,
      saturatedConductivityMmPerHr: 2,
    },
  };

  const carbonPool = { O: 1.2, A: 10.5, E: 2.1, B: 5.8, C: 1.0 };
  const initialTotalCarbonKg = sumHorizonCarbonKg(carbonPool);

  const plants = [
    {
      id: "nurse-tree-1",
      species: "climax_tree",
      commonName: "Mother Oak",
      ageDays: 1200,
      biomassKg: 45,
      carbonAllocationKgPerDay: 0.85,
      rootDepthMm: 480,
      mycorrhizalColonization: 0.35,
      arbusculeDensity: 0.28,
      rootExudateFlux: 0.32,
      isAlive: true,
      donorPriority: 0.9,
      columnIndex: 4,
    },
    {
      id: "seedling-oak-2",
      species: "climax_tree",
      commonName: "Understory Sapling",
      ageDays: 45,
      biomassKg: 1.2,
      carbonAllocationKgPerDay: 0.08,
      rootDepthMm: 165,
      mycorrhizalColonization: 0.22,
      arbusculeDensity: 0.18,
      rootExudateFlux: 0.24,
      isAlive: true,
      donorPriority: 0.15,
      columnIndex: 11,
    },
    {
      id: "forb-guild-3",
      species: "nitrogen_fixer",
      commonName: "Mycorrhizal Lupine",
      ageDays: 60,
      biomassKg: 0.9,
      carbonAllocationKgPerDay: 0.12,
      rootDepthMm: 220,
      mycorrhizalColonization: 0.3,
      arbusculeDensity: 0.25,
      rootExudateFlux: 0.38,
      isAlive: true,
      donorPriority: 0.45,
      columnIndex: 8,
    },
  ];

  const hyphalLinks = [
    {
      id: "link-1-2",
      plantAId: "nurse-tree-1",
      plantBId: "seedling-oak-2",
      conductance: 0.55,
      lengthM: 2.4,
      isActive: true,
      cumulativeCarbonTransferredKg: 0,
      phosphorusDeliveredMg: 12,
    },
    {
      id: "link-1-3",
      plantAId: "nurse-tree-1",
      plantBId: "forb-guild-3",
      conductance: 0.48,
      lengthM: 1.6,
      isActive: true,
      cumulativeCarbonTransferredKg: 0,
      phosphorusDeliveredMg: 9,
    },
  ];

  return {
    site: { ...(BIOREGIONS[bioregionId] || BIOREGIONS.rogue_valley) },
    horizons,
    biology: {
      fungalToBacterialRatio: 0.22,
      mycorrhizalColonizationPercent: 14,
      arbusculeDensity: 18,
      glomalinIndex: 0.2,
      rootExudateFlux: 0.26,
      tardigradeCount: 6,
      tardigradeState: "tun",
      nematodeCount: 14,
      protozoaCount: 18,
      rhizosphereBacteriaMgPerKg: 210,
      earthwormActivityIndex: 6,
      microbialBiomassCarbonMgPerKg: 210,
      activeMyceliumLengthM: 140,
      biocharCarbonFraction: 0.04,
    },
    water: {
      infiltrationRateMmPerHr: 9,
      totalWaterInMm: 0,
      totalInfiltratedMm: 0,
      runoffVolumeMm: 0,
      topsoilExportedKg: 0,
      crustThicknessMm: 2.4,
      isCrusted: true,
      deepPercolationMm: 0,
    },
    carbon: {
      poolByHorizonKg: carbonPool,
      initialTotalCarbonKg,
      totalCarbonGainedKg: 0,
      fluxToAtmosphereKg: 0,
      lossOffPlotKg: 0,
      currentTotalCarbonKg: initialTotalCarbonKg,
    },
    management: {
      tillageType: "none",
      tillageDepthMm: 0,
      residueCoverFraction: 0.16,
      amendment: "none",
      lastTacticId: "none",
      coverCrop: "none",
      grazing: "none",
      harvest: "none",
    },
    season: {
      seasonNumber: 1,
      decisionsTakenInSeason: 0,
      maxDecisionsPerSeason: 3,
      seasonDurationSec: 90,
      unlockedHorizons: ["O", "A"],
      unlockedFunctionalGroups: ["amf", "rhizosphere"],
      dayIndex: 1,
      seasonPhase: "spring_wakeup",
      currentRainEvent: {
        intensityMmPerHour: 5,
        durationHours: 1,
        dropletImpactEnergy: 0.5,
      },
    },
    plants,
    hyphalLinks,
    cooperativeLedger: {
      growerStakePercent: 35,
      landownerStakePercent: 30,
      playerStakePercent: 35,
      carbonBiomassCredits: 12.5,
      mycorrhizalPatronage: 5,
      cooperativeMultiplier: 1,
    },
    seed,
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function calculateInfiltrationAndRunoff(state, rain) {
  const totalRainMm = round(rain.intensityMmPerHour * rain.durationHours);
  const residueCover = state.management.residueCoverFraction;
  const aggregateStability = state.horizons.A.aggregateStability;
  const biocharBonus = 1 + (state.biology.biocharCarbonFraction || 0) * 0.45;

  let crustFormedMm = 0;
  if (residueCover < 0.65 && rain.dropletImpactEnergy >= 1.0) {
    const unprotectedFraction = 1 - residueCover;
    const aggregateWeakness = 1 - aggregateStability;
    crustFormedMm = round(rain.dropletImpactEnergy * unprotectedFraction * aggregateWeakness * 0.12);
  }

  const currentCrustMm = state.water.crustThicknessMm + crustFormedMm;

  const crustResistanceFactor = 1 / (1 + currentCrustMm * 2.2);
  const aggregateFactor = 0.2 + 0.8 * aggregateStability;
  const macroporeFactor = 1 + 0.02 * state.biology.earthwormActivityIndex;

  const effectiveInfiltrationRateMmPerHr =
    state.horizons.A.saturatedConductivityMmPerHr *
    crustResistanceFactor *
    aggregateFactor *
    macroporeFactor *
    biocharBonus;

  const oDeficitMm = Math.max(
    0,
    state.horizons.O.waterHoldingCapacityMm - state.horizons.O.currentWaterMm
  );
  const mulchRetentionCapacityMm = oDeficitMm * Math.min(1, residueCover * 1.5);

  const potentialInfiltrationCapacityMm =
    mulchRetentionCapacityMm + effectiveInfiltrationRateMmPerHr * rain.durationHours;

  const waterInfiltratedMm = round(Math.min(totalRainMm, potentialInfiltrationCapacityMm));
  const waterShedMm = round(Math.max(0, totalRainMm - waterInfiltratedMm));

  let topsoilCarbonExportedKg = 0;
  if (waterShedMm > 0) {
    const shearVulnerability = (1 - residueCover) * (1 - aggregateStability);
    const rawExport = waterShedMm * shearVulnerability * (state.carbon.poolByHorizonKg.A * 0.025);
    const maxExportable = Math.max(0, state.carbon.poolByHorizonKg.A - 1);
    topsoilCarbonExportedKg = round(Math.min(maxExportable, rawExport), 3);
  }

  return {
    waterInMm: totalRainMm,
    waterInfiltratedMm,
    waterShedMm,
    topsoilCarbonExportedKg,
    crustFormedMm: round(crustFormedMm),
    effectiveInfiltrationRateMmPerHr: round(effectiveInfiltrationRateMmPerHr),
  };
}

export function tick(currentState, action, rain) {
  const next = cloneState(currentState);
  const initialFb = next.biology.fungalToBacterialRatio;
  next.season.dayIndex += 30;
  next.season.decisionsTakenInSeason = Math.min(
    next.season.maxDecisionsPerSeason,
    (next.season.decisionsTakenInSeason || 0) + 1
  );
  next.season.currentRainEvent = rain;

  if (next.season.decisionsTakenInSeason === 1) next.season.seasonPhase = "spring_wakeup";
  else if (next.season.decisionsTakenInSeason === 2) next.season.seasonPhase = "midsummer_heat_dome";
  else next.season.seasonPhase = "autumn_inoculation";

  const O = next.horizons.O;
  const A = next.horizons.A;
  const E = next.horizons.E;
  const B = next.horizons.B;

  // Ensure new subsurface biology fields exist on loaded legacy saves
  next.biology.arbusculeDensity = next.biology.arbusculeDensity ?? 18;
  next.biology.glomalinIndex = next.biology.glomalinIndex ?? 0.2;
  next.biology.rootExudateFlux = next.biology.rootExudateFlux ?? 0.26;
  next.biology.tardigradeCount = next.biology.tardigradeCount ?? 6;
  next.biology.tardigradeState = next.biology.tardigradeState ?? "tun";
  next.biology.nematodeCount = next.biology.nematodeCount ?? 14;
  next.biology.protozoaCount = next.biology.protozoaCount ?? 18;
  next.biology.rhizosphereBacteriaMgPerKg = next.biology.rhizosphereBacteriaMgPerKg ?? 210;
  next.biology.biocharCarbonFraction = next.biology.biocharCarbonFraction ?? 0.04;

  let actionSummary = "";
  let headlineOutcome = "";
  let mechanismNote = "";

  const addCarbonToHorizon = (h, amountKg) => {
    const rounded = round(amountKg, 3);
    if (rounded <= 0) return;
    next.carbon.poolByHorizonKg[h] = round(next.carbon.poolByHorizonKg[h] + rounded, 3);
    next.carbon.totalCarbonGainedKg = round(next.carbon.totalCarbonGainedKg + rounded, 3);
  };

  const oxidizeCarbonFromHorizon = (h, amountKg) => {
    const available = Math.max(0, next.carbon.poolByHorizonKg[h] - 0.5);
    const oxidized = round(Math.min(available, amountKg), 3);
    if (oxidized <= 0) return;
    next.carbon.poolByHorizonKg[h] = round(next.carbon.poolByHorizonKg[h] - oxidized, 3);
    next.carbon.fluxToAtmosphereKg = round(next.carbon.fluxToAtmosphereKg + oxidized, 3);
  };

  next.management.lastTacticId = action.type;

  switch (action.type) {
    case "precharged_biochar": {
      next.management.amendment = "precharged_biochar";
      addCarbonToHorizon("A", 3.2);
      addCarbonToHorizon("O", 0.8);
      A.waterHoldingCapacityMm = round(A.waterHoldingCapacityMm + 14);
      A.bulkDensityGcm3 = Math.max(1.12, round(A.bulkDensityGcm3 - 0.14));
      A.aggregateStability = round(Math.min(0.96, A.aggregateStability + 0.22));
      A.saturatedConductivityMmPerHr = Math.min(64, round(A.saturatedConductivityMmPerHr + 16, 1));
      next.biology.biocharCarbonFraction = round(
        Math.min(1, next.biology.biocharCarbonFraction + 0.34)
      );
      next.biology.fungalToBacterialRatio = round(next.biology.fungalToBacterialRatio + 0.42);
      next.biology.activeMyceliumLengthM += 260;
      next.biology.mycorrhizalColonizationPercent = Math.min(
        100,
        round(next.biology.mycorrhizalColonizationPercent + 18, 1)
      );
      next.biology.arbusculeDensity = Math.min(100, round(next.biology.arbusculeDensity + 20));
      next.biology.glomalinIndex = round(Math.min(1, next.biology.glomalinIndex + 0.18));
      next.biology.rhizosphereBacteriaMgPerKg = Math.min(
        1400,
        round(next.biology.rhizosphereBacteriaMgPerKg + 240)
      );
      next.biology.tardigradeCount = Math.min(45, next.biology.tardigradeCount + 9);
      next.biology.tardigradeState = "active";
      next.biology.nematodeCount = Math.min(85, next.biology.nematodeCount + 14);
      next.water.crustThicknessMm = Math.max(0, round(next.water.crustThicknessMm - 1.4));
      next.water.isCrusted = next.water.crustThicknessMm > 0.5;
      for (const link of next.hyphalLinks) {
        link.isActive = true;
        link.conductance = Math.min(1, round(link.conductance + 0.22));
      }
      actionSummary = "Pre-charged biochar worked into rhizosphere";
      headlineOutcome =
        "Porous biochar honeycomb locked into the topsoil, sheltering microbes, tardigrades, and AMF hyphae.";
      mechanismNote =
        "Biochar micropores hold water and cations while giving AMF hyphae and bacteria refuges from compaction.";
      break;
    }

    case "biostimulant_kelp_humic": {
      next.management.amendment = "kelp_humic_biostimulant";
      addCarbonToHorizon("A", 2.1);
      addCarbonToHorizon("B", 0.7);
      A.aggregateStability = round(Math.min(0.96, A.aggregateStability + 0.25));
      A.saturatedConductivityMmPerHr = Math.min(62, round(A.saturatedConductivityMmPerHr + 14, 1));
      next.biology.rootExudateFlux = round(Math.min(1, next.biology.rootExudateFlux + 0.36));
      next.biology.arbusculeDensity = Math.min(100, round(next.biology.arbusculeDensity + 32));
      next.biology.mycorrhizalColonizationPercent = Math.min(
        100,
        round(next.biology.mycorrhizalColonizationPercent + 28, 1)
      );
      next.biology.glomalinIndex = round(Math.min(1, next.biology.glomalinIndex + 0.24));
      next.biology.fungalToBacterialRatio = round(next.biology.fungalToBacterialRatio + 0.55);
      next.biology.activeMyceliumLengthM += 380;
      next.biology.rhizosphereBacteriaMgPerKg = Math.min(
        1400,
        round(next.biology.rhizosphereBacteriaMgPerKg + 190)
      );
      next.water.crustThicknessMm = Math.max(0, round(next.water.crustThicknessMm - 1.3));
      next.water.isCrusted = next.water.crustThicknessMm > 0.5;
      for (const plant of next.plants) {
        if (plant.isAlive) {
          plant.mycorrhizalColonization = Math.min(1, round((plant.mycorrhizalColonization || 0.3) + 0.28));
          plant.arbusculeDensity = Math.min(1, round((plant.arbusculeDensity || 0.25) + 0.32));
          plant.rootExudateFlux = Math.min(1, round((plant.rootExudateFlux || 0.3) + 0.35));
          plant.rootDepthMm = Math.min(620, plant.rootDepthMm + 55);
        }
      }
      for (const link of next.hyphalLinks) {
        link.isActive = true;
        link.conductance = Math.min(1, round(link.conductance + 0.28));
        link.phosphorusDeliveredMg = (link.phosphorusDeliveredMg || 10) + 18;
      }
      actionSummary = "Kelp, humic acid, and AMF biostimulant applied";
      headlineOutcome =
        "Kelp auxins and humic acids triggered a root-sugar surge, blooming glowing AMF arbuscules inside root cells.";
      mechanismNote =
        "Biostimulants signal roots to pump liquid carbon sugars, inviting AMF to form intracellular arbuscules that trade phosphorus for carbon.";
      break;
    }

    case "inoculate_fungal_tea": {
      next.biology.fungalToBacterialRatio = round(next.biology.fungalToBacterialRatio + 0.62);
      next.biology.activeMyceliumLengthM += 340;
      next.management.amendment = "aerated_compost_tea";
      A.aggregateStability = round(Math.min(0.95, A.aggregateStability + 0.22));
      A.saturatedConductivityMmPerHr = Math.min(60, round(A.saturatedConductivityMmPerHr + 15, 1));
      next.water.crustThicknessMm = Math.max(0, round(next.water.crustThicknessMm - 1.2));
      next.water.isCrusted = next.water.crustThicknessMm > 0.5;
      next.biology.mycorrhizalColonizationPercent = Math.min(
        100,
        round(next.biology.mycorrhizalColonizationPercent + 22, 1)
      );
      next.biology.arbusculeDensity = Math.min(100, round(next.biology.arbusculeDensity + 18));
      next.biology.glomalinIndex = round(Math.min(1, next.biology.glomalinIndex + 0.2));
      next.biology.nematodeCount = Math.min(85, next.biology.nematodeCount + 24);
      next.biology.protozoaCount = Math.min(100, next.biology.protozoaCount + 26);
      next.biology.tardigradeCount = Math.min(45, next.biology.tardigradeCount + 12);
      next.biology.tardigradeState = "active";
      next.biology.rhizosphereBacteriaMgPerKg = Math.min(
        1400,
        round(next.biology.rhizosphereBacteriaMgPerKg + 310)
      );
      next.biology.earthwormActivityIndex = Math.min(100, next.biology.earthwormActivityIndex + 10);
      addCarbonToHorizon("A", 1.8);
      for (const plant of next.plants) {
        if (plant.isAlive) {
          plant.mycorrhizalColonization = Math.min(1, plant.mycorrhizalColonization + 0.25);
        }
      }
      for (const link of next.hyphalLinks) {
        link.isActive = true;
        link.conductance = Math.min(1, link.conductance + 0.25);
      }
      actionSummary = "Aerated compost tea drenched";
      headlineOutcome =
        "Oxygenated compost tea woke tardigrades, nematodes, and hyphae across the rhizosphere.";
      mechanismNote =
        "Beneficial nematodes and protozoa graze on rhizosphere bacteria, releasing plant-available nitrogen right at the root tips.";
      break;
    }

    case "mulch_woodchips":
    case "compost_humus": {
      O.depthMm += 35;
      O.waterHoldingCapacityMm += 16;
      next.management.residueCoverFraction = round(
        Math.min(1, next.management.residueCoverFraction + 0.65)
      );
      next.management.amendment = "compost_woodchip_mulch";
      addCarbonToHorizon("O", 3.5);
      addCarbonToHorizon("A", 1.4);
      A.aggregateStability = round(Math.min(0.95, A.aggregateStability + 0.2));
      A.bulkDensityGcm3 = Math.max(1.16, round(A.bulkDensityGcm3 - 0.14));
      A.saturatedConductivityMmPerHr = Math.min(58, round(A.saturatedConductivityMmPerHr + 15, 1));
      next.water.crustThicknessMm = Math.max(0, round(next.water.crustThicknessMm - 1.8));
      next.water.isCrusted = next.water.crustThicknessMm > 0.5;
      next.biology.fungalToBacterialRatio = round(next.biology.fungalToBacterialRatio + 0.48);
      next.biology.earthwormActivityIndex = Math.min(100, next.biology.earthwormActivityIndex + 18);
      next.biology.tardigradeCount = Math.min(45, next.biology.tardigradeCount + 10);
      next.biology.tardigradeState = "active";
      next.biology.activeMyceliumLengthM += 210;
      for (const link of next.hyphalLinks) {
        link.isActive = true;
        link.conductance = Math.min(1, link.conductance + 0.18);
      }
      actionSummary = "Living compost and woodchip blanket laid";
      headlineOutcome =
        "Compost and woodchips shielded the surface, recruited earthworms, and fed saprophytic fungi.";
      mechanismNote =
        "Surface residue absorbs raindrop kinetic energy while earthworms pull organic matter down into vertical macropores.";
      break;
    }

    case "humic_soak": {
      next.water.crustThicknessMm = Math.max(0, round(next.water.crustThicknessMm - 1.5));
      next.water.isCrusted = next.water.crustThicknessMm > 0.5;
      A.saturatedConductivityMmPerHr = Math.min(60, round(A.saturatedConductivityMmPerHr + 8, 1));
      next.biology.tardigradeState = "active";
      next.biology.tardigradeCount = Math.min(45, next.biology.tardigradeCount + 8);
      next.biology.nematodeCount = Math.min(85, next.biology.nematodeCount + 10);
      next.biology.rootExudateFlux = round(Math.min(1, next.biology.rootExudateFlux + 0.14));
      actionSummary = "Deep humic mineral soak";
      headlineOutcome =
        "Slow humic hydration filled pore films, reviving dormant tardigrades from tuns into active grazers.";
      mechanismNote =
        "Water films lining soil micropores are the highways that tardigrades, nematodes, and protozoa need to move and cycle nutrients.";
      break;
    }

    case "airspade_pores": {
      next.water.crustThicknessMm = 0;
      next.water.isCrusted = false;
      A.bulkDensityGcm3 = Math.max(1.18, round(A.bulkDensityGcm3 - 0.15));
      A.saturatedConductivityMmPerHr = Math.min(62, round(A.saturatedConductivityMmPerHr + 18, 1));
      next.biology.earthwormActivityIndex = Math.min(100, next.biology.earthwormActivityIndex + 12);
      next.biology.tardigradeState = "active";
      actionSummary = "Pneumatic pore aeration";
      headlineOutcome =
        "Supersonic air cracked the sealed crust and opened deep macropores without severing a single root or hypha.";
      mechanismNote =
        "Opening oxygen and water channels without rotary blades preserves intact mycorrhizal networks and glomalin aggregates.";
      break;
    }

    case "tillage": {
      next.management.tillageType = "rototill";
      next.management.tillageDepthMm = 150;
      next.biology.fungalToBacterialRatio = Math.max(
        0.05,
        round(next.biology.fungalToBacterialRatio * 0.25)
      );
      next.biology.activeMyceliumLengthM = Math.max(
        15,
        Math.round(next.biology.activeMyceliumLengthM * 0.18)
      );
      next.biology.arbusculeDensity = Math.max(4, Math.round(next.biology.arbusculeDensity * 0.35));
      next.biology.glomalinIndex = round(Math.max(0.05, next.biology.glomalinIndex * 0.4));
      next.biology.earthwormActivityIndex = Math.max(
        2,
        Math.round(next.biology.earthwormActivityIndex * 0.35)
      );
      next.biology.tardigradeState = "tun";
      next.biology.tardigradeCount = Math.max(2, Math.round(next.biology.tardigradeCount * 0.45));
      A.aggregateStability = Math.max(0.05, round(A.aggregateStability * 0.3));
      A.bulkDensityGcm3 = Math.min(1.75, round(A.bulkDensityGcm3 + 0.14));
      A.saturatedConductivityMmPerHr = Math.max(
        5,
        round(A.saturatedConductivityMmPerHr * 0.45, 1)
      );
      next.management.residueCoverFraction = Math.max(
        0.02,
        round(next.management.residueCoverFraction * 0.2)
      );
      O.depthMm = Math.max(2, Math.round(O.depthMm * 0.3));
      oxidizeCarbonFromHorizon("A", 1.45);
      for (const link of next.hyphalLinks) {
        link.conductance = 0;
        link.isActive = false;
      }
      actionSummary = "Rotary tillage";
      headlineOutcome =
        "Steel blades sliced the AMF hyphal highway, shattered glomalin crumbs, and vented topsoil carbon.";
      mechanismNote =
        "Tillage breaks fungal threads and exposes protected aggregate carbon to rapid bacterial oxidation.";
      break;
    }

    case "synthetic_npk":
    case "harvest_clear": {
      next.management.amendment = "synthetic_npk_salt";
      next.biology.rootExudateFlux = round(Math.max(0.04, next.biology.rootExudateFlux * 0.22));
      next.biology.arbusculeDensity = Math.max(3, Math.round(next.biology.arbusculeDensity * 0.28));
      next.biology.mycorrhizalColonizationPercent = Math.max(
        4,
        round(next.biology.mycorrhizalColonizationPercent * 0.35, 1)
      );
      next.biology.fungalToBacterialRatio = Math.max(
        0.08,
        round(next.biology.fungalToBacterialRatio * 0.42)
      );
      next.biology.activeMyceliumLengthM = Math.max(
        25,
        Math.round(next.biology.activeMyceliumLengthM * 0.4)
      );
      next.biology.tardigradeState = "tun";
      next.biology.tardigradeCount = Math.max(2, Math.round(next.biology.tardigradeCount * 0.5));
      next.biology.nematodeCount = Math.max(4, Math.round(next.biology.nematodeCount * 0.45));
      A.aggregateStability = Math.max(0.08, round(A.aggregateStability * 0.55));
      next.water.crustThicknessMm = round(next.water.crustThicknessMm + 0.9);
      next.water.isCrusted = true;
      oxidizeCarbonFromHorizon("A", 0.95);
      for (const plant of next.plants) {
        plant.arbusculeDensity = Math.max(0.05, round((plant.arbusculeDensity || 0.2) * 0.25));
        plant.rootExudateFlux = Math.max(0.04, round((plant.rootExudateFlux || 0.25) * 0.2));
      }
      for (const link of next.hyphalLinks) {
        link.conductance = round(link.conductance * 0.2);
        link.isActive = false;
      }
      actionSummary = "Synthetic N-P-K salt fertilizer applied";
      headlineOutcome =
        "Free soluble salts made roots shut off sugar exudates: AMF arbuscules went dark and tardigrades curled into tuns.";
      mechanismNote =
        "When plants get soluble synthetic N and P for free, they stop trading liquid carbon to mycorrhizal fungi, collapsing the rhizosphere symbiosis.";
      break;
    }

    case "graze_heavy": {
      next.management.grazing = "continuous_overgrazing";
      next.management.residueCoverFraction = Math.max(
        0.05,
        round(next.management.residueCoverFraction * 0.35)
      );
      A.bulkDensityGcm3 = Math.min(1.78, round(A.bulkDensityGcm3 + 0.15));
      A.aggregateStability = Math.max(0.08, round(A.aggregateStability * 0.55));
      A.saturatedConductivityMmPerHr = Math.max(
        5.5,
        round(A.saturatedConductivityMmPerHr * 0.55, 1)
      );
      next.biology.fungalToBacterialRatio = Math.max(
        0.08,
        round(next.biology.fungalToBacterialRatio * 0.5)
      );
      next.biology.tardigradeState = "tun";
      oxidizeCarbonFromHorizon("O", 0.55);
      for (const link of next.hyphalLinks) {
        link.conductance = round(link.conductance * 0.4);
      }
      actionSummary = "Heavy surface compaction";
      headlineOutcome =
        "Heavy pressure crushed pore channels shut, stripped the mulch blanket, and sealed the surface.";
      mechanismNote =
        "Compaction squeezes out the air and water macropores that roots, earthworms, and aerobic microbes require.";
      break;
    }

    case "rest":
    default: {
      actionSummary = "2-inch cloudburst storm tested the field";
      mechanismNote =
        "High-energy raindrops test whether your surface mulch, glomalin crumbs, and macropores can drink the storm or shed topsoil.";
      break;
    }
  }

  let carbonTransferredViaHyphaeKg = 0;
  for (const link of next.hyphalLinks) {
    if (!link.isActive || link.conductance <= 0) continue;
    const pA = next.plants.find((p) => p.id === link.plantAId);
    const pB = next.plants.find((p) => p.id === link.plantBId);
    if (pA && pB && pA.isAlive && pB.isAlive) {
      const donor = pA.donorPriority >= pB.donorPriority ? pA : pB;
      const recipient = donor === pA ? pB : pA;
      const fbFactor = Math.min(1.6, Math.max(0.1, next.biology.fungalToBacterialRatio));
      const exudateBoost = 0.7 + (next.biology.rootExudateFlux || 0.25) * 0.8;
      const transferRate = round(
        Math.min(donor.carbonAllocationKgPerDay * 0.38, link.conductance * 0.16 * fbFactor * exudateBoost),
        3
      );
      if (transferRate > 0) {
        donor.carbonAllocationKgPerDay = round(
          Math.max(0.05, donor.carbonAllocationKgPerDay - transferRate * 0.18),
          3
        );
        recipient.biomassKg = round(recipient.biomassKg + transferRate * 0.9, 3);
        recipient.rootDepthMm = Math.min(540, recipient.rootDepthMm + Math.round(transferRate * 115));
        link.cumulativeCarbonTransferredKg = round(
          link.cumulativeCarbonTransferredKg + transferRate,
          3
        );
        carbonTransferredViaHyphaeKg = round(
          carbonTransferredViaHyphaeKg + transferRate,
          3
        );
        addCarbonToHorizon("B", transferRate);
      }
    }
  }

  const runoffOutput = calculateInfiltrationAndRunoff(next, rain);

  next.water.crustThicknessMm = round(next.water.crustThicknessMm + runoffOutput.crustFormedMm);
  next.water.isCrusted = next.water.crustThicknessMm > 0.5;
  next.water.infiltrationRateMmPerHr = runoffOutput.effectiveInfiltrationRateMmPerHr;
  next.water.totalWaterInMm = round(next.water.totalWaterInMm + runoffOutput.waterInMm);
  next.water.totalInfiltratedMm = round(
    next.water.totalInfiltratedMm + runoffOutput.waterInfiltratedMm
  );
  next.water.runoffVolumeMm = round(next.water.runoffVolumeMm + runoffOutput.waterShedMm);
  next.water.topsoilExportedKg = round(
    next.water.topsoilExportedKg + runoffOutput.topsoilCarbonExportedKg,
    3
  );

  if (runoffOutput.topsoilCarbonExportedKg > 0) {
    const exported = runoffOutput.topsoilCarbonExportedKg;
    next.carbon.poolByHorizonKg.A = round(next.carbon.poolByHorizonKg.A - exported, 3);
    next.carbon.lossOffPlotKg = round(next.carbon.lossOffPlotKg + exported, 3);
  }

  next.carbon.currentTotalCarbonKg = sumHorizonCarbonKg(next.carbon.poolByHorizonKg);

  let remainingInfil = runoffOutput.waterInfiltratedMm;

  const absorb = (h) => {
    const deficit = Math.max(0, h.waterHoldingCapacityMm - h.currentWaterMm);
    const taken = round(Math.min(remainingInfil, deficit));
    h.currentWaterMm = round(h.currentWaterMm + taken);
    remainingInfil = round(remainingInfil - taken);
  };
  absorb(O);
  absorb(A);
  absorb(E);
  absorb(B);

  next.water.deepPercolationMm = round(next.water.deepPercolationMm + remainingInfil);

  // Update tardigrade hydration state based on topsoil moisture and crust
  if (A.currentWaterMm / A.waterHoldingCapacityMm >= 0.42 && !next.water.isCrusted && action.type !== "synthetic_npk") {
    next.biology.tardigradeState = "active";
  }

  if (!headlineOutcome) {
    headlineOutcome =
      runoffOutput.waterShedMm > runoffOutput.waterInfiltratedMm
        ? `Cloudburst hit sealed crust: ${runoffOutput.waterShedMm.toFixed(0)} mm sheeted off and carried topsoil away.`
        : `Living pores drank ${runoffOutput.waterInfiltratedMm.toFixed(0)} mm of rain deep into the root zone.`;
  }

  const groups = new Set(next.season.unlockedFunctionalGroups || ["amf", "rhizosphere"]);
  if (next.biology.arbusculeDensity >= 30 || next.biology.fungalToBacterialRatio >= 0.55) {
    groups.add("amf");
  }
  if (next.biology.tardigradeState === "active" || next.biology.tardigradeCount >= 12) {
    groups.add("tardigrade");
  }
  if (next.biology.nematodeCount >= 22) {
    groups.add("nematode");
  }
  if (next.biology.biocharCarbonFraction >= 0.2) {
    groups.add("biochar");
  }
  if (next.biology.earthwormActivityIndex >= 14) {
    groups.add("earthworm");
  }
  next.season.unlockedFunctionalGroups = Array.from(groups);

  const yieldUnits =
    runoffOutput.waterInfiltratedMm * 0.05 + carbonTransferredViaHyphaeKg * 2.0;
  if (yieldUnits > 0) {
    const credits = round(yieldUnits * next.cooperativeLedger.cooperativeMultiplier);
    next.cooperativeLedger.carbonBiomassCredits = round(
      next.cooperativeLedger.carbonBiomassCredits + credits
    );
    const playerFraction = next.cooperativeLedger.playerStakePercent / 100;
    next.cooperativeLedger.mycorrhizalPatronage = round(
      next.cooperativeLedger.mycorrhizalPatronage + credits * playerFraction
    );
  }

  const fbRatioDelta = round(next.biology.fungalToBacterialRatio - initialFb);

  next.auditLog = [
    {
      timestampIso: new Date().toISOString(),
      stewardId: "steward-local",
      actionType: action.type,
      summary: `${actionSummary}. Rain ${runoffOutput.waterInMm.toFixed(1)} mm: ${runoffOutput.waterInfiltratedMm.toFixed(1)} in, ${runoffOutput.waterShedMm.toFixed(1)} shed.`,
      mechanismNote,
    },
    ...(next.auditLog || []),
  ].slice(0, 20);

  return {
    state: next,
    rainEventApplied: rain,
    infiltrationMm: runoffOutput.waterInfiltratedMm,
    runoffMm: runoffOutput.waterShedMm,
    erosionLossCarbonKg: runoffOutput.topsoilCarbonExportedKg,
    carbonTransferredViaHyphaeKg,
    crustFormedMm: runoffOutput.crustFormedMm,
    fbRatioDelta,
    headlineOutcome,
    mechanismNote,
  };
}

const RAIN = {
  cloudburst: { intensityMmPerHour: 42, durationHours: 1, dropletImpactEnergy: 1.9 },
  humic_soak: { intensityMmPerHour: 24, durationHours: 1, dropletImpactEnergy: 0.45 },
  airspade: { intensityMmPerHour: 16, durationHours: 1, dropletImpactEnergy: 0.35 },
  feed: { intensityMmPerHour: 9, durationHours: 1, dropletImpactEnergy: 0.35 },
  disturb: { intensityMmPerHour: 24, durationHours: 1, dropletImpactEnergy: 1.55 },
};

export function performGestureVerb(state, verb, subMode) {
  if (verb === "water") {
    const mode = subMode || "cloudburst";
    if (mode === "humic_soak") {
      return tick(state, { type: "humic_soak", verb: "water" }, RAIN.humic_soak);
    }
    if (mode === "airspade") {
      return tick(state, { type: "airspade_pores", verb: "water" }, RAIN.airspade);
    }
    return tick(state, { type: "rest", verb: "water" }, RAIN.cloudburst);
  }

  if (verb === "feed") {
    const mode =
      subMode ||
      (state.biology.biocharCarbonFraction < 0.25
        ? "biochar"
        : state.biology.arbusculeDensity < 45
        ? "biostimulant"
        : state.biology.nematodeCount < 35
        ? "tea"
        : "mulch");

    const actionMap = {
      biochar: "precharged_biochar",
      biostimulant: "biostimulant_kelp_humic",
      tea: "inoculate_fungal_tea",
      mulch: "mulch_woodchips",
      compost: "compost_humus",
    };
    const actionType = actionMap[mode] || "precharged_biochar";
    return tick(state, { type: actionType, verb: "feed" }, RAIN.feed);
  }

  const mode = subMode || "till";
  const actionType =
    mode === "graze"
      ? "graze_heavy"
      : mode === "npk" || mode === "harvest"
      ? "synthetic_npk"
      : "tillage";
  return tick(state, { type: actionType, verb: "disturb" }, RAIN.disturb);
}

export function advanceToNextSeason(state) {
  const next = cloneState(state);
  next.season.seasonNumber += 1;
  next.season.decisionsTakenInSeason = 0;
  next.season.seasonPhase = "spring_wakeup";
  next.season.unlockedHorizons = HORIZON_ORDER.slice(
    0,
    Math.min(HORIZON_ORDER.length, next.season.seasonNumber + 1)
  );
  return next;
}

export function evaluateSeasonOutcome(state) {
  const waterIn = state.water.totalWaterInMm;
  const infilFraction = waterIn > 0 ? state.water.totalInfiltratedMm / waterIn : 0.5;
  const fbScore = Math.min(1, state.biology.fungalToBacterialRatio / 1.8);
  const aggScore = state.horizons.A.aggregateStability;
  const symbiosisScore = Math.min(1, (state.biology.arbusculeDensity || 20) / 80);
  const netCarbonDelta = state.carbon.currentTotalCarbonKg - state.carbon.initialTotalCarbonKg;
  const carbonScore = clamp((netCarbonDelta + 3) / 12, 0, 1);

  const livingSoilScore = Math.round(
    infilFraction * 30 + fbScore * 20 + aggScore * 20 + symbiosisScore * 15 + carbonScore * 15
  );

  let soilBecameLine;
  if (
    state.biology.fungalToBacterialRatio >= 1.0 &&
    state.horizons.A.aggregateStability >= 0.5 &&
    (state.biology.arbusculeDensity || 0) >= 40
  ) {
    soilBecameLine =
      "Your rhizosphere lit up with AMF arbuscules, biochar reefs, active tardigrades, and deep sponge pores.";
  } else if (state.water.runoffVolumeMm > state.water.totalInfiltratedMm) {
    soilBecameLine = "Your sealed crust shed the storm sideways and washed topsoil carbon off the plot.";
  } else if (state.biology.fungalToBacterialRatio < 0.25) {
    soilBecameLine = "Your soil collapsed into grey dust with severed hyphae and dormant tardigrade tuns.";
  } else {
    soilBecameLine =
      "Your topsoil cracked its crust, woke its microbes, and began trading root sugars for fungal phosphorus.";
  }

  return { livingSoilScore, soilBecameLine };
}

export function seasonLabel(state) {
  const n = state.season.seasonNumber;
  return n <= 4 ? `Season ${n} of 4` : `Season ${n}`;
}

export function nextSeasonHint(state) {
  const next = state.season.seasonNumber + 1;
  if (next === 2) return "Season 2 : E horizon mineral zone";
  if (next === 3) return "Season 3 : B horizon moisture bank";
  if (next === 4) return "Season 4 : C horizon parent matrix";
  return `Season ${next} : Deep stewardship`;
}

export const VERB_MODES = {
  water: [
    {
      id: "cloudburst",
      label: "Cloudburst",
      hint: "42 mm storm test",
      detail: "Tests whether your soil sponge drinks a 2-inch storm or sheets topsoil away.",
    },
    {
      id: "humic_soak",
      label: "Humic Soak",
      hint: "Wake tardigrades",
      detail: "Slow fulvic/humic hydration fills pore menisci and revives tardigrades from dormant tuns.",
    },
    {
      id: "airspade",
      label: "Pore Aerate",
      hint: "Crack crust safely",
      detail: "Opens vertical oxygen and water channels without cutting fungal hyphae.",
    },
  ],
  feed: [
    {
      id: "biochar",
      label: "Pre-Charged Biochar",
      hint: "Microbial reef + CEC",
      detail: "Porous honeycomb carbon inoculated with microbes. Locks carbon and shelters AMF and tardigrades.",
    },
    {
      id: "biostimulant",
      label: "Kelp & Humic Bio",
      hint: "AMF arbuscule bloom",
      detail: "Auxins and humic acids trigger root sugar exudates and glowing intracellular AMF arbuscules.",
    },
    {
      id: "tea",
      label: "Compost Tea",
      hint: "Nematode + microbe loop",
      detail: "Oxygenated brew blooms rhizosphere bacteria, protozoa, nematodes, and active water bears.",
    },
    {
      id: "mulch",
      label: "Compost & Mulch",
      hint: "O-horizon + worms",
      detail: "Builds the surface litter sponge, stops raindrop crusting, and recruits nightcrawlers.",
    },
  ],
  disturb: [
    {
      id: "till",
      label: "Rotary Till",
      hint: "Slices AMF hyphae",
      detail: "Steel blades sever mycorrhizal bridges, shatter glomalin crumbs, and vent soil carbon.",
    },
    {
      id: "npk",
      label: "Synthetic N-P-K",
      hint: "Kills root-AMF trade",
      detail: "Free soluble salts make plants shut off carbon exudates, starving AMF arbuscules and shocking tardigrades.",
    },
    {
      id: "graze",
      label: "Compaction",
      hint: "Crushes pore space",
      detail: "Compresses macropores, raises bulk density, and seals the surface against rain.",
    },
  ],
};
