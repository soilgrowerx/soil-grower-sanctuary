import type {
  SoilState,
  Horizon,
  HorizonType,
  Plant,
  HyphalLink,
  RainEvent,
  ManagementAction,
  TickResult,
  FieldAuditEntry,
  SanctuaryColumn,
} from './types.ts';

/**
 * Creates an initial degraded urban soil state.
 * Typical degraded baseline: compacted A/E horizon, bare O horizon, bacterial dominance.
 * Models Sanctuary Zero with 16 columns and the Tripartite Cooperative Ledger.
 */
export function createDefaultSoilState(fieldId = 'sanctuary-alpha', seed = 42): SoilState {
  const horizons: Record<HorizonType, Horizon> = {
    O: {
      type: 'O',
      name: 'Organic Layer (Litter / Mulch)',
      depthMm: 5,
      bulkDensityGcm3: 0.35,
      organicCarbonKg: 1.2,
      waterContentMm: 1.0,
      fieldCapacityMm: 8.0,
      wiltingPointMm: 1.0,
      aggregateStability: 0.20,
      macroporosity: 0.25,
      saturatedConductivityMmPerHr: 120,
      residueCoverFraction: 0.15, // Bare, degraded surface
    },
    A: {
      type: 'A',
      name: 'Topsoil (Biologically Active Root Zone)',
      depthMm: 140,
      bulkDensityGcm3: 1.62, // Compacted urban hardpan
      organicCarbonKg: 10.5,
      waterContentMm: 22.0,
      fieldCapacityMm: 45.0,
      wiltingPointMm: 15.0,
      aggregateStability: 0.25, // Weak aggregates prone to slaking
      macroporosity: 0.04,      // Very low macroporosity
      saturatedConductivityMmPerHr: 8.0, // Low infiltration
      surfaceCrustThicknessMm: 2.5, // Crusted surface
      glomalinMgPerG: 0.4,
    },
    E: {
      type: 'E',
      name: 'Eluviated Horizon (Leached Mineral Zone)',
      depthMm: 90,
      bulkDensityGcm3: 1.65,
      organicCarbonKg: 2.1,
      waterContentMm: 14.0,
      fieldCapacityMm: 28.0,
      wiltingPointMm: 10.0,
      aggregateStability: 0.20,
      macroporosity: 0.05,
      saturatedConductivityMmPerHr: 12.0,
      leachingIndex: 0.75,
    },
    B: {
      type: 'B',
      name: 'Subsoil (Illuvial Clay & Mineral Bank)',
      depthMm: 380,
      bulkDensityGcm3: 1.55,
      organicCarbonKg: 5.8,
      waterContentMm: 65.0,
      fieldCapacityMm: 140.0,
      wiltingPointMm: 48.0,
      aggregateStability: 0.50,
      macroporosity: 0.08,
      saturatedConductivityMmPerHr: 4.5,
      clayAccumulationPercent: 42,
      mineralPhosphorusKg: 45.0,
    },
    C: {
      type: 'C',
      name: 'Parent Material (Weathered Calcareous Substrate)',
      depthMm: 500,
      bulkDensityGcm3: 1.80,
      organicCarbonKg: 1.0,
      waterContentMm: 40.0,
      fieldCapacityMm: 90.0,
      wiltingPointMm: 35.0,
      aggregateStability: 0.85,
      macroporosity: 0.03,
      saturatedConductivityMmPerHr: 2.0,
    },
  };

  const plants: Plant[] = [
    {
      id: 'nurse-tree-1',
      species: 'climax_tree',
      ageDays: 1200,
      biomassKg: 45.0,
      carbonAllocationKgPerDay: 0.85,
      rootDepthMm: 480, // Roots reach into B horizon
      mycorrhizalColonization: 0.40,
      isAlive: true,
      donorPriority: 0.90, // Nurse plant exports surplus C
      columnIndex: 4,
    },
    {
      id: 'seedling-oak-2',
      species: 'climax_tree',
      ageDays: 30,
      biomassKg: 0.60,
      carbonAllocationKgPerDay: 0.04,
      rootDepthMm: 120, // Shallow root in A horizon
      mycorrhizalColonization: 0.20,
      isAlive: true,
      donorPriority: 0.15, // Recipient sapling needs C subsidy
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

  const bacterialBiomassKg = 8.5;
  const fungalBiomassKg = 1.7; // F:B = 0.20 (bacterial dominated degraded lot)

  // 16-Column Sanctuary spatial grid per Master Plan Section 3.1
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
    fieldId,
    day: 1,
    horizons,
    microbial: {
      bacterialBiomassKg,
      fungalBiomassKg,
      fbRatio: Number((fungalBiomassKg / bacterialBiomassKg).toFixed(3)),
      activeMyceliumLengthM: 120,
    },
    plants,
    hyphalLinks,
    waterBalance: {
      surfacePondingMm: 0,
      totalRunoffMm: 0,
      cumulativeErosionLossKgCarbon: 0,
      deepPercolationMm: 0,
    },
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
        summary: 'Sanctuary Zero initialized: crusted A-horizon, bacterial F:B 0.20, tripartite ledger online.',
      },
    ],
    seed,
  };
}

/**
 * Deep clone utility for immutable tick transitions
 */
function cloneState(state: SoilState): SoilState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Master deterministic simulation tick.
 * Applies one management action and one weather/rain event.
 */
export function tick(
  currentState: SoilState,
  action: ManagementAction,
  rain: RainEvent
): TickResult {
  const next = cloneState(currentState);
  next.day += 1;

  const steward = action.stewardId || 'steward-local';
  let fbRatioDelta = 0;
  let actionSummary = '';

  // -------------------------------------------------------------
  // 1. APPLY MANAGEMENT ACTION
  // -------------------------------------------------------------
  const O = next.horizons.O;
  const A = next.horizons.A;
  const E = next.horizons.E;
  const B = next.horizons.B;

  switch (action.type) {
    case 'mulch_woodchips': {
      const addedDepth = 35; // mm of coarse woody mulch
      O.depthMm += addedDepth;
      O.fieldCapacityMm += 16.0; // Woodchip sponge absorbs storm pulses
      O.residueCoverFraction = Math.min(1.0, (O.residueCoverFraction || 0) + 0.65);
      O.organicCarbonKg += 3.5;
      // High C:N substrate feeds saprophytic fungi over bacteria
      next.microbial.fungalBiomassKg += 1.8;
      next.microbial.activeMyceliumLengthM += 180;

      // Update sanctuary columns
      for (const col of next.columns) {
        col.mulchDepthMm += addedDepth;
        col.surfaceCrustMm = Math.max(0, col.surfaceCrustMm - 1.5);
      }

      actionSummary = 'Applied 35mm arborist woodchip mulch: residue cover increased, feeding fungal biomass.';
      break;
    }

    case 'air_spade_decompact': {
      // Supersonic air decompaction shatters compaction without severing structural roots
      A.bulkDensityGcm3 = Math.max(1.15, A.bulkDensityGcm3 - 0.28);
      A.macroporosity = Math.min(0.25, A.macroporosity + 0.14);
      A.surfaceCrustThicknessMm = 0; // Completely clears surface sealing
      A.saturatedConductivityMmPerHr = Math.min(65, A.saturatedConductivityMmPerHr * 3.5);
      E.bulkDensityGcm3 = Math.max(1.25, E.bulkDensityGcm3 - 0.15);
      E.macroporosity = Math.min(0.18, E.macroporosity + 0.08);
      // Biological aeration benefit
      next.microbial.fungalBiomassKg += 0.4;
      next.microbial.activeMyceliumLengthM += 80;

      // Update sanctuary columns
      for (const col of next.columns) {
        col.surfaceCrustMm = 0;
        col.aHorizonCompacted = false;
        col.bulkDensityGcm3 = Math.max(1.15, col.bulkDensityGcm3 - 0.28);
      }

      actionSummary = 'Air-Spade decompaction: erased surface crust, lowered bulk density to 1.34 g/cm3, expanded macropores.';
      break;
    }

    case 'inoculate_fungal_tea': {
      // Actively aerated fungal compost tea adds fungal spores, glomalin precursors
      next.microbial.fungalBiomassKg += 2.6;
      next.microbial.activeMyceliumLengthM += 320;
      A.glomalinMgPerG = (A.glomalinMgPerG || 0.4) + 0.6;
      // Glomalin cements microaggregates into stable macroaggregates
      A.aggregateStability = Math.min(0.95, A.aggregateStability + 0.22);
      // Boost mycorrhizal colonization across living roots
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
      actionSummary = 'Inoculated aerated fungal tea: boosted fungal biomass, elevated glomalin and aggregate stability.';
      break;
    }

    case 'tillage': {
      // Mechanical inversion / rototilling:
      // 1. Physically severs and shatters fungal hyphal networks
      next.microbial.fungalBiomassKg = Math.max(0.2, next.microbial.fungalBiomassKg * 0.25);
      next.microbial.activeMyceliumLengthM = Math.max(10, next.microbial.activeMyceliumLengthM * 0.15);
      // 2. Breaks soil macroaggregates into dust
      A.aggregateStability = Math.max(0.05, A.aggregateStability * 0.30);
      A.macroporosity = Math.max(0.01, A.macroporosity * 0.30);
      // 3. Deactivates all mycorrhizal hyphal links
      for (const link of next.hyphalLinks) {
        link.conductance = 0.0;
        link.isActive = false;
      }
      // 4. Aerates labile carbon, causing bacterial population explosion
      next.microbial.bacterialBiomassKg *= 2.4;
      // 5. Destroys surface residue cover
      O.residueCoverFraction = Math.max(0.02, (O.residueCoverFraction || 0.1) * 0.2);

      for (const col of next.columns) {
        col.mycelialDensity = 0.05;
        col.bulkDensityGcm3 = Math.min(1.75, col.bulkDensityGcm3 + 0.15);
      }

      actionSummary = 'Tillage: shattered fungal hyphae and macroaggregates; triggered bacterial boom; severed mycorrhizal links.';
      break;
    }

    case 'synthetic_npk_buff': {
      // Synthetic N-P-K Trap (Section 3.1):
      // Spikes salinity, kills 45% of fungal biomass, collapses glomalin aggregates, increases bulk density
      next.microbial.fungalBiomassKg = Math.max(0.1, next.microbial.fungalBiomassKg * 0.55);
      next.microbial.activeMyceliumLengthM = Math.max(10, next.microbial.activeMyceliumLengthM * 0.50);
      A.bulkDensityGcm3 = Math.min(1.85, A.bulkDensityGcm3 + 0.12);
      A.aggregateStability = Math.max(0.05, A.aggregateStability * 0.65);
      A.glomalinMgPerG = Math.max(0.1, (A.glomalinMgPerG || 0.4) * 0.5);
      next.microbial.bacterialBiomassKg *= 1.35;

      for (const col of next.columns) {
        col.mycelialDensity = Math.max(0.05, col.mycelialDensity * 0.55);
        col.bulkDensityGcm3 = Math.min(1.85, col.bulkDensityGcm3 + 0.12);
      }

      actionSummary = 'Synthetic N-P-K trap triggered: killed 45% of fungal biomass, collapsed glomalin aggregates, increased bulk density by +0.12 g/cm3.';
      break;
    }

    case 'cut_plant': {
      const targetId = action.targetPlantId || 'nurse-tree-1';
      const target = next.plants.find((p) => p.id === targetId);
      if (target) {
        target.isAlive = false;
        target.carbonAllocationKgPerDay = 0;
        // Hyphal links connected to target plant collapse
        for (const link of next.hyphalLinks) {
          if (link.plantAId === targetId || link.plantBId === targetId) {
            link.isActive = false;
            link.conductance = 0;
          }
        }
        actionSummary = `Severed/cut plant ${targetId}: hyphal links collapsed, removing carbon donor pipeline.`;
      }
      break;
    }

    case 'plant_seedling': {
      const newSpecies = action.plantSpecies || 'native_perennial';
      const colIdx = action.targetColumnIndex ?? (next.plants.length % 16);
      const newPlant: Plant = {
        id: `plant-${next.plants.length + 1}`,
        species: newSpecies,
        ageDays: 1,
        biomassKg: 0.25,
        carbonAllocationKgPerDay: 0.02,
        rootDepthMm: 90,
        mycorrhizalColonization: next.microbial.fbRatio >= 0.8 ? 0.35 : 0.05,
        isAlive: true,
        donorPriority: 0.1,
        columnIndex: colIdx,
      };
      next.plants.push(newPlant);
      if (next.columns[colIdx]) {
        next.columns[colIdx].plantId = newPlant.id;
      }
      // If living nurse tree exists and F:B > 0.5, connect via hyphae
      const nurse = next.plants.find((p) => p.isAlive && p.donorPriority > 0.7);
      if (nurse && next.microbial.fbRatio >= 0.5) {
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
      actionSummary = `Planted ${newSpecies}: root established in A horizon, hyphal link initiated.`;
      break;
    }

    case 'rest':
    default: {
      // Natural turnover: slight fungal hyphal growth if residue exists
      if ((O.residueCoverFraction || 0) > 0.4) {
        next.microbial.fungalBiomassKg += 0.2;
      }
      actionSummary = 'Field rested: natural microbial turnover.';
      break;
    }
  }

  // Update F:B ratio
  const oldFb = next.microbial.fbRatio;
  next.microbial.fbRatio = Number(
    (next.microbial.fungalBiomassKg / Math.max(0.001, next.microbial.bacterialBiomassKg)).toFixed(3)
  );
  fbRatioDelta = Number((next.microbial.fbRatio - oldFb).toFixed(3));

  // -------------------------------------------------------------
  // 2. MYCORRHIZAL CARBON TRANSFER
  // -------------------------------------------------------------
  let carbonTransferredViaHyphaeKg = 0;
  for (const link of next.hyphalLinks) {
    if (!link.isActive || link.conductance <= 0) continue;

    const plantA = next.plants.find((p) => p.id === link.plantAId);
    const plantB = next.plants.find((p) => p.id === link.plantBId);

    if (plantA && plantB && plantA.isAlive && plantB.isAlive) {
      // Determine donor (higher donorPriority) and recipient
      const donor = plantA.donorPriority >= plantB.donorPriority ? plantA : plantB;
      const recipient = donor === plantA ? plantB : plantA;

      // Transfer capacity scales with link conductance and soil F:B ratio
      const fbCompetence = Math.min(1.5, Math.max(0.1, next.microbial.fbRatio / 1.0));
      const transferRate = Math.min(
        donor.carbonAllocationKgPerDay * 0.35,
        link.conductance * 0.15 * fbCompetence
      );

      if (transferRate > 0) {
        donor.carbonAllocationKgPerDay -= transferRate;
        recipient.biomassKg += transferRate * 0.85; // 85% conversion to structural biomass
        link.cumulativeCarbonTransferredKg += transferRate;
        carbonTransferredViaHyphaeKg += transferRate;
      }
    }
  }

  // -------------------------------------------------------------
  // 3. RAIN, INFILTRATION, CRUSTING & RUNOFF PHYSICS
  // -------------------------------------------------------------
  const totalRainMm = rain.intensityMmPerHour * rain.durationHours;
  const residueCover = O.residueCoverFraction || 0;
  let crustFormedMm = 0;

  // Unprotected bare soil subjected to high-energy rain shatters aggregates, creating a surface seal
  if (residueCover < 0.65 && rain.dropletImpactEnergy >= 1.0) {
    const unprotectedFraction = 1.0 - residueCover;
    const aggregateWeakness = 1.0 - A.aggregateStability;
    crustFormedMm = Number(
      (rain.dropletImpactEnergy * unprotectedFraction * aggregateWeakness * 0.08).toFixed(2)
    );
    A.surfaceCrustThicknessMm = Number(((A.surfaceCrustThicknessMm || 0) + crustFormedMm).toFixed(2));
  }

  // Infiltration capacity (mm/hr):
  // Governed by base A-horizon conductivity, macroporosity, aggregate stability, and crust resistance
  const crustResistanceFactor = 1.0 / (1.0 + (A.surfaceCrustThicknessMm || 0) * 1.8);
  const aggregateFactor = 0.3 + 0.7 * A.aggregateStability;
  const macroporeFactor = 1.0 + 4.0 * A.macroporosity;

  const effectiveInfiltrationRateMmPerHr =
    A.saturatedConductivityMmPerHr * crustResistanceFactor * aggregateFactor * macroporeFactor;

  // Surface mulch retention capacity (mm) absorbs rain directly before runoff occurs
  const oSurfaceRetentionCapacity =
    Math.max(0, O.fieldCapacityMm - O.waterContentMm) * Math.min(1.0, residueCover * 1.5);

  const potentialInfiltrationCapacityMm =
    oSurfaceRetentionCapacity + effectiveInfiltrationRateMmPerHr * rain.durationHours;

  const infiltrationMm = Math.min(totalRainMm, potentialInfiltrationCapacityMm);
  const runoffMm = Math.max(0, totalRainMm - infiltrationMm);

  // Runoff erosion: detaches and washes off A-horizon particulate carbon
  let erosionLossCarbonKg = 0;
  if (runoffMm > 0) {
    const shearVulnerability = (1.0 - residueCover) * (1.0 - A.aggregateStability);
    // Erosion coefficient: 0.008 kg carbon per mm of runoff under full vulnerability
    erosionLossCarbonKg = Number((runoffMm * shearVulnerability * (A.organicCarbonKg * 0.025)).toFixed(3));
    A.organicCarbonKg = Math.max(1.0, A.organicCarbonKg - erosionLossCarbonKg);
  }

  // Distribute infiltrated water down the vertical horizons
  let waterToPercolate = infiltrationMm;

  // Horizon O absorbs first
  const oDeficit = Math.max(0, O.fieldCapacityMm - O.waterContentMm);
  const oAbsorbed = Math.min(waterToPercolate, oDeficit);
  O.waterContentMm += oAbsorbed;
  waterToPercolate -= oAbsorbed;

  // Horizon A absorbs
  const aDeficit = Math.max(0, A.fieldCapacityMm - A.waterContentMm);
  const aAbsorbed = Math.min(waterToPercolate, aDeficit);
  A.waterContentMm += aAbsorbed;
  waterToPercolate -= aAbsorbed;

  // Horizon E absorbs
  const eDeficit = Math.max(0, E.fieldCapacityMm - E.waterContentMm);
  const eAbsorbed = Math.min(waterToPercolate, eDeficit);
  E.waterContentMm += eAbsorbed;
  waterToPercolate -= eAbsorbed;

  // Horizon B absorbs (deep moisture bank)
  const bDeficit = Math.max(0, B.fieldCapacityMm - B.waterContentMm);
  const bAbsorbed = Math.min(waterToPercolate, bDeficit);
  B.waterContentMm += bAbsorbed;
  waterToPercolate -= bAbsorbed;

  // Excess beyond B field capacity percolates to C (deep recharge)
  next.waterBalance.deepPercolationMm += waterToPercolate;
  next.waterBalance.totalRunoffMm += runoffMm;
  next.waterBalance.cumulativeErosionLossKgCarbon += erosionLossCarbonKg;

  // -------------------------------------------------------------
  // 4. TRIPARTITE COOPERATIVE LEDGER COMPOUNDING
  // -------------------------------------------------------------
  const ecologicalYield = (infiltrationMm * 0.05) + (carbonTransferredViaHyphaeKg * 2.0);
  if (ecologicalYield > 0) {
    const credits = Number((ecologicalYield * next.cooperativeLedger.cooperativeMultiplier).toFixed(2));
    next.cooperativeLedger.carbonBiomassCredits = Number(
      (next.cooperativeLedger.carbonBiomassCredits + credits).toFixed(2)
    );
    const playerShareFraction = next.cooperativeLedger.playerStakePercent / 100;
    next.cooperativeLedger.mycorrhizalPatronage = Number(
      (next.cooperativeLedger.mycorrhizalPatronage + (credits * playerShareFraction)).toFixed(2)
    );
    if (carbonTransferredViaHyphaeKg > 0.02) {
      next.cooperativeLedger.cooperativeMultiplier = Math.min(
        3.0,
        Number((next.cooperativeLedger.cooperativeMultiplier + 0.02).toFixed(2))
      );
    }
  }

  // Record audit entry
  const auditEntry: FieldAuditEntry = {
    timestampIso: new Date().toISOString(),
    stewardId: steward,
    actionType: action.type,
    summary: `${actionSummary} Rain: ${totalRainMm.toFixed(1)}mm (Infiltrated: ${infiltrationMm.toFixed(1)}mm, Runoff: ${runoffMm.toFixed(1)}mm, Carbon loss: ${erosionLossCarbonKg}kg). F:B=${next.microbial.fbRatio}.`,
  };
  next.auditLog.unshift(auditEntry);
  if (next.auditLog.length > 50) {
    next.auditLog.pop(); // Keep audit history bounded
  }

  return {
    state: next,
    rainEventApplied: rain,
    actionApplied: action,
    infiltrationMm: Number(infiltrationMm.toFixed(2)),
    runoffMm: Number(runoffMm.toFixed(2)),
    erosionLossCarbonKg: Number(erosionLossCarbonKg.toFixed(3)),
    carbonTransferredViaHyphaeKg: Number(carbonTransferredViaHyphaeKg.toFixed(3)),
    crustFormedMm: Number(crustFormedMm.toFixed(2)),
    fbRatioDelta,
    summary: auditEntry.summary,
  };
}
