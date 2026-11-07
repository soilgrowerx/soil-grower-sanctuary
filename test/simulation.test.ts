import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultSoilState,
  calculateInfiltrationAndRunoff,
  tick,
  performGestureVerb,
  advanceToNextSeason,
  sumHorizonCarbonKg,
} from '../src/simulation/soilModel.ts';
import {
  exportFieldStateToSeed,
  importFieldStateFromSeed,
  mergeVisitingAction,
} from '../src/simulation/coop.ts';
import type { RainEvent } from '../src/simulation/types.ts';

describe('Pass 1: Infiltration, Runoff, Three Verbs, and Mass-Balance Reconciliation', () => {

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
      intensityMmPerHour: 50.8,
      durationHours: 1.0,
      dropletImpactEnergy: 2.2,
    };

    const output = calculateInfiltrationAndRunoff(state, twoInchStorm);

    const totalRainMm = 50.8;
    assert.ok(
      output.waterShedMm > totalRainMm * 0.5,
      `Field must shed most of two-inch event. Shed: ${output.waterShedMm}mm, Infiltrated: ${output.waterInfiltratedMm}mm`
    );
    assert.ok(
      output.waterInfiltratedMm < totalRainMm * 0.5,
      `Infiltration must be choked by crust. Infiltrated: ${output.waterInfiltratedMm}mm`
    );
    assert.equal(
      Number((output.waterInfiltratedMm + output.waterShedMm).toFixed(2)),
      totalRainMm,
      'Water in must equal water infiltrated plus water shed'
    );
    assert.ok(
      output.topsoilCarbonExportedKg > 0,
      `Topsoil carbon must be exported by runoff. Exported: ${output.topsoilCarbonExportedKg}kg`
    );
    assert.ok(
      output.crustFormedMm > 0,
      `Kinetic impact must generate additional crust. Formed: ${output.crustFormedMm}mm`
    );

    const tickResult = tick(state, { type: 'rest' }, twoInchStorm);
    assert.ok(tickResult.state.carbon.lossOffPlotKg > 0);
    assert.ok(tickResult.state.carbon.poolByHorizonKg.A < initialCarbonPoolA);
    assert.ok(tickResult.state.water.runoffVolumeMm > 25.4);
  });

  test('SUCCESS CASE: Decompacted, mulched, high-aggregate field captures two-inch event with zero runoff and zero carbon loss', () => {
    const state = createDefaultSoilState();

    state.water.crustThicknessMm = 0;
    state.water.isCrusted = false;
    state.management.residueCoverFraction = 0.85;
    state.horizons.A.aggregateStability = 0.75;
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

  test('Water in vs water out and carbon gained minus carbon lost reconcile across all three verbs', () => {
    let state = createDefaultSoilState();
    assert.equal(state.site.bioregionId, 'rogue_valley', 'Defaults to Rogue Valley bioregion');

    // Decision 1: Feed (mulch)
    state = performGestureVerb(state, 'feed', 'mulch').state;
    // Decision 2: Water (storm)
    state = performGestureVerb(state, 'water').state;
    // Decision 3: Disturb (till)
    state = performGestureVerb(state, 'disturb', 'till').state;

    // Reconcile water: totalWaterInMm === totalInfiltratedMm + runoffVolumeMm
    const waterOut = Number((state.water.totalInfiltratedMm + state.water.runoffVolumeMm).toFixed(2));
    assert.equal(state.water.totalWaterInMm, waterOut, 'Water in must balance water out');

    // Reconcile carbon: initial + gained - (atmosphere + runoff loss) === currentTotalCarbonKg
    const expectedCarbon = Number(
      (
        state.carbon.initialTotalCarbonKg +
        state.carbon.totalCarbonGainedKg -
        state.carbon.fluxToAtmosphereKg -
        state.carbon.lossOffPlotKg
      ).toFixed(3)
    );
    const poolSum = sumHorizonCarbonKg(state.carbon.poolByHorizonKg);
    assert.equal(state.carbon.currentTotalCarbonKg, poolSum, 'Current total carbon equals sum of horizons');
    assert.equal(expectedCarbon, poolSum, 'Carbon gained minus carbon lost must reconcile with horizon pools');
  });

  test('Season progression unlocks one horizon deeper each season across four seasons', () => {
    let state = createDefaultSoilState();
    assert.deepEqual(state.season.unlockedHorizons, ['O', 'A']);

    state = advanceToNextSeason(state);
    assert.equal(state.season.seasonNumber, 2);
    assert.deepEqual(state.season.unlockedHorizons, ['O', 'A', 'E']);

    state = advanceToNextSeason(state);
    assert.equal(state.season.seasonNumber, 3);
    assert.deepEqual(state.season.unlockedHorizons, ['O', 'A', 'E', 'B']);

    state = advanceToNextSeason(state);
    assert.equal(state.season.seasonNumber, 4);
    assert.deepEqual(state.season.unlockedHorizons, ['O', 'A', 'E', 'B', 'C']);
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
