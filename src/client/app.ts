import {
  createDefaultSoilState,
  performGestureVerb,
  advanceToNextSeason,
  evaluateSeasonOutcome,
  sumHorizonCarbonKg,
} from '../simulation/soilModel.ts';
import { exportFieldStateToSeed, importFieldStateFromSeed } from '../simulation/coop.ts';
import type {
  SoilSimulationState,
  BioregionId,
  CoreVerb,
  FeedSubMode,
  DisturbSubMode,
  HorizonType,
} from '../simulation/types.ts';

// -------------------------------------------------------------
// STATE & PERSISTENCE
// -------------------------------------------------------------
const STORAGE_KEY = 'soil_grower_v2_state';
let state: SoilSimulationState = loadInitialState();
let selectedFeedMode: FeedSubMode = 'mulch';
let selectedDisturbMode: DisturbSubMode = 'till';
let seasonSecondsRemaining = 90;
let seasonModalOpen = false;

function loadInitialState(): SoilSimulationState {
  const params = new URLSearchParams(window.location.search);
  const seedParam = params.get('seed');
  if (seedParam) {
    try {
      return importFieldStateFromSeed(seedParam);
    } catch {
      // Fallback to local state
    }
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return importFieldStateFromSeed(saved);
    } catch {
      // Reset if schema changed
    }
  }
  return createDefaultSoilState('sanctuary-zero', 101, 'rogue_valley');
}

function persistState() {
  try {
    const seed = exportFieldStateToSeed(state);
    localStorage.setItem(STORAGE_KEY, seed);
  } catch {
    // Ignore storage quota errors
  }
}

// -------------------------------------------------------------
// PARTICLE & PHYSICAL ANIMATION ENGINE (60 FPS)
// -------------------------------------------------------------
interface RainDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: 'falling' | 'infiltrating' | 'runoff';
  targetDepthY: number;
  alpha: number;
  carriesSoil: boolean;
}

interface HyphalPulse {
  t: number;
  speed: number;
}

interface DustCrumb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface SnapSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
}

const rainDrops: RainDrop[] = [];
const hyphalPulses: HyphalPulse[] = [
  { t: 0.1, speed: 0.004 },
  { t: 0.55, speed: 0.004 },
];
const dustCrumbs: DustCrumb[] = [];
const snapSparks: SnapSpark[] = [];

let crustGlowIntensity = 0;     // Glows bright amber-red when water hits crust
let hyphaeSurgeGlow = 0;        // Glows golden-violet when fed
let disturbGreyFlash = 0;       // Flashes ashen grey and shakes when disturbed
let disturbBladeX = -1;         // Sweeping rotary/shear visual during disturb
let displayedFbRatio = state.biology.fungalToBacterialRatio;
let displayedAggStability = state.horizons.A.aggregateStability;
let displayedMulchMm = state.horizons.O.depthMm;

interface HorizonBand {
  type: HorizonType;
  topY: number;
  bottomY: number;
  unlocked: boolean;
}
let currentHorizonBands: HorizonBand[] = [];

// -------------------------------------------------------------
// CANVAS SETUP
// -------------------------------------------------------------
const canvas = document.getElementById('fieldCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// -------------------------------------------------------------
// TRIGGER IMMEDIATE PHYSICAL VERB ANIMATIONS
// -------------------------------------------------------------
function triggerVerbAnimation(
  verb: CoreVerb,
  infiltratedMm: number,
  runoffMm: number
) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const surfaceY = h * 0.29;

  if (verb === 'water') {
    const shedsMost = runoffMm > infiltratedMm;
    if (shedsMost || state.water.isCrusted) {
      crustGlowIntensity = 1.0;
    }
    for (let i = 0; i < 85; i++) {
      rainDrops.push({
        x: Math.random() * w,
        y: Math.random() * surfaceY * 0.85,
        vx: -0.5,
        vy: 7 + Math.random() * 5,
        phase: 'falling',
        targetDepthY: surfaceY + 45 + Math.random() * (h * 0.45),
        alpha: 0.95,
        carriesSoil: shedsMost && Math.random() < 0.65,
      });
    }
  } else if (verb === 'feed') {
    hyphaeSurgeGlow = 1.0;
    // Mulch / compost / tea particles raining onto surface
    for (let i = 0; i < 48; i++) {
      dustCrumbs.push({
        x: w * 0.08 + Math.random() * (w * 0.84),
        y: surfaceY - 50 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 2.5 + Math.random() * 2.5,
        size: 3 + Math.random() * 4,
        color: selectedFeedMode === 'tea' ? '#c084fc' : '#f59e0b',
        alpha: 1.0,
      });
    }
    // Extra carbon transfer pulses across mycorrhizal network
    for (let i = 0; i < 5; i++) {
      hyphalPulses.push({
        t: i * 0.18,
        speed: 0.009,
      });
    }
  } else if (verb === 'disturb') {
    disturbGreyFlash = 1.0;
    disturbBladeX = 0;
    // Crumbling soil aggregates & rising grey dust
    for (let i = 0; i < 65; i++) {
      dustCrumbs.push({
        x: Math.random() * w,
        y: surfaceY + 15 + Math.random() * 75,
        vx: (Math.random() - 0.5) * 4.5,
        vy: -2.8 + Math.random() * 3.2,
        size: 2.5 + Math.random() * 5.5,
        color: i % 2 === 0 ? '#9ca3af' : '#78716c',
        alpha: 1.0,
      });
    }
    // Snapping fungal thread sparks
    for (let i = 0; i < 32; i++) {
      snapSparks.push({
        x: w * 0.15 + Math.random() * (w * 0.7),
        y: surfaceY + 25 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        alpha: 1.0,
      });
    }
  }
}

// -------------------------------------------------------------
// MAIN 60FPS RENDER LOOP
// -------------------------------------------------------------
function renderFrame() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Smoothly interpolate visual state
  displayedFbRatio += (state.biology.fungalToBacterialRatio - displayedFbRatio) * 0.08;
  displayedAggStability += (state.horizons.A.aggregateStability - displayedAggStability) * 0.08;
  displayedMulchMm += (state.horizons.O.depthMm - displayedMulchMm) * 0.1;

  crustGlowIntensity = Math.max(0, crustGlowIntensity - 0.014);
  hyphaeSurgeGlow = Math.max(0, hyphaeSurgeGlow - 0.015);
  disturbGreyFlash = Math.max(0, disturbGreyFlash - 0.018);
  if (disturbBladeX >= 0) {
    disturbBladeX += w * 0.045;
    if (disturbBladeX > w * 1.1) disturbBladeX = -1;
  }

  ctx.clearRect(0, 0, w, h);

  // Screen shake during disturb
  ctx.save();
  if (disturbGreyFlash > 0.4) {
    const shake = (disturbGreyFlash - 0.4) * 8;
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  const surfaceY = Math.round(h * 0.29);
  const soilTotalH = h - surfaceY;

  // 1. SKY & ATMOSPHERE
  const skyGrad = ctx.createLinearGradient(0, 0, 0, surfaceY);
  skyGrad.addColorStop(0, '#0a161c');
  skyGrad.addColorStop(0.6, '#13282c');
  skyGrad.addColorStop(1, '#1d3a33');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, surfaceY + 4);

  // Subtle sun / moon glow in sky
  const sunGrad = ctx.createRadialGradient(w * 0.8, surfaceY * 0.35, 4, w * 0.8, surfaceY * 0.35, w * 0.35);
  sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.18)');
  sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, surfaceY);

  // 2. HORIZON GEOMETRY
  const oH = Math.max(12, Math.min(34, displayedMulchMm * 0.55));
  const aH = Math.round(soilTotalH * 0.24);
  const eH = Math.round(soilTotalH * 0.14);
  const bH = Math.round(soilTotalH * 0.26);
  const cH = Math.max(20, soilTotalH - (oH + aH + eH + bH));

  const unlockedSet = new Set(state.season.unlockedHorizons);
  currentHorizonBands = [
    { type: 'O', topY: surfaceY, bottomY: surfaceY + oH, unlocked: unlockedSet.has('O') },
    { type: 'A', topY: surfaceY + oH, bottomY: surfaceY + oH + aH, unlocked: unlockedSet.has('A') },
    { type: 'E', topY: surfaceY + oH + aH, bottomY: surfaceY + oH + aH + eH, unlocked: unlockedSet.has('E') },
    { type: 'B', topY: surfaceY + oH + aH + eH, bottomY: surfaceY + oH + aH + eH + bH, unlocked: unlockedSet.has('B') },
    { type: 'C', topY: surfaceY + oH + aH + eH + bH, bottomY: h, unlocked: unlockedSet.has('C') },
  ];

  // 3. DRAW HORIZONS (O, A, E, B, C)
  const [bandO, bandA, bandE, bandB, bandC] = currentHorizonBands;

  // O Horizon: Organic Litter & Mulch Sponge
  const residue = state.management.residueCoverFraction;
  ctx.fillStyle = residue > 0.45 ? '#5c3d22' : '#3d2c1e';
  ctx.fillRect(0, bandO.topY, w, oH);
  // Textured woodchips on O horizon
  const chipCount = Math.floor(14 + residue * 45);
  ctx.fillStyle = residue > 0.45 ? '#b47b38' : '#6b533b';
  for (let i = 0; i < chipCount; i++) {
    const cx = ((i * 73) % w);
    const cy = bandO.topY + 2 + ((i * 19) % Math.max(4, oH - 4));
    ctx.fillRect(cx, cy, 10 + (i % 8), 3);
  }

  // A Horizon: Topsoil (greys when disturbed or low aggregate stability; rich dark chocolate when healthy)
  const isGreyed = displayedAggStability < 0.22 || disturbGreyFlash > 0.1;
  const aBaseColor = isGreyed ? '#4b4843' : displayedAggStability > 0.55 ? '#1f1610' : '#2e2218';
  ctx.fillStyle = aBaseColor;
  ctx.fillRect(0, bandA.topY, w, aH);

  // Moisture tint in A Horizon
  const aMoistureRatio = Math.min(1, state.horizons.A.currentWaterMm / state.horizons.A.waterHoldingCapacityMm);
  if (aMoistureRatio > 0.1) {
    ctx.fillStyle = `rgba(56, 189, 248, ${aMoistureRatio * 0.16})`;
    ctx.fillRect(0, bandA.topY, w, aH);
  }

  // Soil Aggregates (Peds) in A Horizon
  const pedCount = Math.floor(16 + displayedAggStability * 42);
  ctx.fillStyle = isGreyed ? 'rgba(156, 163, 175, 0.28)' : 'rgba(92, 64, 40, 0.55)';
  for (let i = 0; i < pedCount; i++) {
    const px = ((i * 61 + 17) % (w - 16)) + 8;
    const py = bandA.topY + 8 + ((i * 37) % Math.max(12, aH - 16));
    const pr = 2.5 + displayedAggStability * 5.5;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Surface Crust Seal (glows amber-red when rain beads & sheets off)
  if (state.water.crustThicknessMm > 0.3 || crustGlowIntensity > 0.05) {
    const crustH = Math.max(4, Math.min(11, state.water.crustThicknessMm * 2.4));
    const glowAlpha = Math.min(1, 0.55 + crustGlowIntensity * 0.45);
    ctx.fillStyle =
      crustGlowIntensity > 0.1
        ? `rgba(245, 158, 11, ${glowAlpha})`
        : `rgba(168, 148, 118, 0.78)`;
    ctx.fillRect(0, bandA.topY - 2, w, crustH);

    if (crustGlowIntensity > 0.1) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16 * crustGlowIntensity;
      ctx.fillStyle = `rgba(251, 191, 36, ${crustGlowIntensity * 0.8})`;
      ctx.fillRect(0, bandA.topY - 2, w, 4);
      ctx.shadowBlur = 0;
    }
  }

  // E Horizon: Eluviated Mineral Filter
  ctx.fillStyle = '#6e6051';
  ctx.fillRect(0, bandE.topY, w, eH);

  // B Horizon: Deep Clay Moisture Bank
  ctx.fillStyle = '#4e2f21';
  ctx.fillRect(0, bandB.topY, w, bH);
  const bMoistureRatio = Math.min(1, state.horizons.B.currentWaterMm / state.horizons.B.waterHoldingCapacityMm);
  if (bMoistureRatio > 0.05) {
    const bWaterGrad = ctx.createLinearGradient(0, bandB.topY, 0, bandB.bottomY);
    bWaterGrad.addColorStop(0, `rgba(14, 165, 233, ${bMoistureRatio * 0.12})`);
    bWaterGrad.addColorStop(1, `rgba(56, 189, 248, ${bMoistureRatio * 0.38})`);
    ctx.fillStyle = bWaterGrad;
    ctx.fillRect(0, bandB.topY, w, bH);
  }

  // C Horizon: Weathered Parent Substrate
  ctx.fillStyle = '#332f2c';
  ctx.fillRect(0, bandC.topY, w, cH);
  // Bedrock stones in C Horizon
  ctx.fillStyle = '#47423e';
  for (let i = 0; i < 14; i++) {
    const rx = ((i * 97) % w);
    const ry = bandC.topY + 10 + ((i * 29) % Math.max(10, cH - 22));
    ctx.beginPath();
    ctx.ellipse(rx, ry, 18 + (i % 12), 8 + (i % 5), 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. EARTHWORM MACROPORES (Vertical Infiltration Channels)
  const wormCount = Math.min(10, Math.floor(state.biology.earthwormActivityIndex / 10));
  ctx.strokeStyle = 'rgba(18, 12, 9, 0.65)';
  ctx.lineWidth = 3.5;
  for (let i = 0; i < wormCount; i++) {
    const wx = ((i + 1) * (w / (wormCount + 1)));
    ctx.beginPath();
    ctx.moveTo(wx, bandA.topY + 4);
    ctx.quadraticCurveTo(wx + 10, bandA.bottomY, wx - 6, bandB.topY + bH * 0.55);
    ctx.stroke();
  }

  // 5. MYCORRHIZAL HYPHAE & CARBON TRANSFER NETWORK
  const nurseX = w * 0.24;
  const saplingX = w * 0.76;
  const rootZoneY = bandA.topY + aH * 0.52;

  const hyphalStrength = Math.min(1, displayedFbRatio / 1.5);
  const threadCount = Math.max(2, Math.floor(3 + displayedFbRatio * 14));

  // Branching fungal threads across profile
  ctx.save();
  if (hyphaeSurgeGlow > 0.05) {
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 12 * hyphaeSurgeGlow;
  }
  for (let i = 0; i < threadCount; i++) {
    const startX = (w * (i + 0.5)) / threadCount;
    const depthReach = bandA.topY + 12 + Math.min(aH + eH + bH * 0.5, (i % 5 + 1) * 28 * (0.5 + hyphalStrength));
    ctx.strokeStyle =
      i % 2 === 0
        ? `rgba(245, 158, 11, ${0.22 + hyphalStrength * 0.55})`
        : `rgba(192, 132, 252, ${0.22 + hyphalStrength * 0.55})`;
    ctx.lineWidth = 1.2 + hyphalStrength * 1.2;
    ctx.beginPath();
    ctx.moveTo(startX, bandA.topY + 6);
    ctx.bezierCurveTo(
      startX - 22,
      (bandA.topY + depthReach) * 0.5,
      startX + 24,
      depthReach - 15,
      startX + (i % 2 === 0 ? 15 : -15),
      depthReach
    );
    ctx.stroke();
  }

  // Primary Mycorrhizal Bridge between Nurse Oak & Sapling
  const activeLink = state.hyphalLinks.find((l) => l.isActive && l.conductance > 0);
  if (activeLink) {
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.45 + hyphalStrength * 0.5})`;
    ctx.lineWidth = 2.5 + hyphalStrength * 2;
    ctx.beginPath();
    ctx.moveTo(nurseX, rootZoneY);
    ctx.bezierCurveTo(
      w * 0.42,
      rootZoneY + 38,
      w * 0.58,
      rootZoneY - 18,
      saplingX,
      rootZoneY
    );
    ctx.stroke();

    // Animated Carbon Orbs flowing from Nurse Tree to Sapling
    for (let i = hyphalPulses.length - 1; i >= 0; i--) {
      const p = hyphalPulses[i];
      p.t += p.speed * (0.7 + hyphalStrength);
      if (p.t > 1) {
        if (hyphalPulses.length > 2) {
          hyphalPulses.splice(i, 1);
          continue;
        }
        p.t = 0;
      }
      const u = 1 - p.t;
      const bx =
        u * u * u * nurseX +
        3 * u * u * p.t * (w * 0.42) +
        3 * u * p.t * p.t * (w * 0.58) +
        p.t * p.t * p.t * saplingX;
      const by =
        u * u * u * rootZoneY +
        3 * u * u * p.t * (rootZoneY + 38) +
        3 * u * p.t * p.t * (rootZoneY - 18) +
        p.t * p.t * p.t * rootZoneY;

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(bx, by, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 6. PLANTS & ROOT MASS (Nurse Tree & Young Sapling)
  drawLivingTree(
    nurseX,
    surfaceY,
    68,
    38,
    bandB.topY + bH * 0.45,
    true,
    displayedAggStability
  );

  const saplingBiomass = state.plants[1]?.biomassKg ?? 0.6;
  const saplingGrowth = Math.min(1.6, Math.max(0.7, saplingBiomass / 0.8));
  drawLivingTree(
    saplingX,
    surfaceY,
    32 * saplingGrowth,
    18 * saplingGrowth,
    bandA.topY + aH * Math.min(1.3, 0.65 * saplingGrowth),
    false,
    displayedAggStability
  );

  // 7. PROGRESSIVE HORIZON VEILS (Unlocks one deeper each season)
  for (const band of currentHorizonBands) {
    // Subtle horizon divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, band.topY);
    ctx.lineTo(w, band.topY);
    ctx.stroke();

    // Horizon badge on left edge (tappable cue)
    ctx.fillStyle = band.unlocked ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.35)';
    ctx.font = '700 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(band.type, 10, band.topY + 15);

    if (!band.unlocked) {
      ctx.fillStyle = 'rgba(8, 12, 10, 0.56)';
      ctx.fillRect(0, band.topY, w, band.bottomY - band.topY);

      const reqSeason = band.type === 'E' ? 2 : band.type === 'B' ? 3 : 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`Unlocks Season ${reqSeason}`, 28, band.topY + 15);
    }
  }

  // 8. ACTIVE DISTURBANCE ROTARY SWEEP
  if (disturbBladeX >= 0) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(disturbBladeX, bandA.topY + 22, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 9. ANIMATE RAIN DROPS (Sinking vs Beading & Sheeting Off)
  const shedsWater = state.water.isCrusted || state.management.residueCoverFraction < 0.35;
  for (let i = rainDrops.length - 1; i >= 0; i--) {
    const d = rainDrops[i];
    if (d.phase === 'falling') {
      d.x += d.vx;
      d.y += d.vy;
      if (d.y >= surfaceY) {
        if (shedsWater && d.carriesSoil) {
          d.phase = 'runoff';
          d.y = bandA.topY - 2;
          d.vx = 4.5 + Math.random() * 4.5;
          d.vy = (Math.random() - 0.3) * 0.8;
        } else {
          d.phase = 'infiltrating';
          d.vx = (Math.random() - 0.5) * 0.6;
          d.vy = 1.6 + Math.random() * 1.4;
        }
      }
    } else if (d.phase === 'runoff') {
      d.x += d.vx;
      d.y += d.vy;
      d.alpha -= 0.008;
      if (d.x > w + 10 || d.alpha <= 0) {
        rainDrops.splice(i, 1);
        continue;
      }
    } else {
      // Infiltrating down macropores
      d.x += d.vx;
      d.y += d.vy;
      d.alpha -= 0.012;
      if (d.y >= d.targetDepthY || d.alpha <= 0) {
        rainDrops.splice(i, 1);
        continue;
      }
    }

    if (d.phase === 'falling') {
      ctx.strokeStyle = `rgba(56, 189, 248, ${d.alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.vx * 2, d.y - 10);
      ctx.stroke();
    } else if (d.phase === 'runoff') {
      // Beading water + brown eroded topsoil
      ctx.fillStyle = `rgba(56, 189, 248, ${d.alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(180, 115, 56, ${d.alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(d.x - 5, d.y + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Deep soaking water droplet
      ctx.fillStyle = `rgba(56, 189, 248, ${d.alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 10. ANIMATE DUST CRUMBS, MULCH FLAKES & SNAPPING THREAD SPARKS
  for (let i = dustCrumbs.length - 1; i >= 0; i--) {
    const c = dustCrumbs[i];
    c.x += c.vx;
    c.y += c.vy;
    c.alpha -= 0.016;
    if (c.alpha <= 0) {
      dustCrumbs.splice(i, 1);
      continue;
    }
    ctx.fillStyle = c.color;
    ctx.globalAlpha = Math.max(0, c.alpha);
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  for (let i = snapSparks.length - 1; i >= 0; i--) {
    const s = snapSparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= 0.028;
    if (s.alpha <= 0) {
      snapSparks.splice(i, 1);
      continue;
    }
    ctx.strokeStyle = `rgba(248, 113, 113, ${s.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 2, s.y - s.vy * 2);
    ctx.stroke();
  }

  ctx.restore();
  requestAnimationFrame(renderFrame);
}

function drawLivingTree(
  x: number,
  groundY: number,
  trunkH: number,
  crownR: number,
  rootBottomY: number,
  isNurse: boolean,
  aggStability: number
) {
  // Root mass branching into horizons
  const rootBranches = isNurse ? 7 : 5;
  ctx.strokeStyle = '#7c5836';
  ctx.lineWidth = isNurse ? 2.6 : 1.8;
  for (let i = 0; i < rootBranches; i++) {
    const spread = (i - (rootBranches - 1) / 2) * (isNurse ? 18 : 11);
    ctx.beginPath();
    ctx.moveTo(x, groundY + 2);
    ctx.quadraticCurveTo(
      x + spread * 0.6,
      (groundY + rootBottomY) * 0.5,
      x + spread,
      rootBottomY - Math.abs(spread) * 0.4
    );
    ctx.stroke();
  }

  // Trunk
  ctx.fillStyle = '#4a301d';
  const trunkW = isNurse ? 8 : 5;
  ctx.fillRect(x - trunkW / 2, groundY - trunkH, trunkW, trunkH + 3);

  // Canopy Crown
  const vitalityGreen = aggStability > 0.45 ? '#22c55e' : '#4d7c5b';
  ctx.fillStyle = isNurse ? '#15803d' : vitalityGreen;
  ctx.beginPath();
  ctx.arc(x, groundY - trunkH - crownR * 0.35, crownR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = vitalityGreen;
  ctx.beginPath();
  ctx.arc(x - crownR * 0.45, groundY - trunkH, crownR * 0.72, 0, Math.PI * 2);
  ctx.arc(x + crownR * 0.45, groundY - trunkH, crownR * 0.72, 0, Math.PI * 2);
  ctx.fill();
}

// -------------------------------------------------------------
// HUD & SEASON LOOP MANAGEMENT
// -------------------------------------------------------------
const seasonLabelEl = document.getElementById('seasonLabel')!;
const seasonTimerEl = document.getElementById('seasonTimer')!;
const decisionPipsEl = document.getElementById('decisionPips')!;
const headlineBannerEl = document.getElementById('headlineBanner')!;
const seasonEndModalEl = document.getElementById('seasonEndModal')!;

function updateHud() {
  seasonLabelEl.textContent = `Season ${state.season.seasonNumber}`;
  const mins = Math.floor(seasonSecondsRemaining / 60);
  const secs = seasonSecondsRemaining % 60;
  seasonTimerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  const taken = state.season.decisionsTakenInSeason;
  const pips = decisionPipsEl.querySelectorAll('.pip');
  pips.forEach((pip, idx) => {
    pip.className = 'pip';
    if (idx < taken) pip.classList.add('used');
    else if (idx === taken) pip.classList.add('active');
  });

  const bioSelect = document.getElementById('bioregionSelect') as HTMLSelectElement;
  if (bioSelect && bioSelect.value !== state.site.bioregionId) {
    bioSelect.value = state.site.bioregionId;
  }
}

function setHeadline(sentence: string) {
  headlineBannerEl.textContent = sentence;
}

function openSeasonEndModal() {
  if (seasonModalOpen) return;
  seasonModalOpen = true;

  const outcome = evaluateSeasonOutcome(state);
  document.getElementById('endSeasonEyebrow')!.textContent = `SEASON ${state.season.seasonNumber} COMPLETE`;
  document.getElementById('endScoreValue')!.textContent = String(outcome.livingSoilScore);
  document.getElementById('endOutcomeLine')!.textContent = outcome.soilBecameLine;
  document.getElementById('endUnlockBanner')!.textContent = outcome.nextHorizonUnlockLine;

  const nextSeasonNum = state.season.seasonNumber + 1;
  document.getElementById('btnNextSeason')!.textContent = `Play Season ${nextSeasonNum}`;

  // Populate exact reconciled math box (shown on demand when tapped)
  const waterIn = state.water.totalWaterInMm.toFixed(1);
  const waterInfil = state.water.totalInfiltratedMm.toFixed(1);
  const waterRunoff = state.water.runoffVolumeMm.toFixed(1);

  const cInit = state.carbon.initialTotalCarbonKg.toFixed(2);
  const cGain = state.carbon.totalCarbonGainedKg.toFixed(2);
  const cLost = (state.carbon.fluxToAtmosphereKg + state.carbon.lossOffPlotKg).toFixed(2);
  const cPool = sumHorizonCarbonKg(state.carbon.poolByHorizonKg).toFixed(2);

  const reconcileBox = document.getElementById('endReconcileBox')!;
  reconcileBox.innerHTML = `
    <div><strong>Water Balance:</strong> ${waterIn} mm in = ${waterInfil} mm infiltrated + ${waterRunoff} mm runoff</div>
    <div><strong>Carbon Balance:</strong> ${cInit} kg start + ${cGain} kg gained - ${cLost} kg lost = ${cPool} kg in soil</div>
    <div><strong>Biology:</strong> F:B Ratio ${state.biology.fungalToBacterialRatio.toFixed(2)} · Aggregate Stability ${(state.horizons.A.aggregateStability * 100).toFixed(0)}%</div>
  `;

  seasonEndModalEl.classList.remove('hidden');
}

function startNewSeason() {
  state = advanceToNextSeason(state);
  seasonSecondsRemaining = 90;
  seasonModalOpen = false;
  seasonEndModalEl.classList.add('hidden');
  document.getElementById('endReconcileBox')?.classList.add('hidden');
  const newestHorizon = state.season.unlockedHorizons[state.season.unlockedHorizons.length - 1];
  setHeadline(`Season ${state.season.seasonNumber} begun: Horizon ${newestHorizon} is now unlocked and active.`);
  updateHud();
  persistState();
}

// 90-second Season Countdown Clock
window.setInterval(() => {
  if (seasonModalOpen) return;
  if (seasonSecondsRemaining > 0) {
    seasonSecondsRemaining -= 1;
    updateHud();
  }
  if (seasonSecondsRemaining <= 0) {
    openSeasonEndModal();
  }
}, 1000);

// -------------------------------------------------------------
// PLAYER GESTURE HANDLERS (WATER, FEED, DISTURB)
// -------------------------------------------------------------
function handleVerbAction(verb: CoreVerb) {
  if (seasonModalOpen) return;

  const subMode = verb === 'feed' ? selectedFeedMode : verb === 'disturb' ? selectedDisturbMode : undefined;
  const result = performGestureVerb(state, verb, subMode);
  state = result.state;

  // Immediate (<16ms) physical animation on the field
  triggerVerbAnimation(verb, result.infiltrationMm, result.runoffMm);
  setHeadline(result.headlineOutcome);
  updateHud();
  persistState();

  // If 3 decisions completed in this season, present Season End outcome after the physical animation lands
  if (state.season.decisionsTakenInSeason >= state.season.maxDecisionsPerSeason) {
    window.setTimeout(() => {
      openSeasonEndModal();
    }, 1500);
  }
}

document.getElementById('btnVerbWater')?.addEventListener('click', () => {
  handleVerbAction('water');
});

document.getElementById('btnVerbFeed')?.addEventListener('click', () => {
  handleVerbAction('feed');
});

document.getElementById('btnVerbDisturb')?.addEventListener('click', () => {
  handleVerbAction('disturb');
});

// Submode chips for Feed (Mulch / Tea / Compost)
document.getElementById('feedModes')?.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('.mode-chip') as HTMLElement | null;
  if (!target) return;
  const mode = target.dataset.mode as FeedSubMode;
  if (!mode) return;
  selectedFeedMode = mode;
  document.querySelectorAll('#feedModes .mode-chip').forEach((el) => el.classList.remove('active'));
  target.classList.add('active');
  const labelMap: Record<FeedSubMode, string> = {
    mulch: 'Woodchip Mulch',
    tea: 'Fungal Tea',
    compost: 'Living Compost',
  };
  document.getElementById('subFeed')!.textContent = labelMap[mode];
});

// Submode chips for Disturb (Till / Graze / Harvest)
document.getElementById('disturbModes')?.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('.mode-chip') as HTMLElement | null;
  if (!target) return;
  const mode = target.dataset.mode as DisturbSubMode;
  if (!mode) return;
  selectedDisturbMode = mode;
  document.querySelectorAll('#disturbModes .mode-chip').forEach((el) => el.classList.remove('active'));
  target.classList.add('active');
  const labelMap: Record<DisturbSubMode, string> = {
    till: 'Rotary Till',
    graze: 'Heavy Graze',
    harvest: 'Clear Harvest',
  };
  document.getElementById('subDisturb')!.textContent = labelMap[mode];
});

// Bioregion selector (defaults to Rogue Valley, OR)
document.getElementById('bioregionSelect')?.addEventListener('change', (e) => {
  const bioId = (e.target as HTMLSelectElement).value as BioregionId;
  state = createDefaultSoilState('sanctuary-zero', state.seed + 1, bioId);
  seasonSecondsRemaining = 90;
  setHeadline(`Switched bioregion to ${state.site.bioregionName} (${state.site.soilSeries}).`);
  updateHud();
  persistState();
});

// Season End Modal actions
document.getElementById('btnNextSeason')?.addEventListener('click', () => {
  startNewSeason();
});

function toggleReconcileBox() {
  document.getElementById('endReconcileBox')?.classList.toggle('hidden');
}
document.getElementById('btnToggleMath')?.addEventListener('click', toggleReconcileBox);
document.getElementById('endScoreRing')?.addEventListener('click', toggleReconcileBox);

// -------------------------------------------------------------
// TAP-ON-CANVAS NUMBER INSPECTOR (Keep the math, hide the spreadsheet)
// -------------------------------------------------------------
const inspectorPopover = document.getElementById('inspectorPopover')!;
const inspectTitle = document.getElementById('inspectTitle')!;
const inspectBody = document.getElementById('inspectBody')!;

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;

  const tappedBand = currentHorizonBands.find((b) => y >= b.topY && y <= b.bottomY);
  if (!tappedBand) {
    inspectorPopover.classList.add('hidden');
    return;
  }

  const hState = state.horizons[tappedBand.type];
  const cPool = state.carbon.poolByHorizonKg[tappedBand.type];
  const waterIn = state.water.totalWaterInMm.toFixed(1);
  const waterOut = (state.water.totalInfiltratedMm + state.water.runoffVolumeMm).toFixed(1);

  inspectTitle.textContent = `${hState.name}`;
  inspectBody.innerHTML = `
    <div class="inspect-stat">
      <span class="lbl">Water Stored</span>
      <span class="val">${hState.currentWaterMm.toFixed(1)} / ${hState.waterHoldingCapacityMm.toFixed(0)} mm</span>
    </div>
    <div class="inspect-stat">
      <span class="lbl">Horizon Carbon</span>
      <span class="val">${cPool.toFixed(2)} kg</span>
    </div>
    <div class="inspect-stat">
      <span class="lbl">Aggregate Stability</span>
      <span class="val">${(hState.aggregateStability * 100).toFixed(0)}%</span>
    </div>
    <div class="inspect-stat">
      <span class="lbl">Bulk Density</span>
      <span class="val">${hState.bulkDensityGcm3.toFixed(2)} g/cm³</span>
    </div>
    <div class="inspect-stat">
      <span class="lbl">Fungal:Bacterial</span>
      <span class="val">${state.biology.fungalToBacterialRatio.toFixed(2)}</span>
    </div>
    <div class="inspect-stat">
      <span class="lbl">Water In vs Out</span>
      <span class="val">${waterIn}mm = ${waterOut}mm</span>
    </div>
  `;
  inspectorPopover.classList.remove('hidden');
});

document.getElementById('btnCloseInspect')?.addEventListener('click', () => {
  inspectorPopover.classList.add('hidden');
});

// Initialize UI & start 60fps loop
updateHud();
requestAnimationFrame(renderFrame);
