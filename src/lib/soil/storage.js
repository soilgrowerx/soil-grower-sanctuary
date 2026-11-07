/** Field persistence: local only, no account required. */

const KEY = "sanctuary-zero:v2";

export function saveField(payload) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* private mode or quota: the field simply does not persist */
  }
}

export function loadField() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.state || !parsed.state.horizons) return null;
    const bio = parsed.state.biology || {};
    bio.arbusculeDensity = bio.arbusculeDensity ?? 18;
    bio.glomalinIndex = bio.glomalinIndex ?? 0.2;
    bio.rootExudateFlux = bio.rootExudateFlux ?? 0.26;
    bio.tardigradeCount = bio.tardigradeCount ?? 6;
    bio.tardigradeState = bio.tardigradeState ?? "tun";
    bio.nematodeCount = bio.nematodeCount ?? 14;
    bio.protozoaCount = bio.protozoaCount ?? 18;
    bio.rhizosphereBacteriaMgPerKg = bio.rhizosphereBacteriaMgPerKg ?? 210;
    bio.biocharCarbonFraction = bio.biocharCarbonFraction ?? 0.04;
    parsed.state.biology = bio;
    return parsed;
  } catch {
    return null;
  }
}

export function clearField() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
