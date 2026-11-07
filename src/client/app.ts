import { createDefaultSoilState, tick } from '../simulation/soilModel.ts';
import { exportFieldStateToSeed, importFieldStateFromSeed, mergeVisitingAction } from '../simulation/coop.ts';
import type { SoilState, ManagementAction, RainEvent } from '../simulation/types.ts';

// State management
let state: SoilState = loadInitialState();
let isAutoPlaying = false;
let autoPlayTimer: number | null = null;

function loadInitialState(): SoilState {
  // Check URL seed parameter first
  const params = new URLSearchParams(window.location.search);
  const seedParam = params.get('seed');
  if (seedParam) {
    try {
      return importFieldStateFromSeed(seedParam);
    } catch (e) {
      console.warn('Failed to parse URL seed, falling back to local storage', e);
    }
  }

  // Check localStorage
  const saved = localStorage.getItem('soil_grower_state');
  if (saved) {
    try {
      return importFieldStateFromSeed(saved);
    } catch (e) {
      console.warn('Failed to parse saved state, resetting', e);
    }
  }

  return createDefaultSoilState('sanctuary-zero', 101);
}

function persistState() {
  try {
    const seed = exportFieldStateToSeed(state);
    localStorage.setItem('soil_grower_state', seed);
  } catch (e) {
    console.error('Persistence failed', e);
  }
}

// Canvas Rendering
const canvas = document.getElementById('sanctuaryCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  render();
}

window.addEventListener('resize', resizeCanvas);

function render() {
  const width = canvas.width / window.devicePixelRatio;
  const height = canvas.height / window.devicePixelRatio;

  ctx.clearRect(0, 0, width, height);

  // Background Sky / Atmosphere
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 100);
  skyGrad.addColorStop(0, '#101712');
  skyGrad.addColorStop(1, '#1b241d');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, 100);

  // Soil Horizon Depths
  const horizonTop = 100;
  const soilHeight = height - horizonTop;

  // Horizon boundaries proportioned to actual depth
  const oH = Math.max(12, Math.min(30, state.horizons.O.depthMm * 0.5));
  const aH = 65;
  const eH = 40;
  const bH = 95;
  const cH = soilHeight - (oH + aH + eH + bH);

  const colWidth = width / 16;

  // Render 16 columns
  for (let i = 0; i < 16; i++) {
    const col = state.columns[i];
    const x = i * colWidth;

    // Horizon O (Organic Mulch Layer)
    ctx.fillStyle = col.mulchDepthMm > 15 ? '#5c432d' : '#3d2d1f';
    ctx.fillRect(x, horizonTop, colWidth - 1, oH);

    // Horizon A (Topsoil Root Zone)
    // Darker if uncompacted and high organic carbon
    if (col.aHorizonCompacted) {
      ctx.fillStyle = '#261e18'; // Pale degraded hardpan
    } else {
      ctx.fillStyle = '#18120d'; // Rich biologically active topsoil
    }
    ctx.fillRect(x, horizonTop + oH, colWidth - 1, aH);

    // Surface Crust Indicator
    if (col.surfaceCrustMm > 0) {
      ctx.fillStyle = '#8c7853';
      const crustH = Math.min(8, col.surfaceCrustMm * 2);
      ctx.fillRect(x, horizonTop + oH, colWidth - 1, crustH);
    }

    // Horizon E (Eluviated Mineral Zone)
    ctx.fillStyle = '#7a6a57';
    ctx.fillRect(x, horizonTop + oH + aH, colWidth - 1, eH);

    // Horizon B (Subsoil Illuvial Clay Bank)
    ctx.fillStyle = '#543325';
    ctx.fillRect(x, horizonTop + oH + aH + eH, colWidth - 1, bH);

    // Horizon C (Parent Bedrock Substrate)
    ctx.fillStyle = '#383431';
    ctx.fillRect(x, horizonTop + oH + aH + eH + bH, colWidth - 1, Math.max(0, cH));

    // Mycelial hyphae network traces
    if (col.mycelialDensity > 0.2) {
      ctx.strokeStyle = `rgba(229, 179, 88, ${col.mycelialDensity * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + colWidth * 0.2, horizonTop + oH + 15);
      ctx.lineTo(x + colWidth * 0.8, horizonTop + oH + 45);
      ctx.lineTo(x + colWidth * 0.4, horizonTop + oH + aH + 20);
      ctx.stroke();
    }
  }

  // Lateral Mycorrhizal Hyphae Connections between Plants
  ctx.lineWidth = 2.5;
  for (const link of state.hyphalLinks) {
    if (!link.isActive) continue;
    const pA = state.plants.find((p) => p.id === link.plantAId);
    const pB = state.plants.find((p) => p.id === link.plantBId);
    if (pA && pB && pA.isAlive && pB.isAlive) {
      const xA = ((pA.columnIndex ?? 4) + 0.5) * colWidth;
      const xB = ((pB.columnIndex ?? 10) + 0.5) * colWidth;
      const yA = horizonTop + oH + 30;
      const yB = horizonTop + oH + 25;

      ctx.strokeStyle = '#e5b358';
      ctx.beginPath();
      ctx.moveTo(xA, yA);
      ctx.bezierCurveTo((xA + xB) / 2, yA + 30, (xA + xB) / 2, yB + 30, xB, yB);
      ctx.stroke();
    }
  }

  // Render Plants & Canopies
  for (const plant of state.plants) {
    if (!plant.isAlive) continue;
    const colIdx = plant.columnIndex ?? 4;
    const px = (colIdx + 0.5) * colWidth;
    const groundY = horizonTop;

    if (plant.species === 'climax_tree') {
      // Climax Tree (Nurse Tree or Mature)
      const trunkH = plant.donorPriority > 0.5 ? 55 : 30;
      const crownR = plant.donorPriority > 0.5 ? 32 : 18;

      // Trunk
      ctx.fillStyle = '#4a2f1c';
      ctx.fillRect(px - 3, groundY - trunkH, 6, trunkH);

      // Canopy
      ctx.fillStyle = plant.donorPriority > 0.5 ? '#2f7a4d' : '#389e65';
      ctx.beginPath();
      ctx.arc(px, groundY - trunkH - crownR * 0.5, crownR, 0, Math.PI * 2);
      ctx.fill();

      // Deep Taproot into B horizon
      ctx.strokeStyle = '#5a3d28';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, groundY);
      ctx.lineTo(px, groundY + oH + aH + eH + 30);
      ctx.stroke();
    } else {
      // Herb / Perennial Seedling
      ctx.fillStyle = '#48bb78';
      ctx.beginPath();
      ctx.arc(px, groundY - 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3d2b1f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, groundY);
      ctx.lineTo(px, groundY + oH + 20);
      ctx.stroke();
    }
  }

  // Horizon Labels on Left Edge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '10px sans-serif';
  ctx.fillText('O: Organic Mulch', 6, horizonTop + 10);
  ctx.fillText('A: Topsoil / Rhizosphere', 6, horizonTop + oH + 15);
  ctx.fillText('E: Eluviated Leached', 6, horizonTop + oH + aH + 15);
  ctx.fillText('B: Illuvial Clay Bank', 6, horizonTop + oH + aH + eH + 18);
  ctx.fillText('C: Calcareous Parent', 6, horizonTop + oH + aH + eH + bH + 18);
}

// UI Updating
function updateUI() {
  // Season & Day
  document.getElementById('hudDay')!.textContent = `Day ${state.day} / 90`;
  const seasonPhase =
    state.day < 20
      ? 'Spring Wakeup'
      : state.day < 45
      ? 'Early Summer Canopy'
      : state.day < 70
      ? 'Midsummer Heat Dome'
      : 'Autumn Fungal Flush';
  document.getElementById('hudSeason')!.textContent = seasonPhase;

  // Microbial F:B Ratio
  const fb = state.microbial.fbRatio;
  document.getElementById('meterFbRatio')!.textContent = fb.toFixed(2);
  const fbPercent = Math.min(100, (fb / 4.0) * 100);
  const fbBar = document.getElementById('meterFbBar')!;
  fbBar.style.width = `${fbPercent}%`;
  fbBar.style.backgroundColor = fb >= 3.0 ? '#48bb78' : fb >= 1.2 ? '#9f7aea' : fb >= 0.4 ? '#e5b358' : '#e53e3e';

  let tierName = 'Bacterial Fill (Ruderal)';
  if (fb >= 3.0) tierName = 'Climax Forest Sanctuary';
  else if (fb >= 1.2) tierName = 'Forest Edge Guild';
  else if (fb >= 0.4) tierName = 'Early Succession Herbs';
  document.getElementById('fbTier')!.textContent = tierName;

  // Bulk Density & Crusting
  const bd = state.horizons.A.bulkDensityGcm3;
  document.getElementById('meterBulkDensity')!.textContent = `${bd.toFixed(2)} g/cm³`;
  const bdPercent = Math.min(100, Math.max(0, ((bd - 1.1) / (1.8 - 1.1)) * 100));
  const bdBar = document.getElementById('meterBdBar')!;
  bdBar.style.width = `${bdPercent}%`;
  bdBar.style.backgroundColor = bd > 1.55 ? '#e53e3e' : bd > 1.35 ? '#e5b358' : '#48bb78';

  const crust = state.horizons.A.surfaceCrustThicknessMm || 0;
  document.getElementById('meterCrust')!.textContent = `${crust.toFixed(1)} mm`;

  // Hydrology
  const totalInfil = (state.horizons.O.waterContentMm + state.horizons.A.waterContentMm + state.horizons.B.waterContentMm).toFixed(0);
  document.getElementById('meterWaterBank')!.textContent = `${totalInfil} mm`;
  document.getElementById('meterRunoff')!.textContent = `${state.waterBalance.totalRunoffMm.toFixed(1)} mm`;

  // Tripartite Cooperative Ledger
  const ledger = state.cooperativeLedger;
  document.getElementById('ledgerCredits')!.textContent = `${ledger.carbonBiomassCredits.toFixed(1)} CBC`;
  document.getElementById('ledgerPatronage')!.textContent = `${ledger.mycorrhizalPatronage.toFixed(1)} MP`;
  document.getElementById('ledgerMultiplier')!.textContent = `${ledger.cooperativeMultiplier.toFixed(2)}x`;
  document.getElementById('ledgerGrowerStake')!.textContent = `${ledger.growerStakePercent}%`;
  document.getElementById('ledgerLandownerStake')!.textContent = `${ledger.landownerStakePercent}%`;
  document.getElementById('ledgerPlayerStake')!.textContent = `${ledger.playerStakePercent}%`;

  // Audit Feed
  const feed = document.getElementById('auditFeed')!;
  feed.innerHTML = '';
  for (const entry of state.auditLog.slice(0, 12)) {
    const div = document.createElement('div');
    div.className = 'audit-entry';
    div.innerHTML = `<div class="meta">${new Date(entry.timestampIso).toLocaleTimeString()} - ${entry.stewardId}</div><div>${entry.summary}</div>`;
    feed.appendChild(div);
  }

  // Check Failure States & Show Alert Banner
  const alertBanner = document.getElementById('alertBanner')!;
  if (crust > 3.0 && state.waterBalance.totalRunoffMm > 10) {
    alertBanner.textContent = 'RESTIRATION ALERT: A-horizon kinetic rain crust has sealed surface pores, producing lateral runoff and eroding topsoil carbon. Remediate with AirSpade decompaction and woodchip mulch.';
    alertBanner.className = 'alert-banner active';
  } else if (fb < 0.25) {
    alertBanner.textContent = 'RESTIRATION ALERT: Soil has collapsed to extreme bacterial dominance. Saplings are nutrient-starved. Apply woodchip mulch and aerated fungal tea to restore fungal hyphae.';
    alertBanner.className = 'alert-banner active';
  } else {
    alertBanner.className = 'alert-banner';
  }

  render();
  persistState();
}

// Action Dispatcher
function performAction(actionType: ManagementAction['type'], rainEvent?: RainEvent) {
  const rain = rainEvent || {
    intensityMmPerHour: 2.0,
    durationHours: 1.0,
    dropletImpactEnergy: 0.2,
  };

  const action: ManagementAction = {
    type: actionType,
    stewardId: 'local-steward-player',
  };

  tick(state, action, rain);
  updateUI();
}

// Event Listeners
document.getElementById('btnAirSpade')?.addEventListener('click', () => {
  performAction('air_spade_decompact');
});

document.getElementById('btnMulch')?.addEventListener('click', () => {
  performAction('mulch_woodchips');
});

document.getElementById('btnFungalTea')?.addEventListener('click', () => {
  performAction('inoculate_fungal_tea');
});

document.getElementById('btnPlantSeedling')?.addEventListener('click', () => {
  performAction('plant_seedling');
});

document.getElementById('btnCallStorm')?.addEventListener('click', () => {
  performAction('rest', {
    intensityMmPerHour: 35.0, // Heavy thunderstorm
    durationHours: 1.0,
    dropletImpactEnergy: 1.8,
  });
});

document.getElementById('btnTillage')?.addEventListener('click', () => {
  if (confirm('WARNING: Tillage mechanically shatters fungal hyphae, collapses aggregates, and triggers bacterial boom. Proceed?')) {
    performAction('tillage');
  }
});

document.getElementById('btnNpkBuff')?.addEventListener('click', () => {
  if (confirm('WARNING: Quick N-P-K Buff spikes soil salinity, kills 45% of fungal biomass, and increases compaction. Proceed?')) {
    performAction('synthetic_npk_buff');
  }
});

document.getElementById('btnNextDay')?.addEventListener('click', () => {
  performAction('rest');
});

document.getElementById('btnAutoPlay')?.addEventListener('click', () => {
  isAutoPlaying = !isAutoPlaying;
  const btn = document.getElementById('btnAutoPlay')!;
  if (isAutoPlaying) {
    btn.textContent = 'Pause Season';
    autoPlayTimer = window.setInterval(() => {
      if (state.day >= 90) {
        isAutoPlaying = false;
        clearInterval(autoPlayTimer!);
        btn.textContent = 'Season Finished (Day 90)';
        return;
      }
      performAction('rest');
    }, 1200);
  } else {
    btn.textContent = 'Auto Season';
    if (autoPlayTimer) clearInterval(autoPlayTimer);
  }
});

// Pass C: Accountless Cooperation Link Sharing
document.getElementById('btnShareLink')?.addEventListener('click', () => {
  const seed = exportFieldStateToSeed(state);
  const shareUrl = `${window.location.origin}${window.location.pathname}?seed=${seed}`;
  navigator.clipboard.writeText(shareUrl).then(
    () => alert('Sanctuary share link copied to clipboard. Another player can open this link to inspect and care for your soil without an account.'),
    () => prompt('Copy this URL to share your sanctuary:', shareUrl)
  );
});

document.getElementById('btnVisitingSteward')?.addEventListener('click', () => {
  const visitorId = `visiting-steward-${Math.random().toString(36).substring(2, 7)}`;
  const careAction: ManagementAction = {
    type: 'mulch_woodchips',
    stewardId: visitorId,
  };
  mergeVisitingAction(state, careAction);
  alert(`Visiting steward "${visitorId}" dispatched a woodchip mulch care package! Audit trace recorded.`);
  updateUI();
});

document.getElementById('btnResetField')?.addEventListener('click', () => {
  if (confirm('Reset Sanctuary Zero back to initial degraded urban lot?')) {
    state = createDefaultSoilState('sanctuary-zero', 101);
    localStorage.removeItem('soil_grower_state');
    history.replaceState(null, '', window.location.pathname);
    updateUI();
  }
});

// Modals
document.getElementById('btnOpenHandbook')?.addEventListener('click', () => {
  document.getElementById('handbookModal')?.classList.add('open');
});

document.getElementById('btnCloseHandbook')?.addEventListener('click', () => {
  document.getElementById('handbookModal')?.classList.remove('open');
});

// Initialize
resizeCanvas();
updateUI();
