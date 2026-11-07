import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSoilState, tick } from '../src/simulation/soilModel.ts';
import { exportFieldStateToSeed, importFieldStateFromSeed, mergeVisitingAction } from '../src/simulation/coop.ts';
import { modeledGrowerSource } from '../src/simulation/growerTelemetry.ts';
import type { RainEvent, ManagementAction } from '../src/simulation/types.ts';

describe('Pass A: Soil Grower Simulation Core (Audited & Repaired)', () => {

  describe('1. Vertical Soil Horizons (O, A, E, B, C)', () => {
    test('initializes all 5 distinct soil horizons with valid depth, bulk density and carbon', () => {
      const state = createDefaultSoilState();
      const { O, A, E, B, C } = state.horizons;

      assert.ok(O && A && E && B && C, 'All 5 horizons (O, A, E, B, C) must be present');
      assert.equal(O.type, 'O');
      assert.equal(A.type, 'A');
      assert.equal(E.type, 'E');
      assert.equal(B.type, 'B');
      assert.equal(C.type, 'C');

      // Check horizon depth layering
      assert.ok(O.depthMm > 0, 'O horizon must have depth');
      assert.ok(A.depthMm > O.depthMm, 'A horizon must be thicker than initial O');
      assert.ok(B.depthMm > A.depthMm, 'B horizon subsoil accumulation is deepest active horizon');

      // Check bulk density progression (O lowest, C highest)
      assert.ok(O.bulkDensityGcm3 < A.bulkDensityGcm3, 'O horizon has lower bulk density than mineral A');
      assert.ok(C.bulkDensityGcm3 > B.bulkDensityGcm3, 'C parent material has highest density');

      // Verify B horizon stores illuvial clay & mineral phosphorus
      assert.ok((B.clayAccumulationPercent || 0) > 30, 'B horizon must have clay accumulation');
      assert.ok((B.mineralPhosphorusKg || 0) > 20, 'B horizon holds deep mineral phosphorus pool');
    });

    test('percolates water sequentially down through horizons up to field capacity', () => {
      const state = createDefaultSoilState();
      state.horizons.O.waterContentMm = 0;
      state.horizons.A.waterContentMm = 5;
      state.horizons.E.waterContentMm = 5;
      state.horizons.B.waterContentMm = 20;

      // Gentle soaking rain on mulched ground
      state.horizons.O.residueCoverFraction = 0.9;
      state.horizons.A.surfaceCrustThicknessMm = 0;
      state.horizons.A.macroporosity = 0.20;
      state.horizons.A.aggregateStability = 0.60;
      state.horizons.A.saturatedConductivityMmPerHr = 20.0;

      const gentleRain: RainEvent = {
        intensityMmPerHour: 15,
        durationHours: 2, // 30 mm total
        dropletImpactEnergy: 0.2,
      };

      const result = tick(state, { type: 'rest' }, gentleRain);
      assert.equal(result.runoffMm, 0, 'Gentle rain on mulched soil should have 0 runoff');
      assert.equal(result.infiltrationMm, 30, 'All 30mm must infiltrate');

      // O horizon absorbs up to field capacity (8mm)
      assert.equal(result.state.horizons.O.waterContentMm, 8, 'O horizon filled to capacity');
      // A horizon absorbs remaining
      assert.ok(result.state.horizons.A.waterContentMm > 5, 'A horizon recharged');
    });
  });

  describe('2. Fungal to Bacterial Ratio Progression', () => {
    test('shifts F:B upward with woody mulch and fungal compost tea', () => {
      const state = createDefaultSoilState();
      assert.ok(state.microbial.fbRatio < 0.35, 'Baseline degraded lot is bacterial dominated');

      const gentleRain: RainEvent = { intensityMmPerHour: 5, durationHours: 1, dropletImpactEnergy: 0.1 };

      // Step 1: Add woodchips
      const res1 = tick(state, { type: 'mulch_woodchips' }, gentleRain);
      assert.ok(res1.state.microbial.fungalBiomassKg > state.microbial.fungalBiomassKg);
      assert.ok(res1.state.microbial.fbRatio > state.microbial.fbRatio);

      // Step 2: Inoculate fungal tea
      const res2 = tick(res1.state, { type: 'inoculate_fungal_tea' }, gentleRain);
      assert.ok(res2.state.microbial.fbRatio > res1.state.microbial.fbRatio);
      assert.ok(res2.state.horizons.A.aggregateStability > state.horizons.A.aggregateStability, 'Glomalin stabilized aggregates');
    });

    test('FAILURE CASE: Tillage shatters fungal hyphae, collapses aggregates, and triggers bacterial explosion', () => {
      const state = createDefaultSoilState();
      const gentleRain: RainEvent = { intensityMmPerHour: 2, durationHours: 1, dropletImpactEnergy: 0.1 };
      const healthy = tick(
        tick(state, { type: 'mulch_woodchips' }, gentleRain).state,
        { type: 'inoculate_fungal_tea' },
        gentleRain
      ).state;

      const preFungi = healthy.microbial.fungalBiomassKg;
      const preAgg = healthy.horizons.A.aggregateStability;
      const preMacro = healthy.horizons.A.macroporosity;
      const preFb = healthy.microbial.fbRatio;

      // Apply Tillage
      const tilled = tick(healthy, { type: 'tillage' }, gentleRain).state;

      assert.ok(tilled.microbial.fungalBiomassKg < preFungi * 0.30, 'Fungal biomass crashed by over 70%');
      assert.ok(tilled.horizons.A.aggregateStability < preAgg * 0.40, 'Aggregate stability collapsed');
      assert.ok(tilled.horizons.A.macroporosity < preMacro, 'Tillage collapsed macroporosity');
      assert.ok(tilled.microbial.bacterialBiomassKg > healthy.microbial.bacterialBiomassKg * 2.0, 'Bacterial population surged');
      assert.ok(tilled.microbial.fbRatio < preFb * 0.20, 'F:B ratio cratered');

      // Verify hyphal links severed
      for (const link of tilled.hyphalLinks) {
        assert.equal(link.isActive, false, 'All hyphal links must be severed by tillage');
        assert.equal(link.conductance, 0, 'Hyphal conductance zeroed');
      }
    });
  });

  describe('3. Mycorrhizal Network Carbon Transfer', () => {
    test('transfers photosynthate carbon from nurse tree to recipient sapling', () => {
      const state = createDefaultSoilState();
      // Increase F:B ratio so hyphal network is active
      state.microbial.fbRatio = 1.4;

      const nurse = state.plants.find((p) => p.id === 'nurse-tree-1')!;
      const sapling = state.plants.find((p) => p.id === 'seedling-oak-2')!;
      const initialSaplingBiomass = sapling.biomassKg;

      const dryEvent: RainEvent = { intensityMmPerHour: 0, durationHours: 1, dropletImpactEnergy: 0 };
      const result = tick(state, { type: 'rest' }, dryEvent);

      assert.ok(result.carbonTransferredViaHyphaeKg > 0, 'Carbon transferred via hyphae');
      const updatedSapling = result.state.plants.find((p) => p.id === 'seedling-oak-2')!;
      assert.ok(updatedSapling.biomassKg > initialSaplingBiomass, 'Recipient sapling gained biomass from hyphal transfer');

      const link = result.state.hyphalLinks.find((l) => l.id === 'link-1-2')!;
      assert.ok(link.cumulativeCarbonTransferredKg > 0, 'Link recorded transferred carbon');
    });

    test('FAILURE CASE: Cutting nurse plant severs hyphal links and halts carbon subsidy', () => {
      const state = createDefaultSoilState();
      state.microbial.fbRatio = 1.2;

      const dryEvent: RainEvent = { intensityMmPerHour: 0, durationHours: 1, dropletImpactEnergy: 0 };

      // Cut nurse tree
      const cutAction: ManagementAction = { type: 'cut_plant', targetPlantId: 'nurse-tree-1' };
      const afterCut = tick(state, cutAction, dryEvent).state;

      const nurse = afterCut.plants.find((p) => p.id === 'nurse-tree-1')!;
      assert.equal(nurse.isAlive, false, 'Nurse tree is dead');

      const link = afterCut.hyphalLinks.find((l) => l.plantAId === 'nurse-tree-1')!;
      assert.equal(link.isActive, false, 'Hyphal link deactivated');

      // Next tick: zero carbon transfer
      const nextTick = tick(afterCut, { type: 'rest' }, dryEvent);
      assert.equal(nextTick.carbonTransferredViaHyphaeKg, 0, 'Zero carbon transferred after severance');
    });
  });

  describe('4. Infiltration versus Runoff Physics & Crust Formation', () => {
    test('FAILURE CASE 1: Bare soil subjected to intense rain forms surface crust', () => {
      const state = createDefaultSoilState();
      state.horizons.O.residueCoverFraction = 0.05; // Bare soil
      state.horizons.A.aggregateStability = 0.15;   // Weak aggregates
      state.horizons.A.surfaceCrustThicknessMm = 0;

      const intenseStorm: RainEvent = {
        intensityMmPerHour: 45, // Heavy cloudburst
        durationHours: 1.5,
        dropletImpactEnergy: 2.2, // High kinetic raindrop impact
      };

      const result = tick(state, { type: 'rest' }, intenseStorm);
      assert.ok(result.crustFormedMm > 0, 'Surface crust was formed by raindrop impact');
      assert.ok((result.state.horizons.A.surfaceCrustThicknessMm || 0) > 0, 'A-horizon crust thickness increased');
    });

    test('FAILURE CASE 2: Surface crust seals infiltration, producing runoff that erodes topsoil carbon', () => {
      const state = createDefaultSoilState();
      // Pre-crusted surface with low macropores
      state.horizons.O.residueCoverFraction = 0.0;
      state.horizons.A.surfaceCrustThicknessMm = 6.0; // Thick structural seal
      state.horizons.A.aggregateStability = 0.10;
      state.horizons.A.macroporosity = 0.02;
      state.horizons.A.saturatedConductivityMmPerHr = 4.0;
      const initialCarbon = state.horizons.A.organicCarbonKg;

      const storm: RainEvent = {
        intensityMmPerHour: 30,
        durationHours: 1.0,
        dropletImpactEnergy: 1.8,
      };

      const result = tick(state, { type: 'rest' }, storm);
      assert.ok(result.runoffMm > 15, 'Over 50% of storm turned into destructive runoff');
      assert.ok(result.erosionLossCarbonKg > 0, 'Runoff eroded particulate topsoil carbon');
      assert.ok(result.state.horizons.A.organicCarbonKg < initialCarbon, 'A horizon lost organic carbon to erosion');
    });

    test('SUCCESS CASE: Decompacted and woodchip-mulched soil infiltrates storm with zero runoff and zero carbon loss', () => {
      const state = createDefaultSoilState();
      // Apply AirSpade decompaction first
      const decompacted = tick(state, { type: 'air_spade_decompact' }, {
        intensityMmPerHour: 0,
        durationHours: 1,
        dropletImpactEnergy: 0,
      }).state;

      // Apply heavy woodchip mulch
      const mulched = tick(decompacted, { type: 'mulch_woodchips' }, {
        intensityMmPerHour: 0,
        durationHours: 1,
        dropletImpactEnergy: 0,
      }).state;

      assert.ok((mulched.horizons.O.residueCoverFraction || 0) > 0.70, 'Soil heavily protected by mulch');
      assert.equal(mulched.horizons.A.surfaceCrustThicknessMm, 0, 'Crust completely eradicated');

      // Subject to heavy storm
      const storm: RainEvent = {
        intensityMmPerHour: 30,
        durationHours: 1.0, // 30mm rain
        dropletImpactEnergy: 1.5,
      };

      const result = tick(mulched, { type: 'rest' }, storm);
      assert.equal(result.runoffMm, 0, 'Mulched & decompacted soil captured 100% of storm water');
      assert.equal(result.erosionLossCarbonKg, 0, 'Zero carbon eroded off plot');
      assert.equal(result.crustFormedMm, 0, 'Mulch absorbed raindrop kinetic energy, preventing crusting');
    });
  });

  describe('5. Accountless Asynchronous Cooperation', () => {
    test('exports state to URL-safe seed string and restores identically', () => {
      const state = createDefaultSoilState('sanctuary-coop-test', 999);
      state.microbial.fbRatio = 2.15;
      state.horizons.O.depthMm = 45;

      const seed = exportFieldStateToSeed(state);
      assert.equal(typeof seed, 'string');
      assert.ok(seed.length > 20, 'Seed string generated');
      // Verify URL-safe characters only
      assert.ok(!/[+/=]/.test(seed), 'Seed must be URL-safe without +, / or =');

      const restored = importFieldStateFromSeed(seed);
      assert.equal(restored.fieldId, state.fieldId);
      assert.equal(restored.microbial.fbRatio, 2.15);
      assert.equal(restored.horizons.O.depthMm, 45);
      assert.equal(restored.seed, 999);
    });

    test('visiting steward alters host field asynchronously and records verifiable audit trace', () => {
      const hostState = createDefaultSoilState('sanctuary-host-44');
      const initialFungi = hostState.microbial.fungalBiomassKg;

      // Visiting steward applies woodchip mulch
      const visitorAction: ManagementAction = {
        type: 'mulch_woodchips',
        stewardId: 'anon-steward-nebula-9',
      };

      const result = mergeVisitingAction(hostState, visitorAction);

      assert.ok(result.state.microbial.fungalBiomassKg > initialFungi, 'Visitor increased host fungal biomass');
      assert.ok(result.state.horizons.O.depthMm > hostState.horizons.O.depthMm, 'Visitor added mulch depth to host');

      // Verify audit trail captures visitor identity
      const latestAudit = result.state.auditLog[0];
      assert.equal(latestAudit.stewardId, 'anon-steward-nebula-9');
      assert.equal(latestAudit.actionType, 'mulch_woodchips');
    });
  });

  describe('6. Synthetic N-P-K Trap (Master Plan Section 3.1)', () => {
    test('synthetic N-P-K kills 45% fungal biomass, collapses aggregates, and increases bulk density', () => {
      const state = createDefaultSoilState();
      state.microbial.fungalBiomassKg = 4.0;
      state.horizons.A.bulkDensityGcm3 = 1.30;
      state.horizons.A.aggregateStability = 0.60;

      const dryRain: RainEvent = { intensityMmPerHour: 0, durationHours: 1, dropletImpactEnergy: 0 };
      const result = tick(state, { type: 'synthetic_npk_buff' }, dryRain);

      assert.ok(
        result.state.microbial.fungalBiomassKg <= 4.0 * 0.55 + 0.01,
        'Killed 45% of fungal biomass'
      );
      assert.ok(
        result.state.horizons.A.bulkDensityGcm3 >= 1.42 - 0.01,
        'Bulk density increased by +0.12 g/cm3'
      );
      assert.ok(
        result.state.horizons.A.aggregateStability < 0.60 * 0.70,
        'Aggregates collapsed'
      );
    });
  });

  describe('7. Tripartite Cooperative Ledger Compounding (Master Plan Section 3.2)', () => {
    test('distributes ecological yield and compounds cooperative multiplier', () => {
      const state = createDefaultSoilState();
      state.microbial.fbRatio = 1.5;
      const initialCredits = state.cooperativeLedger.carbonBiomassCredits;
      const initialPatronage = state.cooperativeLedger.mycorrhizalPatronage;

      // Run a gentle soaking storm that infiltrates and transfers carbon via hyphae
      const rain: RainEvent = { intensityMmPerHour: 10, durationHours: 1, dropletImpactEnergy: 0.2 };
      const result = tick(state, { type: 'rest' }, rain);

      assert.ok(
        result.state.cooperativeLedger.carbonBiomassCredits > initialCredits,
        'Carbon Biomass Credits increased from ecological yield'
      );
      assert.ok(
        result.state.cooperativeLedger.mycorrhizalPatronage > initialPatronage,
        'Mycorrhizal Patronage increased for player share'
      );
      assert.equal(result.state.cooperativeLedger.growerStakePercent, 35);
      assert.equal(result.state.cooperativeLedger.landownerStakePercent, 30);
      assert.equal(result.state.cooperativeLedger.playerStakePercent, 35);
    });
  });

  describe('8. Swappable Grower Telemetry Source (Master Plan Section 3.3)', () => {
    test('modeled telemetry source provides valid Sanctuary Zero baseline metrics', async () => {
      const telemetry = await modeledGrowerSource.fetchSanctuaryTelemetry('sanctuary-zero');
      assert.equal(telemetry.sanctuaryId, 'sanctuary-zero');
      assert.equal(telemetry.sourceType, 'modeled_standard');
      assert.equal(telemetry.horizons.length, 5);
      assert.ok(telemetry.fungalBacterialRatio > 0);
      assert.ok(telemetry.soilTemperatureFahrenheit > 70);
    });
  });

  describe('9. 16-Column Sanctuary Spatial Grid', () => {
    test('initializes 16 columns and updates spatial columns upon decompaction and mulching', () => {
      const state = createDefaultSoilState();
      assert.equal(state.columns.length, 16, 'Sanctuary grid must have exactly 16 columns');

      const gentleRain: RainEvent = { intensityMmPerHour: 0, durationHours: 1, dropletImpactEnergy: 0 };
      const decompacted = tick(state, { type: 'air_spade_decompact' }, gentleRain).state;

      for (const col of decompacted.columns) {
        assert.equal(col.surfaceCrustMm, 0, 'AirSpade cleared crust on all columns');
        assert.equal(col.aHorizonCompacted, false, 'Compacted flag cleared');
      }
    });
  });

});
