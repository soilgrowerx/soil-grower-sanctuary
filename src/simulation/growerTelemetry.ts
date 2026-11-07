/**
 * Soil Grower Game - Configurable Grower Data Architecture
 * Per Master Plan Section 3.3 and George's decision:
 * "Design for the substitution: a data interface that starts modeled
 * and can accept a real source later without a redesign."
 */

export interface SoilHorizonTelemetry {
  horizon: 'O' | 'A' | 'E' | 'B' | 'C';
  depthCm: number;
  bulkDensityGcm3: number;
  volumetricWaterContentPercent: number;
  organicMatterPercent: number;
  penetrometerResistancePsi: number;
}

export interface SanctuaryEcologyTelemetry {
  timestampIso: string;
  sanctuaryId: string;
  sourceType: 'modeled_standard' | 'field_sensor_stream' | 'csv_import';
  horizons: SoilHorizonTelemetry[];
  fungalBacterialRatio: number;
  glomalinMgPerG: number;
  activeMycorrhizalColonizationPercent: number;
  canopyPhotosynthateGramsCarbonPerDay: number;
  availablePhosphorusPpm: number;
  lockedPhosphorusPpm: number;
  soilTemperatureFahrenheit: number;
}

export interface GrowerTelemetrySource {
  readonly sourceName: string;
  readonly sourceType: 'modeled_standard' | 'field_sensor_stream' | 'csv_import';
  fetchSanctuaryTelemetry(sanctuaryId: string): Promise<SanctuaryEcologyTelemetry>;
}

/**
 * Modeled standard telemetry source based on USDA-NRCS Soil Health Division equations.
 * Provides deterministic baseline telemetry for Sanctuary Zero.
 */
export const modeledGrowerSource: GrowerTelemetrySource = {
  sourceName: 'Sanctuary Zero Modeled Standard v1.0',
  sourceType: 'modeled_standard',
  async fetchSanctuaryTelemetry(sanctuaryId: string): Promise<SanctuaryEcologyTelemetry> {
    return {
      timestampIso: new Date().toISOString(),
      sanctuaryId,
      sourceType: 'modeled_standard',
      horizons: [
        {
          horizon: 'O',
          depthCm: 2.5,
          bulkDensityGcm3: 0.35,
          volumetricWaterContentPercent: 28.0,
          organicMatterPercent: 62.0,
          penetrometerResistancePsi: 45,
        },
        {
          horizon: 'A',
          depthCm: 15.0,
          bulkDensityGcm3: 1.48,
          volumetricWaterContentPercent: 18.5,
          organicMatterPercent: 2.1,
          penetrometerResistancePsi: 260,
        },
        {
          horizon: 'E',
          depthCm: 10.0,
          bulkDensityGcm3: 1.55,
          volumetricWaterContentPercent: 14.0,
          organicMatterPercent: 0.8,
          penetrometerResistancePsi: 290,
        },
        {
          horizon: 'B',
          depthCm: 45.0,
          bulkDensityGcm3: 1.62,
          volumetricWaterContentPercent: 22.0,
          organicMatterPercent: 0.4,
          penetrometerResistancePsi: 340,
        },
        {
          horizon: 'C',
          depthCm: 60.0,
          bulkDensityGcm3: 1.70,
          volumetricWaterContentPercent: 12.0,
          organicMatterPercent: 0.1,
          penetrometerResistancePsi: 420,
        },
      ],
      fungalBacterialRatio: 0.28,
      glomalinMgPerG: 0.45,
      activeMycorrhizalColonizationPercent: 8.5,
      canopyPhotosynthateGramsCarbonPerDay: 42.0,
      availablePhosphorusPpm: 6.2,
      lockedPhosphorusPpm: 48.0,
      soilTemperatureFahrenheit: 86.4,
    };
  },
};
