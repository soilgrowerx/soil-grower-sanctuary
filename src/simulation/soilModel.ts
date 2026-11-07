import type {
  SoilSimulationState,
  HorizonType,
  HorizonState,
  BioregionId,
  SiteState,
  Plant,
  HyphalLink,
  RainEvent,
  ManagementAction,
  InfiltrationRunoffOutput,
  TickResult,
  FieldAuditEntry,
  SanctuaryColumn,
  CoreVerb,
  FeedSubMode,
  DisturbSubMode,
} from './types.ts';

export const BIOREGIONS: Record<BioregionId, SiteState> = {
  rogue_valley: {
    bioregionId: 'rogue_valley',
    bioregionName: 'Rogue Valley, OR',
    latitude: 42.3265,
    longitude: -122.8756,
    climateZone: 'USDA Zone 8b, Mediterranean Warm Summer',
    baselineRecordReference: 'USDA-NRCS Jackson County Soil Survey (Medford Series)',
    soilSeries: 'Medford / Kubli Clay Loam',
  },
  willamette_valley: {
    bioregionId: 'willamette_valley',
    bioregionName: 'Willamette Valley, OR',
    latitude: 44.5646,
    longitude: -123.2620,
    climateZone: 'USDA Zone 8b, Marine West Coast',
    baselineRecordReference: 'USDA-NRCS Benton County Soil Survey (Jory Series)',
    soilSeries: 'Jory Silty Clay Loam',
  },
  blackland_prairie: {
    bioregionId: 'blackland_prairie',
    bioregionName: 'Blackland Prairie, TX',
    latitude: 30.2672,
    longitude: -97.7431,
    climateZone: 'USDA Zone 8b, Subtropical Subhumid',
    baselineRecordReference: 'USDA-NRCS MLRA 86A Texas Blackland Clay',
    soilSeries: 'Houston Black / Austin Silty Clay',
  },
  sandhills_nc: {
    bioregionId: 'sandhills_nc',
    bioregionName: 'Lumber River & Sandhills, NC',
    latitude: 34.6282,
    longitude: -79.0086,
    climateZone: 'USDA Zone 8a, Humid Subtropical',
    baselineRecordReference: 'USDA-NRCS Robeson County Soil Survey (Norfolk Series)',
    soilSeries: 'Norfolk / Wagram Loamy Sand',
  },
};

export function sumHorizonCarbonKg(pool: Record<HorizonType, number>): number {
  return Number((pool.O + pool.A + pool.E + pool.B + pool.C).toFixed(3));
}

/**
 * Creates an initial degraded soil state, defaulting to the Rogue Valley bioregion.
 * Implements the canonical Section 2 model:
 * site, horizons (O, A, E, B, C), biology, water, carbon, management, season.
 */
export function createDefaultSoilState(
  fieldId = 'sanctuary-zero',
  seed = 42,
  bioregionId: BioregionId = 'rogue_valley'
): SoilSimulationState {
  const horizons: Record<HorizonType, HorizonState> = {
    O: {
      type: 'O',
      name: 'O Horizon: Litter & Mulch Sponge',
      depthMm: 5,
      organicMatterPercent: 65.0,
      aggregateStability: 0.20,
      bulkDensityGcm3: 0.35,
      waterHoldingCapacityMm: 8.0,
      currentWaterMm: 1.0,
      saturatedConductivityMmPerHr: 120,
    },
    A: {
      type: 'A',
      name: 'A Horizon: Rhizosphere Topsoil',
      depthMm: 140,
      organicMatterPercent: 1.8,
      aggregateStability: 0.20, // Weak, degraded aggregates
      bulkDensityGcm3: 1.62,   // Compacted hardpan
      waterHoldingCapacityMm: 45.0,
      currentWaterMm: 18.0,
      saturatedConductivityMmPerHr: 8.0, // Low infiltration
    },
    E: {
      type: 'E',
      name: 'E Horizon: Eluviated Mineral Filter',
      depthMm: 90,
      organicMatterPercent: 0.8,
      aggregateStability: 0.20,
      bulkDensityGcm3: 1.65,
      waterHoldingCapacityMm: 28.0,
      currentWaterMm: 12.0,
      saturatedConductivityMmPerHr: 12.0,
    },
    B: {
      type: 'B',
      name: 'B Horizon: Deep Clay Moisture Bank',
      depthMm: 380,
      organicMatterPercent: 0.4,
      aggregateStability: 0.50,
      bulkDensityGcm3: 1.55,
      waterHoldingCapacityMm: 140.0,
      currentWaterMm: 65.0,
      saturatedConductivityMmPerHr: 4.5,
    },
    C: {
      type: 'C',
      name: 'C Horizon: Weathered Parent Substrate',
      depthMm: 500,
      organicMatterPercent: 0.1,
      aggregateStability: 0.85,
      bulkDensityGcm3: 1.80,
      waterHoldingCapacityMm: 90.0,
      currentWaterMm: 40.0,
      saturatedConductivityMmPerHr: 2.0,
    },
  };

  const carbonPool: Record<HorizonType, number> = {
    O: 1.2,
    A: 10.5,
    E: 2.1,
    B: 5.8,
    C: 1.0,
  };
  const initialTotalCarbonKg = sumHorizonCarbonKg(carbonPool);

  const plants: Plant[] = [
    {
      id: 'nurse-tree-1',
      species: 'climax_tree',
      ageDays: 1200,
      biomassKg: 45.0,
      carbonAllocationKgPerDay: 0.85,
      rootDepthMm: 480,
      mycorrhizalColonization: 0.40,
      isAlive: true,
      donorPriority: 0.90,
      columnIndex: 4,
    },
    {
      id: 'seedling-oak-2',
      species: 'climax_tree',
      ageDays: 30,
      biomassKg: 0.60,
      carbonAllocationKgPerDay: 0.04,
      rootDepthMm: 120,
      mycorrhizalColonization: 0.20,
      isAlive: true,
      donorPriority: 0.15,
      columnIndex: 11,
    },
  ];

  const hyphalLinks: HyphalLink[] = [
    {
      id: 'link-1-2',
      plantAId: 'nurse-tree-1',
      plantBId: 'seedling-oak-2',
      conductance: 0.55,
      lengthM: 2.4,
      isActive: true,
      cumulativeCarbonTransferredKg: 0.0,
    },
  ];

  const columns: SanctuaryColumn[] = Array.from({ length: 16 }, (_, i) => ({
    columnIndex: i,
    mulchDepthMm: i % 4 === 0 ? 18 : 5,
    surfaceCrustMm: i % 4 === 0 ? 0.5 : 2.5,
    aHorizonCompacted: i % 4 !== 0,
    bulkDensityGcm3: i % 4 === 0 ? 1.32 : 1.62,
    mycelialDensity: i % 4 === 0 ? 0.35 : 0.15,
    plantId: i === 4 ? 'nurse-tree-1' : i === 11 ? 'seedling-oak-2' : undefined,
  }));

  const site = { ...(BIOREGIONS[bioregionId] || BIOREGIONS.rogue_valley) };

  return {
    site,
    horizons,
    biology: {
      fungalToBacterialRatio: 0.20,
      mycorrhizalColonizationPercent: 8.5,
      earthwormActivityIndex: 5,
      microbialBiomassCarbonMgPerKg: 180,
      activeMyceliumLengthM: 120,
    },
    water: {
      infiltrationRateMmPerHr: 8.0,
      totalWaterInMm: 0,
      totalInfiltratedMm: 0,
      runoffVolumeMm: 0,
      topsoilExportedKg: 0,
      crustThicknessMm: 2.5,
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
      tillageType: 'none',
      tillageDepthMm: 0,
      residueCoverFraction: 0.15,
      amendment: 'none',
      coverCrop: 'none',
      grazing: 'none',
      harvest: 'none',
    },
    season: {
      seasonNumber: 1,
      decisionsTakenInSeason: 0,
      maxDecisionsPerSeason: 3,
      seasonDurationSec: 90,
      unlockedHorizons: ['O', 'A'],
      unlockedFunctionalGroups: [],
      dayIndex: 1,
      seasonPhase: 'spring_wakeup',
      currentRainEvent: {
        intensityMmPerHour: 5.0,
        durationHours: 1.0,
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
      mycorrhizalPatronage: 5.0,
      cooperativeMultiplier: 1.0,
    },
    columns,
    auditLog: [
      {
        timestampIso: new Date(Date.UTC(2026, 10, 5, 12, 0, 0)).toISOString(),
        stewardId: 'system-init',
        actionType: 'rest',
        summary: `Initialized ${site.bioregionName} (${site.soilSeries}): crusted topsoil, F:B 0.20.`,
      },
    ],
    seed,
  };
}

/**
 * Deep clone utility for immutable transitions
 */
export function cloneState(state: SoilSimulationState): SoilSimulationState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Pass 1: Infiltration and Runoff Physics Engine
 * Evaluates rainfall against aggregate stability, residue cover, and crust state.
 * Guarantees Water In === Water Infiltrated + Water Shed.
 */
export function calculateInfiltrationAndRunoff(
  state: SoilSimulationState,
  rain: RainEvent
): InfiltrationRunoffOutput {
  const totalRainMm = Number((rain.intensityMmPerHour * rain.durationHours).toFixed(2));
  const residueCover = state.management.residueCoverFraction;
  const aggregateStability = state.horizons.A.aggregateStability;

  // 1. Kinetic raindrop impact and crust formation on bare ground
  let crustFormedMm = 0;
  if (residueCover < 0.65 && rain.dropletImpactEnergy >= 1.0) {
    const unprotectedFraction = 1.0 - residueCover;
    const aggregateWeakness = 1.0 - aggregateStability;
    crustFormedMm = Number(
      (rain.dropletImpactEnergy * unprotectedFraction * aggregateWeakness * 0.12).toFixed(2)
    );
  }

  const currentCrustMm = state.water.crustThicknessMm + crustFormedMm;

  // 2. Infiltration rate computation (mm/hr)
  const crustResistanceFactor = 1.0 / (1.0 + currentCrustMm * 2.2);
  const aggregateFactor = 0.2 + 0.8 * aggregateStability;
  const macroporeFactor = 1.0 + 0.02 * state.biology.earthwormActivityIndex;

  const effectiveInfiltrationRateMmPerHr =
    state.horizons.A.saturatedConductivityMmPerHr *
    crustResistanceFactor *
    aggregateFactor *
    macroporeFactor;

  // 3. Surface mulch retention sponge capacity
  const oDeficitMm = Math.max(
    0,
    state.horizons.O.waterHoldingCapacityMm - state.horizons.O.currentWaterMm
  );
  const mulchRetentionCapacityMm = oDeficitMm * Math.min(1.0, residueCover * 1.5);

  // 4. Infiltration capacity over event duration
  const potentialInfiltrationCapacityMm =
    mulchRetentionCapacityMm + effectiveInfiltrationRateMmPerHr * rain.durationHours;

  const waterInfiltratedMm = Number(
    Math.min(totalRainMm, potentialInfiltrationCapacityMm).toFixed(2)
  );
  const waterShedMm = Number(Math.max(0, totalRainMm - waterInfiltratedMm).toFixed(2));

  // 5. Runoff erosion: topsoil carbon export off-plot
  let topsoilCarbonExportedKg = 0;
  if (waterShedMm > 0) {
    const shearVulnerability = (1.0 - residueCover) * (1.0 - aggregateStability);
    const rawExport = waterShedMm * shearVulnerability * (state.carbon.poolByHorizonKg.A * 0.025);
    const maxExportable = Math.max(0, state.carbon.poolByHorizonKg.A - 1.0);
    topsoilCarbonExportedKg = Number(Math.min(maxExportable, rawExport).toFixed(3));
  }

  return {
    waterInMm: totalRainMm,
    waterInfiltratedMm,
    waterShedMm,
    topsoilCarbonExportedKg,
    crustFormedMm: Number(crustFormedMm.toFixed(2)),
    effectiveInfiltrationRateMmPerHr: Number(effectiveInfiltrationRateMmPerHr.toFixed(2)),
  };
}

/**
 * Master deterministic simulation tick.
 * Reads and mutates the unified SoilSimulationState while maintaining exact Water and Carbon reconciliation.
 */
export function tick(
  currentState: SoilSimulationState,
  action: ManagementAction,
  rain: RainEvent
): TickResult {
  const next = cloneState(currentState);
  const initialFb = next.biology.fungalToBacterialRatio;
  next.season.dayIndex += 30;
  next.season.decisionsTakenInSeason = Math.min(
    next.season.maxDecisionsPerSeason,
    (next.season.decisionsTakenInSeason || 0) + 1
  );
  next.season.currentRainEvent = rain;

  if (next.season.decisionsTakenInSeason === 1) next.season.seasonPhase = 'spring_wakeup';
  else if (next.season.decisionsTakenInSeason === 2) next.season.seasonPhase = 'midsummer_heat_dome';
  else next.season.seasonPhase = 'autumn_inoculation';

  const steward = action.stewardId || 'steward-local';
  let actionSummary = '';
  let headlineOutcome = '';

  const O = next.horizons.O;
  const A = next.horizons.A;
  const E = next.horizons.E;
  const B = next.horizons.B;

  const addCarbonToHorizon = (h: HorizonType, amountKg: number) => {
    const rounded = Number(amountKg.toFixed(3));
    if (rounded <= 0) return;
    next.carbon.poolByHorizonKg[h] = Number((next.carbon.poolByHorizonKg[h] + rounded).toFixed(3));
    next.carbon.totalCarbonGainedKg = Number((next.carbon.totalCarbonGainedKg + rounded).toFixed(3));
  };

  const oxidizeCarbonFromHorizon = (h: HorizonType, amountKg: number) => {
    const available = Math.max(0, next.carbon.poolByHorizonKg[h] - 0.5);
    const oxidized = Number(Math.min(available, amountKg).toFixed(3));
    if (oxidized <= 0) return;
    next.carbon.poolByHorizonKg[h] = Number((next.carbon.poolByHorizonKg[h] - oxidized).toFixed(3));
    next.carbon.fluxToAtmosphereKg = Number((next.carbon.fluxToAtmosphereKg + oxidized).toFixed(3));
  };

  // -------------------------------------------------------------
  // 1. APPLY MANAGEMENT ACTION
  // -------------------------------------------------------------
  switch (action.type) {
    case 'mulch_woodchips': {
      const addedDepth = 35;
      O.depthMm += addedDepth;
      O.waterHoldingCapacityMm += 16.0;
      next.management.residueCoverFraction = Math.min(
        1.0,
        Number((next.management.residueCoverFraction + 0.65).toFixed(2))
      );
      next.management.amendment = 'woodchips';
      addCarbonToHorizon('O', 3.5);
      A.aggregateStability = Math.min(0.95, Number((A.aggregateStability + 0.18).toFixed(2)));
      A.bulkDensityGcm3 = Math.max(1.18, Number((A.bulkDensityGcm3 - 0.12).toFixed(2)));
      A.saturatedConductivityMmPerHr = Math.min(55, Number((A.saturatedConductivityMmPerHr + 14).toFixed(1)));
      next.water.crustThicknessMm = Math.max(0, Number((next.water.crustThicknessMm - 1.8).toFixed(2)));
      next.water.isCrusted = next.water.crustThicknessMm > 0.5;
      next.biology.fungalToBacterialRatio = Number(
        (next.biology.fungalToBacterialRatio + 0.45).toFixed(2)
      );
      next.biology.earthwormActivityIndex = Math.min(100, next.biology.earthwormActivityIndex + 12);
      next.biology.activeMyceliumLengthM += 180;

      for (const col of next.columns) {
        col.mulchDepthMm += addedDepth;
        col.surfaceCrustMm = Math.max(0, col.surfaceCrustMm - 1.8);
        col.aHorizonCompacted = false;
        col.mycelialDensity = Math.min(1.0, col.mycelialDensity + 0.22);
      }
      for (const link of next.hyphalLinks) {
        link.isActive = true;
        link.conductance = Math.min(1.0, link.conductance + 0.15);
      }

      actionSummary = 'Applied coarse woodchip mulch: residue sponge built, fungal threads expanded.';
      headlineOutcome = 'Woodchip mulch softened the surface crust and fed fungal hyphae across the root zone.';
      break;
    }

    case 'air_spade_decompact': {
      A.bulkDensityGcm3 = Math.max(1.15, Number((A.bulkDensityGcm3 - 0.28).toFixed(2)));
      A.saturatedConductivityMmPerHr = Math.min(65, Number((A.saturatedConductivityMmPerHr * 3.5).toFixed(1)));
      next.water.crustThicknessMm = 0;
      next.water.isCrusted = false;
      next.biology.earthwormActivityIndex = Math.min(100, next.biology.earthwormActivityIndex + 15);
      E.bulkDensityGcm3 = Math.max(1.25, Number((E.bulkDensityGcm3 - 0.15).toFixed(2)));
      next.management.tillageType = 'air_spade';

      for (const col of next.columns) {
        col.surfaceCrustMm = 0;
        col.aHorizonCompacted = false;
        col.bulkDensityGcm3 = Math.max(1.15, col.bulkDensityGcm3 - 0.28);
      }

      actionSummary = 'AirSpade decompaction cleared crust and opened deep macropores.';
      headlineOutcome = 'Supersonic air shattered the surface crust without severing roots or fungal hyphae.';
      break;
    }

    case 'inoculate_fungal_tea': {
      next.biology.fungalToBacterialRatio = Number(
        (next.biology.fungalToBacterialRatio + 0.65).toFixed(2)
      );
      next.biology.activeMyceliumLengthM += 320;
      next.management.amendment = 'fungal_compost_tea';
      A.aggregateStability = Math.min(0.95, Number((A.aggregateStability + 0.24).toFixed(2)));
      A.saturatedConductivityMmPerHr = Math.min(60, Number((A.saturatedConductivityMmPerHr + 16).toFixed(1)));
      next.water.crustThicknessMm = Math.max(0, Number((next.water.crustThicknessMm - 1.2).toFixed(2)));
      next.water.isCrusted = next.water.crustThicknessMm > 0.5;
      next.biology.mycorrhizalColonizationPercent = Math.min(
        100,
        Number((next.biology.mycorrhizalColonizationPercent + 22).toFixed(1))
      );
      next.biology.earthwormActivityIndex = Math.min(100, next.biology.earthwormActivityIndex + 10);
      addCarbonToHorizon('A', 1.8);

      for (const plant of next.plants) {
        if (plant.isAlive) {
          plant.mycorrhizalColonization = Math.min(1.0, plant.mycorrhizalColonization + 0.25);
        }
      }
      for (const link of next.hyphalLinks) {
        link.isActive = true;
        link.conductance = Math.min(1.0, link.conductance + 0.25);
      }
      for (const col of next.columns) {
        col.mycelialDensity = Math.min(1.0, col.mycelialDensity + 0.30);
        col.surfaceCrustMm = Math.max(0, col.surfaceCrustMm - 1.2);
      }
      actionSummary = 'Inoculated aerated fungal tea: hyphal network bridged roots and glued soil crumbs.';
      headlineOutcome = 'Fungal hyphae stitched the root zone together and bound soil crumbs with glomalin.';
      break;
    }

    case 'compost_humus': {
      O.depthMm += 20;
      O.waterHoldingCapacityMm += 10.0;
      next.management.residueCoverFraction = Math.min(
        1.0,
        Number((next.management.residueCoverFraction + 0.45).toFixed(2))
      );
      next.management.amendment = 'biochar';
      addCarbonToHorizon('O', 2.1);
      addCarbonToHorizon('A', 2.4);
      A.aggregateStability = Math.min(0.95, Number((A.aggregateStability + 0.20).toFixed(2)));
      A.bulkDensityGcm3 = Math.max(1.16, Number((A.bulkDensityGcm3 - 0.16).toFixed(2)));
      A.saturatedConductivityMmPerHr = Math.min(58, Number((A.saturatedConductivityMmPerHr + 15).toFixed(1)));
      next.biology.fungalToBacterialRatio = Number(
        (next.biology.fungalToBacterialRatio + 0.52).toFixed(2)
      );
      next.biology.earthwormActivityIndex = Math.min(100, next.biology.earthwormActivityIndex + 18);
      next.water.crustThicknessMm = Math.max(0, Number((next.water.crustThicknessMm - 1.5).toFixed(2)));
      next.water.isCrusted = next.water.crustThicknessMm > 0.5;

      for (const col of next.columns) {
        col.mulchDepthMm += 20;
        col.surfaceCrustMm = Math.max(0, col.surfaceCrustMm - 1.5);
        col.aHorizonCompacted = false;
        col.mycelialDensity = Math.min(1.0, col.mycelialDensity + 0.24);
      }
      for (const link of next.hyphalLinks) {
        link.isActive = true;
        link.conductance = Math.min(1.0, link.conductance + 0.18);
      }

      actionSummary = 'Topdressed living compost and humus: earthworm burrows and aggregates surged.';
      headlineOutcome = 'Living compost drew earthworms deep into the topsoil and locked carbon into dark humus.';
      break;
    }

    case 'tillage': {
      next.management.tillageType = 'rototill';
      next.management.tillageDepthMm = 150;
      next.biology.fungalToBacterialRatio = Math.max(
        0.05,
        Number((next.biology.fungalToBacterialRatio * 0.25).toFixed(2))
      );
      next.biology.activeMyceliumLengthM = Math.max(10, Math.round(next.biology.activeMyceliumLengthM * 0.15));
      next.biology.earthwormActivityIndex = Math.max(2, Math.round(next.biology.earthwormActivityIndex * 0.35));
      A.aggregateStability = Math.max(0.05, Number((A.aggregateStability * 0.30).toFixed(2)));
      A.bulkDensityGcm3 = Math.min(1.75, Number((A.bulkDensityGcm3 + 0.14).toFixed(2)));
      A.saturatedConductivityMmPerHr = Math.max(5.0, Number((A.saturatedConductivityMmPerHr * 0.45).toFixed(1)));
      next.management.residueCoverFraction = Math.max(
        0.02,
        Number((next.management.residueCoverFraction * 0.2).toFixed(2))
      );
      O.depthMm = Math.max(2, Math.round(O.depthMm * 0.3));
      oxidizeCarbonFromHorizon('A', 1.45);

      for (const link of next.hyphalLinks) {
        link.conductance = 0.0;
        link.isActive = false;
      }
      for (const col of next.columns) {
        col.mycelialDensity = 0.05;
        col.aHorizonCompacted = true;
        col.mulchDepthMm = Math.max(2, Math.round(col.mulchDepthMm * 0.3));
        col.surfaceCrustMm = Math.min(4.5, col.surfaceCrustMm + 1.2);
        col.bulkDensityGcm3 = Math.min(1.75, col.bulkDensityGcm3 + 0.15);
      }

      actionSummary = 'Mechanical tillage shattered fungal hyphae, crumbled aggregates, and vented soil carbon.';
      headlineOutcome = 'Tillage snapped the fungal web, crumbled soil structure, and turned the bare surface grey.';
      break;
    }

    case 'graze_heavy': {
      next.management.grazing = 'continuous_overgrazing';
      next.management.residueCoverFraction = Math.max(
        0.05,
        Number((next.management.residueCoverFraction * 0.35).toFixed(2))
      );
      A.bulkDensityGcm3 = Math.min(1.78, Number((A.bulkDensityGcm3 + 0.15).toFixed(2)));
      A.aggregateStability = Math.max(0.08, Number((A.aggregateStability * 0.55).toFixed(2)));
      A.saturatedConductivityMmPerHr = Math.max(5.5, Number((A.saturatedConductivityMmPerHr * 0.55).toFixed(1)));
      next.biology.fungalToBacterialRatio = Math.max(
        0.08,
        Number((next.biology.fungalToBacterialRatio * 0.50).toFixed(2))
      );
      oxidizeCarbonFromHorizon('O', 0.55);

      for (const col of next.columns) {
        col.aHorizonCompacted = true;
        col.mulchDepthMm = Math.max(2, Math.round(col.mulchDepthMm * 0.4));
        col.surfaceCrustMm = Math.min(4.5, col.surfaceCrustMm + 0.9);
        col.mycelialDensity = Math.max(0.06, col.mycelialDensity * 0.5);
      }
      for (const link of next.hyphalLinks) {
        link.conductance = Number((link.conductance * 0.4).toFixed(2));
      }

      actionSummary = 'Continuous heavy grazing stripped surface cover and compacted the root zone.';
      headlineOutcome = 'Heavy hooves compacted the topsoil pores and stripped the protective mulch blanket.';
      break;
    }

    case 'harvest_clear': {
      next.management.harvest = 'clearcut';
      next.management.residueCoverFraction = Math.max(
        0.04,
        Number((next.management.residueCoverFraction * 0.30).toFixed(2))
      );
      A.aggregateStability = Math.max(0.08, Number((A.aggregateStability * 0.45).toFixed(2)));
      next.biology.fungalToBacterialRatio = Math.max(
        0.06,
        Number((next.biology.fungalToBacterialRatio * 0.40).toFixed(2))
      );
      oxidizeCarbonFromHorizon('A', 0.95);

      for (const link of next.hyphalLinks) {
        link.conductance = 0.0;
        link.isActive = false;
      }
      for (const col of next.columns) {
        col.mycelialDensity = Math.max(0.05, col.mycelialDensity * 0.35);
        col.surfaceCrustMm = Math.min(4.5, col.surfaceCrustMm + 1.0);
      }

      actionSummary = 'Heavy harvest severed root exudates and collapsed mycorrhizal bridges.';
      headlineOutcome = 'Canopy removal cut off root sugars, starving the mycorrhizal bridge between plants.';
      break;
    }

    case 'synthetic_npk_buff': {
      next.management.amendment = 'synthetic_npk';
      next.biology.fungalToBacterialRatio = Math.max(
        0.05,
        Number((next.biology.fungalToBacterialRatio * 0.55).toFixed(2))
      );
      A.bulkDensityGcm3 = Math.min(1.85, Number((A.bulkDensityGcm3 + 0.12).toFixed(2)));
      A.aggregateStability = Math.max(0.05, Number((A.aggregateStability * 0.65).toFixed(2)));
      oxidizeCarbonFromHorizon('A', 0.85);

      for (const col of next.columns) {
        col.mycelialDensity = Math.max(0.05, col.mycelialDensity * 0.55);
        col.bulkDensityGcm3 = Math.min(1.85, col.bulkDensityGcm3 + 0.12);
      }

      actionSummary = 'Synthetic salt fertilizer burned fungal hyphae and tightened bulk density.';
      headlineOutcome = 'Synthetic salt fertilizer collapsed fungal symbionts and hardened the topsoil.';
      break;
    }

    case 'plant_seedling': {
      const colIdx = action.targetColumnIndex ?? (next.plants.length % 16);
      const newPlant: Plant = {
        id: `plant-${next.plants.length + 1}`,
        species: action.plantSpecies || 'native_perennial',
        ageDays: 1,
        biomassKg: 0.25,
        carbonAllocationKgPerDay: 0.02,
        rootDepthMm: 90,
        mycorrhizalColonization: next.biology.fungalToBacterialRatio >= 0.8 ? 0.35 : 0.05,
        isAlive: true,
        donorPriority: 0.1,
        columnIndex: colIdx,
      };
      next.plants.push(newPlant);
      if (next.columns[colIdx]) {
        next.columns[colIdx].plantId = newPlant.id;
      }
      const nurse = next.plants.find((p) => p.isAlive && p.donorPriority > 0.7);
      if (nurse && next.biology.fungalToBacterialRatio >= 0.5) {
        next.hyphalLinks.push({
          id: `link-${nurse.id}-${newPlant.id}`,
          plantAId: nurse.id,
          plantBId: newPlant.id,
          conductance: 0.45,
          lengthM: 1.8,
          isActive: true,
          cumulativeCarbonTransferredKg: 0.0,
        });
      }
      addCarbonToHorizon('A', 0.35);
      actionSummary = 'Planted native seedling into the rhizosphere guild.';
      headlineOutcome = 'New living roots tapped into the fungal network and began pumping liquid carbon.';
      break;
    }

    case 'cut_plant': {
      const targetId = action.targetPlantId || 'nurse-tree-1';
      const target = next.plants.find((p) => p.id === targetId);
      if (target) {
        target.isAlive = false;
        target.carbonAllocationKgPerDay = 0;
        for (const link of next.hyphalLinks) {
          if (link.plantAId === targetId || link.plantBId === targetId) {
            link.isActive = false;
            link.conductance = 0;
          }
        }
        actionSummary = `Cut plant ${targetId}: hyphal links collapsed.`;
        headlineOutcome = 'Felling the nurse tree severed the carbon lifeline to the young seedling.';
      }
      break;
    }

    case 'rest':
    default: {
      actionSummary = 'Rain event swept across the field.';
      break;
    }
  }

  // -------------------------------------------------------------
  // 2. MYCORRHIZAL CARBON TRANSFER
  // -------------------------------------------------------------
  let carbonTransferredViaHyphaeKg = 0;
  for (const link of next.hyphalLinks) {
    if (!link.isActive || link.conductance <= 0) continue;
    const pA = next.plants.find((p) => p.id === link.plantAId);
    const pB = next.plants.find((p) => p.id === link.plantBId);
    if (pA && pB && pA.isAlive && pB.isAlive) {
      const donor = pA.donorPriority >= pB.donorPriority ? pA : pB;
      const recipient = donor === pA ? pB : pA;
      const fbFactor = Math.min(1.5, Math.max(0.1, next.biology.fungalToBacterialRatio));
      const transferRate = Number(
        Math.min(
          donor.carbonAllocationKgPerDay * 0.35,
          link.conductance * 0.15 * fbFactor
        ).toFixed(3)
      );
      if (transferRate > 0) {
        donor.carbonAllocationKgPerDay = Number(
          Math.max(0.05, donor.carbonAllocationKgPerDay - transferRate * 0.2).toFixed(3)
        );
        recipient.biomassKg = Number((recipient.biomassKg + transferRate * 0.85).toFixed(3));
        recipient.rootDepthMm = Math.min(420, recipient.rootDepthMm + Math.round(transferRate * 110));
        link.cumulativeCarbonTransferredKg = Number(
          (link.cumulativeCarbonTransferredKg + transferRate).toFixed(3)
        );
        carbonTransferredViaHyphaeKg = Number(
          (carbonTransferredViaHyphaeKg + transferRate).toFixed(3)
        );
        // Exudate deposition into B horizon bank when hyphae flow
        addCarbonToHorizon('B', transferRate);
      }
    }
  }

  // -------------------------------------------------------------
  // 3. INFILTRATION & RUNOFF ENGINE (PASS 1)
  // -------------------------------------------------------------
  const runoffOutput = calculateInfiltrationAndRunoff(next, rain);

  next.water.crustThicknessMm = Number(
    (next.water.crustThicknessMm + runoffOutput.crustFormedMm).toFixed(2)
  );
  next.water.isCrusted = next.water.crustThicknessMm > 0.5;
  next.water.infiltrationRateMmPerHr = runoffOutput.effectiveInfiltrationRateMmPerHr;
  next.water.totalWaterInMm = Number(
    (next.water.totalWaterInMm + runoffOutput.waterInMm).toFixed(2)
  );
  next.water.totalInfiltratedMm = Number(
    (next.water.totalInfiltratedMm + runoffOutput.waterInfiltratedMm).toFixed(2)
  );
  next.water.runoffVolumeMm = Number(
    (next.water.runoffVolumeMm + runoffOutput.waterShedMm).toFixed(2)
  );
  next.water.topsoilExportedKg = Number(
    (next.water.topsoilExportedKg + runoffOutput.topsoilCarbonExportedKg).toFixed(3)
  );

  // Deduct eroded carbon from A-horizon pool and increment off-plot loss
  if (runoffOutput.topsoilCarbonExportedKg > 0) {
    const exported = runoffOutput.topsoilCarbonExportedKg;
    next.carbon.poolByHorizonKg.A = Number(
      (next.carbon.poolByHorizonKg.A - exported).toFixed(3)
    );
    next.carbon.lossOffPlotKg = Number(
      (next.carbon.lossOffPlotKg + exported).toFixed(3)
    );
  }

  // Reconcile currentTotalCarbonKg exactly
  next.carbon.currentTotalCarbonKg = sumHorizonCarbonKg(next.carbon.poolByHorizonKg);

  // Distribute infiltrated water sequentially down horizons
  let remainingInfil = runoffOutput.waterInfiltratedMm;

  const oDeficit = Math.max(0, O.waterHoldingCapacityMm - O.currentWaterMm);
  const oAbs = Number(Math.min(remainingInfil, oDeficit).toFixed(2));
  O.currentWaterMm = Number((O.currentWaterMm + oAbs).toFixed(2));
  remainingInfil = Number((remainingInfil - oAbs).toFixed(2));

  const aDeficit = Math.max(0, A.waterHoldingCapacityMm - A.currentWaterMm);
  const aAbs = Number(Math.min(remainingInfil, aDeficit).toFixed(2));
  A.currentWaterMm = Number((A.currentWaterMm + aAbs).toFixed(2));
  remainingInfil = Number((remainingInfil - aAbs).toFixed(2));

  const eDeficit = Math.max(0, E.waterHoldingCapacityMm - E.currentWaterMm);
  const eAbs = Number(Math.min(remainingInfil, eDeficit).toFixed(2));
  E.currentWaterMm = Number((E.currentWaterMm + eAbs).toFixed(2));
  remainingInfil = Number((remainingInfil - eAbs).toFixed(2));

  const bDeficit = Math.max(0, B.waterHoldingCapacityMm - B.currentWaterMm);
  const bAbs = Number(Math.min(remainingInfil, bDeficit).toFixed(2));
  B.currentWaterMm = Number((B.currentWaterMm + bAbs).toFixed(2));
  remainingInfil = Number((remainingInfil - bAbs).toFixed(2));

  next.water.deepPercolationMm = Number((next.water.deepPercolationMm + remainingInfil).toFixed(2));

  if (!headlineOutcome) {
    if (runoffOutput.waterShedMm > runoffOutput.waterInfiltratedMm) {
      headlineOutcome = `Rain hit sealed crust: ${runoffOutput.waterShedMm.toFixed(0)} mm sheeted off and carried topsoil away.`;
    } else {
      headlineOutcome = `Open pores drank ${runoffOutput.waterInfiltratedMm.toFixed(0)} mm of rain deep into the subsoil moisture bank.`;
    }
  }

  // -------------------------------------------------------------
  // 4. FUNCTIONAL GROUP UNLOCKS & COOPERATIVE STAKES
  // -------------------------------------------------------------
  const groups = new Set(next.season.unlockedFunctionalGroups || []);
  if (next.biology.fungalToBacterialRatio >= 0.65) groups.add('fungus');
  if (next.horizons.A.aggregateStability >= 0.35 || next.plants.length >= 2) groups.add('plant');
  if (next.biology.earthwormActivityIndex >= 15) groups.add('invertebrate');
  next.season.unlockedFunctionalGroups = Array.from(groups);

  const yieldUnits = runoffOutput.waterInfiltratedMm * 0.05 + carbonTransferredViaHyphaeKg * 2.0;
  if (yieldUnits > 0) {
    const credits = Number(
      (yieldUnits * next.cooperativeLedger.cooperativeMultiplier).toFixed(2)
    );
    next.cooperativeLedger.carbonBiomassCredits = Number(
      (next.cooperativeLedger.carbonBiomassCredits + credits).toFixed(2)
    );
    const playerFraction = next.cooperativeLedger.playerStakePercent / 100;
    next.cooperativeLedger.mycorrhizalPatronage = Number(
      (next.cooperativeLedger.mycorrhizalPatronage + credits * playerFraction).toFixed(2)
    );
  }

  const fbRatioDelta = Number((next.biology.fungalToBacterialRatio - initialFb).toFixed(2));

  const auditEntry: FieldAuditEntry = {
    timestampIso: new Date().toISOString(),
    stewardId: steward,
    actionType: action.type,
    summary: `${actionSummary} Rain: ${runoffOutput.waterInMm.toFixed(1)}mm (Infiltrated: ${runoffOutput.waterInfiltratedMm.toFixed(1)}mm, Runoff: ${runoffOutput.waterShedMm.toFixed(1)}mm, Carbon loss: ${runoffOutput.topsoilCarbonExportedKg}kg).`,
  };
  next.auditLog.unshift(auditEntry);
  if (next.auditLog.length > 50) {
    next.auditLog.pop();
  }

  return {
    state: next,
    rainEventApplied: rain,
    actionApplied: action,
    infiltrationMm: runoffOutput.waterInfiltratedMm,
    runoffMm: runoffOutput.waterShedMm,
    erosionLossCarbonKg: runoffOutput.topsoilCarbonExportedKg,
    carbonTransferredViaHyphaeKg,
    crustFormedMm: runoffOutput.crustFormedMm,
    fbRatioDelta,
    summary: auditEntry.summary,
    headlineOutcome,
  };
}

/**
 * Executes one of the three core player gesture verbs: Water, Feed, or Disturb.
 */
export function performGestureVerb(
  state: SoilSimulationState,
  verb: CoreVerb,
  subMode?: FeedSubMode | DisturbSubMode
): TickResult {
  if (verb === 'water') {
    const stormRain: RainEvent = {
      intensityMmPerHour: 42.0,
      durationHours: 1.0,
      dropletImpactEnergy: 1.9,
    };
    return tick(state, { type: 'rest', verb: 'water' }, stormRain);
  }

  if (verb === 'feed') {
    const mode: FeedSubMode =
      (subMode as FeedSubMode) ||
      (state.management.residueCoverFraction < 0.5
        ? 'mulch'
        : state.biology.fungalToBacterialRatio < 1.0
        ? 'tea'
        : 'compost');

    const actionType =
      mode === 'mulch'
        ? 'mulch_woodchips'
        : mode === 'tea'
        ? 'inoculate_fungal_tea'
        : 'compost_humus';

    const gentleRain: RainEvent = {
      intensityMmPerHour: 8.0,
      durationHours: 1.0,
      dropletImpactEnergy: 0.4,
    };
    return tick(state, { type: actionType, verb: 'feed' }, gentleRain);
  }

  // Disturb verb
  const dMode: DisturbSubMode = (subMode as DisturbSubMode) || 'till';
  const actionType =
    dMode === 'graze'
      ? 'graze_heavy'
      : dMode === 'harvest'
      ? 'harvest_clear'
      : 'tillage';

  const squallRain: RainEvent = {
    intensityMmPerHour: 22.0,
    durationHours: 1.0,
    dropletImpactEnergy: 1.5,
  };
  return tick(state, { type: actionType, verb: 'disturb' }, squallRain);
}

/**
 * Advances to the next season (1 -> 2 -> 3 -> 4) and unlocks one horizon deeper:
 * Season 1: O, A
 * Season 2: O, A, E
 * Season 3: O, A, E, B
 * Season 4+: O, A, E, B, C
 */
export function advanceToNextSeason(state: SoilSimulationState): SoilSimulationState {
  const next = cloneState(state);
  next.season.seasonNumber += 1;
  next.season.decisionsTakenInSeason = 0;
  next.season.seasonPhase = 'spring_wakeup';

  const order: HorizonType[] = ['O', 'A', 'E', 'B', 'C'];
  const unlockCount = Math.min(order.length, next.season.seasonNumber + 1);
  next.season.unlockedHorizons = order.slice(0, unlockCount);

  return next;
}

/**
 * Computes the single headline Season Score (0-100 Sponge & Carbon Index) and one-sentence summary
 * of what the soil became.
 */
export function evaluateSeasonOutcome(state: SoilSimulationState): {
  livingSoilScore: number;
  soilBecameLine: string;
  nextHorizonUnlockLine: string;
} {
  const waterIn = state.water.totalWaterInMm;
  const infilFraction = waterIn > 0 ? state.water.totalInfiltratedMm / waterIn : 0.5;
  const fbScore = Math.min(1.0, state.biology.fungalToBacterialRatio / 2.0);
  const aggScore = state.horizons.A.aggregateStability;
  const netCarbonDelta = state.carbon.currentTotalCarbonKg - state.carbon.initialTotalCarbonKg;
  const carbonScore = Math.max(0, Math.min(1.0, (netCarbonDelta + 3) / 12));

  const livingSoilScore = Math.round(
    (infilFraction * 35 + fbScore * 30 + aggScore * 20 + carbonScore * 15)
  );

  let soilBecameLine = '';
  if (state.biology.fungalToBacterialRatio >= 1.1 && state.horizons.A.aggregateStability >= 0.5) {
    soilBecameLine =
      'Your compacted dirt became a living fungal sponge that drinks storms and shares carbon between roots.';
  } else if (state.water.runoffVolumeMm > state.water.totalInfiltratedMm) {
    soilBecameLine =
      'Your bare crust shed most of the rain sideways, washing topsoil carbon off the plot.';
  } else if (state.biology.fungalToBacterialRatio < 0.25) {
    soilBecameLine =
      'Your disturbed soil collapsed into grey bacterial dust with severed fungal threads.';
  } else {
    soilBecameLine =
      'Your topsoil cracked its surface crust and began weaving the first fungal threads between roots.';
  }

  const nextSeason = state.season.seasonNumber + 1;
  let nextHorizonUnlockLine = '';
  if (nextSeason === 2) {
    nextHorizonUnlockLine = 'Season 2 unlocks the E Horizon mineral filter below the root zone.';
  } else if (nextSeason === 3) {
    nextHorizonUnlockLine = 'Season 3 unlocks the deep B Horizon clay moisture bank.';
  } else if (nextSeason === 4) {
    nextHorizonUnlockLine = 'Season 4 unlocks the C Horizon parent bedrock and full profile mastery.';
  } else {
    nextHorizonUnlockLine = `Season ${nextSeason} deepens your perennial canopy across all five horizons.`;
  }

  return {
    livingSoilScore,
    soilBecameLine,
    nextHorizonUnlockLine,
  };
}
