import type { SoilSimulationState, ManagementAction, RainEvent, TickResult } from './types.ts';
import { tick } from './soilModel.ts';

/**
 * Compact URL-safe Base64url serialization of SoilSimulationState.
 * Supports accountless sharing and persistence across page reloads and browser sessions.
 * RFC 4648 compliant across Node.js and browser runtimes.
 */
export function exportFieldStateToSeed(state: SoilSimulationState): string {
  const jsonStr = JSON.stringify(state);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(jsonStr, 'utf-8').toString('base64url');
  } else {
    // Cross-environment base64url encoding for browsers
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

/**
 * Deserializes and validates a SoilSimulationState from an exported seed string.
 * RFC 4648 compliant across Node.js and browser runtimes.
 */
export function importFieldStateFromSeed(seed: string): SoilSimulationState {
  let jsonStr = '';
  if (typeof Buffer !== 'undefined') {
    jsonStr = Buffer.from(seed, 'base64url').toString('utf-8');
  } else {
    let base64 = seed.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    jsonStr = decodeURIComponent(escape(atob(base64)));
  }

  const parsed = JSON.parse(jsonStr) as SoilSimulationState;
  if (!parsed.site || !parsed.horizons || !parsed.biology) {
    throw new Error('Invalid SoilState seed payload: missing required properties');
  }
  return parsed;
}

/**
 * Applies an asynchronous visiting steward action to a host field.
 * Allows accountless cooperation where one player's management modifies another's sanctuary,
 * leaving a verifiable audit trace with the visitor's anonymous stewardId.
 */
export function mergeVisitingAction(
  hostState: SoilSimulationState,
  visitingAction: ManagementAction,
  rainEvent?: RainEvent
): TickResult {
  const rain = rainEvent || {
    intensityMmPerHour: 5.0,
    durationHours: 1.0,
    dropletImpactEnergy: 1.2,
  };

  const visitorAction: ManagementAction = {
    ...visitingAction,
    stewardId:
      visitingAction.stewardId ||
      `visiting-steward-${Math.random().toString(36).substring(2, 8)}`,
  };

  return tick(hostState, visitorAction, rain);
}
