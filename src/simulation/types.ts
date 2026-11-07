/**
 * Soil Grower Game - Simulation Core Types
 * Five Core Pillars:
 * 1. Vertical soil horizons (O, A, E, B, C)
 * 2. Fungal to bacterial (F:B) ratio progression
 * 3. Carbon moving through mycorrhizal hyphal networks
 * 4. Infiltration vs runoff physics under rainfall kinetic energy
 * 5. Accountless asynchronous cooperative field sharing
 *
 * Plus Master Plan Section 3 additions:
 * - Tripartite Cooperative Ledger (35% Grower / 30% Landowner / 35% Player)
 * - 16-Column Sanctuary Spatial Grid
 * - Synthetic N-P-K Trap Action
 */

export type HorizonType = 'O' | 'A' | 'E' | 'B' | 'C';

export interface Horizon {
  type: HorizonType;
  name: string;
  depthMm: number;
  bulkDensityGcm3: number;
  organicCarbonKg: number;
  waterContentMm: number;
  fieldCapacityMm: number;
  wiltingPointMm: number;
  aggregateStability: number; // 0.0 - 1.0 (water-stable aggregates fraction)
  macroporosity: number;      // 0.0 - 0.40 (fraction of soil volume as macro channels)
  saturatedConductivityMmPerHr: number; // K_sat

  // Layer-specific parameters
  residueCoverFraction?: number; // O-horizon surface mulch coverage (0.0 to 1.0)
  surfaceCrustThicknessMm?: number; // A-horizon surface seal thickness
  glomalinMgPerG?: number; // A-horizon fungal glycoprotein aggregate glue
  leachingIndex?: number; // E-horizon mineral stripping index
  clayAccumulationPercent?: number; // B-horizon illuvial clay percentage
  mineralPhosphorusKg?: number; // B-horizon locked & available phosphorus
}

export type PlantSpecies = 'pioneer_annual' | 'nitrogen_fixer' | 'native_perennial' | 'climax_tree';

export interface Plant {
  id: string;
  species: PlantSpecies;
  ageDays: number;
  biomassKg: number;
  carbonAllocationKgPerDay: number; // Photosynthate transferred to roots/mycelium
  rootDepthMm: number;
  mycorrhizalColonization: number; // 0.0 to 1.0
  isAlive: boolean;
  donorPriority: number; // 0.0 to 1.0 (higher = donor/nurse, lower = receiver/sapling)
  columnIndex?: number; // 0 to 15
}

export interface HyphalLink {
  id: string;
  plantAId: string;
  plantBId: string;
  conductance: number; // 0.0 to 1.0
  lengthM: number;
  isActive: boolean;
  cumulativeCarbonTransferredKg: number;
}

export interface MicrobialState {
  bacterialBiomassKg: number;
  fungalBiomassKg: number;
  fbRatio: number; // fungalBiomassKg / bacterialBiomassKg
  activeMyceliumLengthM: number;
}

export interface RainEvent {
  intensityMmPerHour: number;
  durationHours: number;
  dropletImpactEnergy: number; // Kinetic energy (J/m^2/mm), high for storms on bare soil
}

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
  stewardId?: string; // Optional anonymous UUID
  targetPlantId?: string; // For cut_plant
  plantSpecies?: PlantSpecies; // For plant_seedling
  intensity?: number; // 0.0 to 1.0
  targetColumnIndex?: number; // 0 to 15
}

export interface FieldAuditEntry {
  timestampIso: string;
  stewardId: string;
  actionType: ManagementActionType;
  summary: string;
}

export interface WaterBalance {
  surfacePondingMm: number;
  totalRunoffMm: number;
  cumulativeErosionLossKgCarbon: number;
  deepPercolationMm: number;
}

export interface CooperativeLedger {
  growerStakePercent: number;    // Default 35
  landownerStakePercent: number; // Default 30
  playerStakePercent: number;    // Default 35
  carbonBiomassCredits: number;
  mycorrhizalPatronage: number;
  cooperativeMultiplier: number; // 1.00x up to 3.00x
}

export interface SanctuaryColumn {
  columnIndex: number; // 0 to 15
  mulchDepthMm: number;
  surfaceCrustMm: number;
  aHorizonCompacted: boolean;
  bulkDensityGcm3: number;
  mycelialDensity: number; // 0.0 to 1.0
  plantId?: string;
}

export interface SoilState {
  fieldId: string;
  day: number;
  horizons: Record<HorizonType, Horizon>;
  microbial: MicrobialState;
  plants: Plant[];
  hyphalLinks: HyphalLink[];
  waterBalance: WaterBalance;
  cooperativeLedger: CooperativeLedger;
  columns: SanctuaryColumn[];
  auditLog: FieldAuditEntry[];
  seed: number;
}

export interface TickResult {
  state: SoilState;
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
