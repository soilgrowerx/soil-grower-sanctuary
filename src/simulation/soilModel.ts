import type {
  SoilSimulationState,
  HorizonType,
  HorizonState,
  BiologyState,
  WaterState,
  CarbonState,
  ManagementState,
  SeasonState,
  Plant,
  HyphalLink,
  RainEvent,
  ManagementAction,
  InfiltrationRunoffOutput,
  TickResult,
  FieldAuditEntry,
  SanctuaryColumn,
} from './types.ts';

/**
 * Creates an initial degraded urban soil state.
 * Implements the canonical Section 2 model:
 * site, horizons (O, A, E, B, C), biology, water, carbon, management, season.
 */
export function createDefaultSoilState(fieldId = 'sanctuary-zero', seed = 42): SoilSimulationState {
  const horizons: Record<HorizonType, HorizonState> = {
    O: {
      type: 'O',
      name: 'Organic Layer (Litter / Mulch)',
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
      name: 'Topsoil (Biologically Active Root Zone)',
      depthMm: 140,
      organicMatterPercent: 1.8,
      aggregateStability: 0.20, // Weak, degraded aggregates
      bulkDensityGcm3: 1.62,   // Compacted urban hardpan
      waterHoldingCapacityMm: 45.0,
      currentWaterMm: 18.0,
      saturatedConductivityMmPerHr: 8.0, // Low infiltration
    },
    E: {
      type: 'E',
      name: 'Eluviated Horizon (Leached Mineral Zone)',
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
      name: 'Subsoil (Illuvial Clay & Mineral Bank)',
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
      name: 'Parent Material (Weathered Calcareous Substrate)',
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
      columnIndex: 10,
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
    mulchDepthMm: i % 4 === 0 ? 25 : 5,
    surfaceCrustMm: i % 4 === 0 ? 0 : 2.5,
    aHorizonCompacted: i % 4 !== 0,
    bulkDensityGcm3: i % 4 === 0 ? 1.25 : 1.62,
    mycelialDensity: i % 4 === 0 ? 0.65 : 0.15,
    plantId: i === 4 ? 'nurse-tree-1' : i === 10 ? 'seedling-oak-2' : undefined,
  }));

  return {
    site: {
      climateZone: 'USDA Zone 8b, Subtropical Subhumid',
      baselineRecordReference: 'USDA-NRCS MLRA 86A Texas Blackland Clay',
      soilSeries: 'Houston Black / Austin Silty Clay Loam',
    },
    horizons,
    biology: {
      fungalToBacterialRatio: 0.20,
      mycorrhizalColonizationPercent: 8.5,
      earthwormActivityIndex: 5, // Very low initial activity in compacted urban clay
      microbialBiomassCarbonMgPerKg: 180,
      activeMyceliumLengthM: 120,
    },
    water: {
      infiltrationRateMmPerHr: 8.0,
      runoffVolumeMm: 0,
      topsoilExportedKg: 0,
      crustThicknessMm: 2.5,
      isCrusted: true,
      deepPercolationMm: 0,
    },
    carbon: {
      poolByHorizonKg: carbonPool,
      fluxToAtmosphereKg: 0,
      lossOffPlotKg: 0,
    },
    management: {
      tillageType: 'none',
      tillageDepthMm: 0,
      residueCoverFraction: 0.15, // Bare, degraded surface
      amendment: 'none',
      coverCrop: 'none',
      grazing: 'none',
      harvest: 'none',
    },
    season: {
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
        summary: 'Sanctuary Zero initialized: Houston Black clay, crusted A-horizon, bacterial F:B 0.20.',
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
 */
export function calculateInfiltrationAndRunoff(
  state: SoilSimulationState,
  rain: RainEvent
): InfiltrationRunoffOutput {
  const totalRainMm = rain.intensityMmPerHour * rain.durationHours;
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
  // Base saturated conductivity modulated by crust resistance, aggregates, and macropores
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

  const waterInfiltratedMm = Math.min(totalRainMm, potentialInfiltrationCapacityMm);
  const waterShedMm = Math.max(0, totalRainMm - waterInfiltratedMm);

  // 5. Runoff erosion: topsoil carbon export off-plot
  let topsoilCarbonExportedKg = 0;
  if (waterShedMm > 0) {
    const shearVulnerability = (1.0 - residueCover) * (1.0 - aggregateStability);
    topsoilCarbonExportedKg = Number(
      (waterShedMm * shearVulnerability * (state.carbon.poolByHorizonKg.A * 0.025)).toFixed(3)
    );
  }

  return {
    waterInfiltratedMm: Number(waterInfiltratedMm.toFixed(2)),
    waterShedMm: Number(waterShedMm.toFixed(2)),
    topsoilCarbonExportedKg: Number(topsoilCarbonExportedKg.toFixed(3)),
    crustFormedMm: Number(crustFormedMm.toFixed(2)),
    effectiveInfiltrationRateMmPerHr: Number(effectiveInfiltrationRateMmPerHr.toFixed(2)),
  };
}

/**
 * Master deterministic simulation tick.
 * Reads and mutates the unified SoilSimulationState.
 */
export function tick(
  currentState: SoilSimulationState,
  action: ManagementAction,
  rain: RainEvent
): TickResult {
  const next = cloneState(currentState);
  next.season.dayIndex += 1;
  next.season.currentRainEvent = rain;

  const steward = action.stewardId || 'steward-local';
  let fbRatioDelta = 0;
  let actionSummary = '';

  const O = next.horizons.O;
  const A = next.horizons.A;
  const E = next.horizons.E;
  const B = next.horizons.B;

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
        next.management.residueCoverFraction + 0.65
      );
      next.management.amendment = 'woodchips';
      next.carbon.poolByHorizonKg.O += 3.5;
      next.biology.fungalToBacterialRatio = Number(
        (next.biology.fungalToBacterialRatio + 0.45).toFixed(2)
      );
      next.biology.activeMyceliumLengthM += 180;

      for (const col of next.columns) {
        col.mulchDepthMm += addedDepth;
        col.surfaceCrustMm = Math.max(0, col.surfaceCrustMm - 1.5);
      }

      actionSummary = 'Applied 35mm coarse woodchip mulch: residue cover increased, feeding fungal biomass.';
      break;
    }

    case 'air_spade_decompact': {
      A.bulkDensityGcm3 = Math.max(1.15, A.bulkDensityGcm3 - 0.28);
      A.saturatedConductivityMmPerHr = Math.min(65, A.saturatedConductivityMmPerHr * 3.5);
      next.water.crustThicknessMm = 0;
      next.water.isCrusted = false;
      next.biology.earthwormActivityIndex = Math.min(100, next.biology.earthwormActivityIndex + 15);
      E.bulkDensityGcm3 = Math.max(1.25, E.bulkDensityGcm3 - 0.15);
      next.management.tillageType = 'air_spade';

      for (const col of next.columns) {
        col.surfaceCrustMm = 0;
        col.aHorizonCompacted = false;
        col.bulkDensityGcm3 = Math.max(1.15, col.bulkDensityGcm3 - 0.28);
      }

      actionSummary = 'AirSpade decompaction: cleared surface crust, lowered bulk density to 1.34 g/cm3, restored macropores.';
      break;
    }

    case 'inoculate_fungal_tea': {
      next.biology.fungalToBacterialRatio = Number(
        (next.biology.fungalToBacterialRatio + 0.65).toFixed(2)
      );
      next.biology.activeMyceliumLengthM += 320;
      next.management.amendment = 'fungal_compost_tea';
      A.aggregateStability = Math.min(0.95, A.aggregateStability + 0.22);
      next.biology.mycorrhizalColonizationPercent = Math.min(
        100,
        next.biology.mycorrhizalColonizationPercent + 20
      );

      for (const plant of next.plants) {
        if (plant.isAlive) {
          plant.mycorrhizalColonization = Math.min(1.0, plant.mycorrhizalColonization + 0.25);
        }
      }
      for (const link of next.hyphalLinks) {
        link.conductance = Math.min(1.0, link.conductance + 0.20);
      }
      for (const col of next.columns) {
        col.mycelialDensity = Math.min(1.0, col.mycelialDensity + 0.25);
      }
      actionSummary = 'Inoculated aerated fungal tea: raised F:B ratio, glomalin glue, and aggregate stability.';
      break;
    }

    case 'tillage': {
      next.management.tillageType = 'rototill';
      next.management.tillageDepthMm = 150;
      next.biology.fungalToBacterialRatio = Math.max(
        0.05,
        Number((next.biology.fungalToBacterialRatio * 0.25).toFixed(2))
      );
      next.biology.activeMyceliumLengthM = Math.max(10, next.biology.activeMyceliumLengthM * 0.15);
      A.aggregateStability = Math.max(0.05, A.aggregateStability * 0.30);
      next.management.residueCoverFraction = Math.max(
        0.02,
        next.management.residueCoverFraction * 0.2
      );

      for (const link of next.hyphalLinks) {
        link.conductance = 0.0;
        link.isActive = false;
      }
      for (const col of next.columns) {
        col.mycelialDensity = 0.05;
        col.bulkDensityGcm3 = Math.min(1.75, col.bulkDensityGcm3 + 0.15);
      }

      actionSummary = 'Tillage: shattered fungal hyphae and macroaggregates; triggered bacterial boom; severed mycorrhizal links.';
      break;
    }

    case 'synthetic_npk_buff': {
      next.management.amendment = 'synthetic_npk';
      next.biology.fungalToBacterialRatio = Math.max(
        0.05,
        Number((next.biology.fungalToBacterialRatio * 0.55).toFixed(2))
      );
      A.bulkDensityGcm3 = Math.min(1.85, A.bulkDensityGcm3 + 0.12);
      A.aggregateStability = Math.max(0.05, A.aggregateStability * 0.65);

      for (const col of next.columns) {
        col.mycelialDensity = Math.max(0.05, col.mycelialDensity * 0.55);
        col.bulkDensityGcm3 = Math.min(1.85, col.bulkDensityGcm3 + 0.12);
      }

      actionSummary = 'Synthetic N-P-K trap: killed 45% of fungi, collapsed aggregates, increased bulk density.';
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
      actionSummary = `Planted seedling: established roots, hyphal connection initiated.`;
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
        actionSummary = `Cut plant ${targetId}: hyphal links collapsed, removing carbon donor pipeline.`;
      }
      break;
    }

    case 'rest':
    default: {
      actionSummary = 'Sanctuary rested: natural microbial turnover.';
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
      const transferRate = Math.min(
        donor.carbonAllocationKgPerDay * 0.35,
        link.conductance * 0.15 * fbFactor
      );
      if (transferRate > 0) {
        donor.carbonAllocationKgPerDay -= transferRate;
        recipient.biomassKg += transferRate * 0.85;
        link.cumulativeCarbonTransferredKg += transferRate;
        carbonTransferredViaHyphaeKg += transferRate;
      }
    }
  }

  // -------------------------------------------------------------
  // 3. INFILTRATION & RUNOFF ENGINE (PASS 1)
  // -------------------------------------------------------------
  const runoffOutput = calculateInfiltrationAndRunoff(next, rain);
  const totalRainMm = rain.intensityMmPerHour * rain.durationHours;

  next.water.crustThicknessMm += runoffOutput.crustFormedMm;
  next.water.isCrusted = next.water.crustThicknessMm > 0.5;
  next.water.infiltrationRateMmPerHr = runoffOutput.effectiveInfiltrationRateMmPerHr;
  next.water.runoffVolumeMm += runoffOutput.waterShedMm;
  next.water.topsoilExportedKg += runoffOutput.topsoilCarbonExportedKg;

  // Deduct eroded carbon from A-horizon pool and increment off-plot loss
  if (runoffOutput.topsoilCarbonExportedKg > 0) {
    next.carbon.poolByHorizonKg.A = Math.max(
      1.0,
      next.carbon.poolByHorizonKg.A - runoffOutput.topsoilCarbonExportedKg
    );
    next.carbon.lossOffPlotKg += runoffOutput.topsoilCarbonExportedKg;
  }

  // Distribute infiltrated water sequentially down horizons
  let remainingInfil = runoffOutput.waterInfiltratedMm;

  const oDeficit = Math.max(0, O.waterHoldingCapacityMm - O.currentWaterMm);
  const oAbs = Math.min(remainingInfil, oDeficit);
  O.currentWaterMm += oAbs;
  remainingInfil -= oAbs;

  const aDeficit = Math.max(0, A.waterHoldingCapacityMm - A.currentWaterMm);
  const aAbs = Math.min(remainingInfil, aDeficit);
  A.currentWaterMm += aAbs;
  remainingInfil -= aAbs;

  const eDeficit = Math.max(0, E.waterHoldingCapacityMm - E.currentWaterMm);
  const eAbs = Math.min(remainingInfil, eDeficit);
  E.currentWaterMm += eAbs;
  remainingInfil -= eAbs;

  const bDeficit = Math.max(0, B.waterHoldingCapacityMm - B.currentWaterMm);
  const bAbs = Math.min(remainingInfil, bDeficit);
  B.currentWaterMm += bAbs;
  remainingInfil -= bAbs;

  next.water.deepPercolationMm += remainingInfil;

  // -------------------------------------------------------------
  // 4. TRIPARTITE COOPERATIVE LEDGER
  // -------------------------------------------------------------
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

  const auditEntry: FieldAuditEntry = {
    timestampIso: new Date().toISOString(),
    stewardId: steward,
    actionType: action.type,
    summary: `${actionSummary} Rain: ${totalRainMm.toFixed(1)}mm (Infiltrated: ${runoffOutput.waterInfiltratedMm.toFixed(1)}mm, Runoff: ${runoffOutput.waterShedMm.toFixed(1)}mm, Carbon loss: ${runoffOutput.topsoilCarbonExportedKg}kg).`,
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
    carbonTransferredViaHyphaeKg: Number(carbonTransferredViaHyphaeKg.toFixed(3)),
    crustFormedMm: runoffOutput.crustFormedMm,
    fbRatioDelta,
    summary: auditEntry.summary,
  };
}
