import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultSoilState,
  calculateInfiltrationAndRunoff,
  tick,
} from '../src/simulation/soilModel.ts';
import {
  exportFieldStateToSeed,
  importFieldStateFromSeed,
  mergeVisitingAction,
} from '../src/simulation/coop.ts';
import type { RainEvent, SoilSimulationState } from '../src/simulation/types.ts';

describe('Pass 1: Infiltration and Runoff Physics Engine', () => {

  test('FAILURE CASE: Crusted, bare, low-aggregate field sheds most of a two-inch rain event and exports carbon', () => {
    const state = createDefaultSoilState();

    // Configure degraded failure state: crusted, bare, low aggregate stability
    state.water.crustThicknessMm = 3.5;
    state.water.isCrusted = true;
    state.management.residueCoverFraction = 0.05; // 5% residue (bare dirt)
    state.horizons.A.aggregateStability = 0.12;   // Very low aggregate stability
    state.horizons.A.saturatedConductivityMmPerHr = 8.0;
    const initialCarbonPoolA = state.carbon.poolByHorizonKg.A;

    // Two-inch rain event (2.0 inches = 50.8 mm)
    const twoInchStorm: RainEvent = {
      intensityMmPerHour: 50.8, // 1-hour cloudburst
      durationHours: 1.0,
      dropletImpactEnergy: 2.2, // High kinetic raindrop impact
    };

    const output = calculateInfiltrationAndRunoff(state, twoInchStorm);

    // Assertions required by Pass 1:
    // 1. Water shed must be greater than water infiltrated (sheds most of the 2-inch event)
    const totalRainMm = 50.8;
    assert.ok(
      output.waterShedMm > totalRainMm * 0.5,
      `Field must shed most of two-inch event. Shed: ${output.waterShedMm}mm, Infiltrated: ${output.waterInfiltratedMm}mm`
    );
    assert.ok(
      output.waterInfiltratedMm < totalRainMm * 0.5,
      `Infiltration must be choked by crust. Infiltrated: ${output.waterInfiltratedMm}mm`
    );

    // 2. Topsoil carbon must be exported off-plot
    assert.ok(
      output.topsoilCarbonExportedKg > 0,
      `Topsoil carbon must be exported by runoff. Exported: ${output.topsoilCarbonExportedKg}kg`
    );

    // 3. Kinetic impact on bare soil forms additional crust
    assert.ok(
      output.crustFormedMm > 0,
      `Kinetic impact must generate additional crust. Formed: ${output.crustFormedMm}mm`
    );

    // Run full tick to verify canonical model state mutation
    const tickResult = tick(state, { type: 'rest' }, twoInchStorm);
    assert.ok(
      tickResult.state.carbon.lossOffPlotKg > 0,
      'State tracks cumulative carbon lost off-plot'
    );
    assert.ok(
      tickResult.state.carbon.poolByHorizonKg.A < initialCarbonPoolA,
      'A horizon carbon pool is depleted by erosion'
    );
    assert.ok(
      tickResult.state.water.runoffVolumeMm > 25.4,
      'State water runoff volume records shedding'
    );
  });

  test('SUCCESS CASE: Decompacted, mulched, high-aggregate field captures two-inch event with zero runoff and zero carbon loss', () => {
    const state = createDefaultSoilState();

    // Remediated state: AirSpaded and mulched with high residue cover
    state.water.crustThicknessMm = 0;
    state.water.isCrusted = false;
    state.management.residueCoverFraction = 0.85; // 85% woodchip residue cover
    state.horizons.A.aggregateStability = 0.75;   // High aggregate stability
    state.horizons.A.saturatedConductivityMmPerHr = 45.0;
    state.horizons.O.waterHoldingCapacityMm = 24.0;
    state.horizons.O.currentWaterMm = 2.0;

    const twoInchStorm: RainEvent = {
      intensityMmPerHour: 50.8,
      durationHours: 1.0,
      dropletImpactEnergy: 1.8,
    };

    const output = calculateInfiltrationAndRunoff(state, twoInchStorm);

    assert.equal(output.waterShedMm, 0, 'Mulched & aggregate-stable soil sheds 0 mm runoff');
    assert.equal(output.topsoilCarbonExportedKg, 0, 'Zero carbon exported off-plot');
    assert.equal(output.waterInfiltratedMm, 50.8, '100% of two-inch storm is infiltrated');
    assert.equal(output.crustFormedMm, 0, 'Mulch intercepts raindrop kinetic energy, preventing crust');
  });

  test('canonical model adheres to Section 2 structure (all 7 core modules present)', () => {
    const state = createDefaultSoilState();

    // 1. site
    assert.ok(state.site.climateZone);
    assert.ok(state.site.baselineRecordReference);
    assert.ok(state.site.soilSeries);

    // 2. horizons (O, A, E, B, C)
    for (const h of ['O', 'A', 'E', 'B', 'C'] as const) {
      assert.ok(state.horizons[h], `Horizon ${h} must exist`);
      assert.ok(state.horizons[h].depthMm > 0);
      assert.ok(state.horizons[h].bulkDensityGcm3 > 0);
      assert.ok(state.horizons[h].aggregateStability >= 0);
    }

    // 3. biology
    assert.ok(state.biology.fungalToBacterialRatio > 0);
    assert.ok(state.biology.mycorrhizalColonizationPercent >= 0);
    assert.ok(state.biology.earthwormActivityIndex >= 0);

    // 4. water
    assert.ok(state.water.infiltrationRateMmPerHr >= 0);
    assert.ok(typeof state.water.isCrusted === 'boolean');

    // 5. carbon
    assert.ok(state.carbon.poolByHorizonKg.A > 0);

    // 6. management
    assert.ok(state.management.tillageType);
    assert.ok(state.management.residueCoverFraction >= 0);

    // 7. season
    assert.ok(state.season.dayIndex >= 1);
    assert.ok(state.season.currentRainEvent.intensityMmPerHour >= 0);
  });

  test('exports state to URL-safe seed string and restores identically', () => {
    const state = createDefaultSoilState('sanctuary-coop-test', 999);
    state.biology.fungalToBacterialRatio = 2.15;
    state.horizons.O.depthMm = 45;

    const seed = exportFieldStateToSeed(state);
    assert.equal(typeof seed, 'string');
    assert.ok(!/[+/=]/.test(seed), 'Seed must be URL-safe without +, / or =');

    const restored = importFieldStateFromSeed(seed);
    assert.equal(restored.site.soilSeries, state.site.soilSeries);
    assert.equal(restored.biology.fungalToBacterialRatio, 2.15);
    assert.equal(restored.horizons.O.depthMm, 45);
    assert.equal(restored.seed, 999);
  });

  test('visiting steward alters host field asynchronously and records verifiable audit trace', () => {
    const hostState = createDefaultSoilState('sanctuary-host-44');
    const initialMulch = hostState.horizons.O.depthMm;

    const visitorAction = {
      type: 'mulch_woodchips' as const,
      stewardId: 'anon-steward-nebula-9',
    };

    const result = mergeVisitingAction(hostState, visitorAction);
    assert.ok(result.state.horizons.O.depthMm > initialMulch, 'Visitor added mulch depth');
    assert.equal(result.state.auditLog[0].stewardId, 'anon-steward-nebula-9');
  });

});
