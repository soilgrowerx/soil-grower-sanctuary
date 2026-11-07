/**
 * Soil Grower Game - Canonical Simulation Data Model
 * Section 2 Specification:
 * - site: climate zone, baseline record reference, soil series
 * - horizons: O, A, E, B, C: depth, organic matter, aggregate stability, bulk density, water holding capacity
 * - biology: fungal to bacterial ratio, mycorrhizal colonization, earthworm activity, microbial biomass carbon
 * - water: infiltration rate, runoff volume, topsoil exported, crust state
 * - carbon: pool by horizon, flux to atmosphere, loss off-plot
 * - management: tillage type and depth, residue cover, amendment, cover crop, grazing, harvest
 * - season: day index, rain events with intensity and duration
 *
 * Every mechanic reads and writes this model. No mechanic holds private state.
 */

export type HorizonType = 'O' | 'A' | 'E' | 'B' | 'C';

export interface SiteState {
  climateZone: string;
  baselineRecordReference: string;
  soilSeries: string;
}

export interface HorizonState {
  type: HorizonType;
  name: string;
  depthMm: number;
  organicMatterPercent: number;
  aggregateStability: number; // 0.0 to 1.0 (water-stable aggregates fraction)
  bulkDensityGcm3: number;
  waterHoldingCapacityMm: number;
  currentWaterMm: number;
  saturatedConductivityMmPerHr: number;
}

export interface BiologyState {
  fungalToBacterialRatio: number;
  mycorrhizalColonizationPercent: number;
  earthwormActivityIndex: number; // 0 to 100 burrows/m2 (generates macropores)
  microbialBiomassCarbonMgPerKg: number;
  activeMyceliumLengthM: number;
}

export interface WaterState {
  infiltrationRateMmPerHr: number;
  runoffVolumeMm: number;
  topsoilExportedKg: number;
  crustThicknessMm: number;
  isCrusted: boolean;
  deepPercolationMm: number;
}

export interface CarbonState {
  poolByHorizonKg: Record<HorizonType, number>;
  fluxToAtmosphereKg: number;
  lossOffPlotKg: number;
}

export type TillageType = 'none' | 'rototill' | 'chisel_plow' | 'air_spade';
export type AmendmentType = 'none' | 'woodchips' | 'fungal_compost_tea' | 'biochar' | 'synthetic_npk';
export type CoverCropType = 'none' | 'annual_pioneer' | 'nitrogen_fixer' | 'deep_taproot_perennial';
export type GrazingType = 'none' | 'rotational_high_density' | 'continuous_overgrazing';
export type HarvestType = 'none' | 'selective_coppice' | 'clearcut';

export interface ManagementState {
  tillageType: TillageType;
  tillageDepthMm: number;
  residueCoverFraction: number; // 0.0 to 1.0
  amendment: AmendmentType;
  coverCrop: CoverCropType;
  grazing: GrazingType;
  harvest: HarvestType;
}

export interface RainEvent {
  intensityMmPerHour: number;
  durationHours: number;
  dropletImpactEnergy: number; // Kinetic energy (J/m^2/mm)
}

export interface SeasonState {
  dayIndex: number;
  seasonPhase: 'spring_wakeup' | 'early_summer' | 'midsummer_heat_dome' | 'autumn_inoculation';
  currentRainEvent: RainEvent;
}

export interface Plant {
  id: string;
  species: 'pioneer_annual' | 'nitrogen_fixer' | 'native_perennial' | 'climax_tree';
  ageDays: number;
  biomassKg: number;
  carbonAllocationKgPerDay: number;
  rootDepthMm: number;
  mycorrhizalColonization: number;
  isAlive: boolean;
  donorPriority: number;
  columnIndex?: number;
}

export interface HyphalLink {
  id: string;
  plantAId: string;
  plantBId: string;
  conductance: number;
  lengthM: number;
  isActive: boolean;
  cumulativeCarbonTransferredKg: number;
}

export interface CooperativeLedger {
  growerStakePercent: number;    // 35%
  landownerStakePercent: number; // 30%
  playerStakePercent: number;    // 35%
  carbonBiomassCredits: number;
  mycorrhizalPatronage: number;
  cooperativeMultiplier: number;
}

export interface SanctuaryColumn {
  columnIndex: number;
  mulchDepthMm: number;
  surfaceCrustMm: number;
  aHorizonCompacted: boolean;
  bulkDensityGcm3: number;
  mycelialDensity: number;
  plantId?: string;
}

export interface FieldAuditEntry {
  timestampIso: string;
  stewardId: string;
  actionType: string;
  summary: string;
}

/**
 * Unified canonical simulation state.
 */
export interface SoilSimulationState {
  site: SiteState;
  horizons: Record<HorizonType, HorizonState>;
  biology: BiologyState;
  water: WaterState;
  carbon: CarbonState;
  management: ManagementState;
  season: SeasonState;
  plants: Plant[];
  hyphalLinks: HyphalLink[];
  cooperativeLedger: CooperativeLedger;
  columns: SanctuaryColumn[];
  auditLog: FieldAuditEntry[];
  seed: number;
}

export type SoilState = SoilSimulationState;

export type ManagementActionType =
  | 'air_spade_decompact'
  | 'mulch_woodchips'
  | 'inoculate_fungal_tea'
  | 'plant_seedling'
  | 'tillage'
  | 'synthetic_npk_buff'
  | 'cut_plant'
  | 'rest';

export interface ManagementAction {
  type: ManagementActionType;
  stewardId?: string;
  targetPlantId?: string;
  plantSpecies?: Plant['species'];
  intensity?: number;
  targetColumnIndex?: number;
}

export interface InfiltrationRunoffOutput {
  waterInfiltratedMm: number;
  waterShedMm: number;
  topsoilCarbonExportedKg: number;
  crustFormedMm: number;
  effectiveInfiltrationRateMmPerHr: number;
}

export interface TickResult {
  state: SoilSimulationState;
  rainEventApplied: RainEvent;
  actionApplied: ManagementAction;
  infiltrationMm: number;
  runoffMm: number;
  erosionLossCarbonKg: number;
  carbonTransferredViaHyphaeKg: number;
  crustFormedMm: number;
  fbRatioDelta: number;
  summary: string;
}
