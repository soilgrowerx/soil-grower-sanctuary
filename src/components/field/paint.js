/**
 * Paints the living soil cross-section and subsurface rhizosphere food web.
 * Pure canvas: reads the simulation state, never mutates it.
 * Every horizon band, water meniscus, root exudate halo, AMF arbuscule,
 * biochar honeycomb, tardigrade, nematode, and earthworm burrow is driven by model state.
 */

const ORDER = ["O", "A", "E", "B", "C"];
const WEIGHT = { O: 0.11, A: 0.36, E: 0.15, B: 0.27, C: 0.11 };
const TAU = Math.PI * 2;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function mix(a, b, k) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(
    A[1] + (B[1] - A[1]) * k
  )},${Math.round(A[2] + (B[2] - A[2]) * k)})`;
}

export function computeGeometry(w, h, unlocked = ["O", "A"]) {
  const sky = Math.min(Math.max(h * 0.21, 104), 228);
  const soilTop = sky;
  const total = ORDER.reduce((s, t) => s + WEIGHT[t], 0);
  let y = soilTop;
  const bands = [];
  for (const type of ORDER) {
    const bh = (WEIGHT[type] / total) * (h - soilTop);
    bands.push({ type, y0: y, y1: y + bh, unlocked: unlocked.includes(type) });
    y += bh;
  }
  const band = {};
  for (const b of bands) band[b.type] = b;
  return { w, h, sky, soilTop, soilH: h - soilTop, bands, band };
}

export function depthToY(geom, soil, mm) {
  let acc = 0;
  for (const t of ORDER) {
    const d = soil.horizons[t].depthMm || 1;
    const b = geom.band[t];
    if (mm <= acc + d) return b.y0 + ((mm - acc) / d) * (b.y1 - b.y0);
    acc += d;
  }
  return geom.h;
}

export function getSubsurfaceHotspots(geom, soil) {
  const o = geom.band.O;
  const a = geom.band.A;
  const aH = a.y1 - a.y0;
  return [
    {
      id: "amf",
      x: geom.w * 0.31,
      y: a.y0 + aH * 0.44,
      label: "AMF Arbuscules",
      sub: `${Math.round(soil.biology.arbusculeDensity ?? 18)}% root trade`,
      color: "#6ee7b7",
      horizon: "A",
    },
    {
      id: "tardigrade",
      x: geom.w * 0.19,
      y: o.y0 + (o.y1 - o.y0) * 0.65,
      label: "Tardigrades & Nematodes",
      sub:
        (soil.biology.tardigradeState || "tun") === "active"
          ? `${soil.biology.tardigradeCount ?? 6}/cm³ active`
          : "Dormant tuns",
      color: "#fcd34d",
      horizon: "O",
    },
    {
      id: "biochar",
      x: geom.w * 0.72,
      y: a.y0 + aH * 0.35,
      label: "Biochar & PGPR Reef",
      sub: `${Math.round((soil.biology.biocharCarbonFraction ?? 0.04) * 100)}% matrix`,
      color: "#38bdf8",
      horizon: "A",
    },
    {
      id: "macropore",
      x: geom.w * 0.52,
      y: a.y0 + aH * 0.76,
      label: "Macropores & Glomalin",
      sub: `${soil.biology.earthwormActivityIndex} burrows/m²`,
      color: "#f4a261",
      horizon: "A",
    },
  ];
}

export function hitTestField(geom, soil, x, y) {
  const hotspots = getSubsurfaceHotspots(geom, soil);
  for (const spot of hotspots) {
    const dx = x - spot.x;
    const dy = y - spot.y;
    if (Math.hypot(dx, dy) <= 36) {
      return { type: "hotspot", id: spot.id, horizon: spot.horizon, spot };
    }
  }
  for (const b of geom.bands) {
    if (y >= b.y0 && y <= b.y1) {
      const defaultTab =
        b.type === "O"
          ? "tardigrade"
          : b.type === "A"
          ? "amf"
          : "horizons";
      return { type: "horizon", id: defaultTab, horizon: b.type, unlocked: b.unlocked };
    }
  }
  return { type: "sky", id: "amf", horizon: "A" };
}

export function createDisplay(soil) {
  const water = {};
  for (const t of ORDER) {
    water[t] = clamp(
      soil.horizons[t].currentWaterMm / soil.horizons[t].waterHoldingCapacityMm,
      0,
      1
    );
  }
  const bio = soil.biology || {};
  return {
    water,
    residue: soil.management.residueCoverFraction,
    agg: soil.horizons.A.aggregateStability,
    fb: bio.fungalToBacterialRatio ?? 0.22,
    crust: soil.water.crustThicknessMm,
    mycelium: bio.activeMyceliumLengthM ?? 140,
    arbuscules: clamp((bio.arbusculeDensity ?? 18) / 100, 0.05, 1),
    glomalin: clamp(bio.glomalinIndex ?? 0.2, 0.05, 1),
    exudates: clamp(bio.rootExudateFlux ?? 0.26, 0.04, 1),
    biochar: clamp(bio.biocharCarbonFraction ?? 0.04, 0, 1),
    tardigrades: bio.tardigradeCount ?? 6,
    tardigradeActive: (bio.tardigradeState || "tun") === "active" ? 1 : 0,
    nematodes: bio.nematodeCount ?? 14,
    bacteria: bio.rhizosphereBacteriaMgPerKg ?? 210,
    worms: bio.earthwormActivityIndex ?? 6,
  };
}

export function stepDisplay(disp, soil, dt) {
  const k = 1 - Math.exp(-dt / 190);
  const target = createDisplay(soil);
  for (const t of ORDER) disp.water[t] += (target.water[t] - disp.water[t]) * k;
  disp.residue += (target.residue - disp.residue) * k;
  disp.agg += (target.agg - disp.agg) * k;
  disp.fb += (target.fb - disp.fb) * k;
  disp.crust += (target.crust - disp.crust) * k;
  disp.mycelium += (target.mycelium - disp.mycelium) * k;
  disp.arbuscules += (target.arbuscules - disp.arbuscules) * k;
  disp.glomalin += (target.glomalin - disp.glomalin) * k;
  disp.exudates += (target.exudates - disp.exudates) * k;
  disp.biochar += (target.biochar - disp.biochar) * k;
  disp.tardigrades += (target.tardigrades - disp.tardigrades) * k;
  disp.tardigradeActive += (target.tardigradeActive - disp.tardigradeActive) * k;
  disp.nematodes += (target.nematodes - disp.nematodes) * k;
  disp.bacteria += (target.bacteria - disp.bacteria) * k;
  disp.worms += (target.worms - disp.worms) * k;
}

export function createFx() {
  return {
    particles: [],
    shake: 0,
    sheet: 0,
    bloom: 0,
    bloomColor: "rgba(110,231,183,0.45)",
    mode: null,
    t0: 0,
  };
}

export function spawnPulse(fx, pulse, geom, now) {
  const { verb, mode, result } = pulse;
  const w = geom.w;
  const a = geom.band.A;

  if (verb === "water") {
    const dropCount = mode === "airspade" ? 20 : 48;
    for (let i = 0; i < dropCount; i++) {
      fx.particles.push({
        kind: "drop",
        x: Math.random() * w,
        y: -10 - Math.random() * 140,
        vy: 420 + Math.random() * 320,
        maxY: geom.soilTop + 2,
        color: mode === "humic_soak" ? "rgba(245,196,105,0.8)" : "rgba(156,226,244,0.82)",
        life: 1,
      });
    }
    const sheets = result.runoffMm > result.infiltrationMm;
    fx.mode = sheets ? "sheet" : "sink";
    fx.t0 = now;
    fx.sheet = sheets ? 1 : 0;
    if (!sheets) {
      const deepest = geom.bands.filter((b) => b.unlocked).slice(-1)[0];
      for (let i = 0; i < 24; i++) {
        fx.particles.push({
          kind: "sink",
          x: Math.random() * w,
          y: geom.soilTop + 4,
          vy: 68 + Math.random() * 125,
          maxY: deepest ? deepest.y1 : geom.h,
          color: mode === "humic_soak" ? "252,211,77" : "125,211,252",
          life: 1,
          start: now + 180 + Math.random() * 320,
        });
      }
    }
  }

  if (verb === "feed") {
    fx.bloom = 1;
    fx.bloomColor =
      mode === "biochar"
        ? "rgba(56,189,248,0.5)"
        : mode === "biostimulant"
        ? "rgba(251,191,36,0.55)"
        : mode === "tea"
        ? "rgba(110,231,183,0.55)"
        : "rgba(217,185,120,0.45)";

    for (let i = 0; i < 36; i++) {
      fx.particles.push({
        kind: mode === "biochar" ? "hex" : "mote",
        x: Math.random() * w,
        y: a.y0 + Math.random() * (a.y1 - a.y0),
        vy: -14 - Math.random() * 26,
        r: 2 + Math.random() * 3.5,
        color:
          mode === "biochar"
            ? "56,189,248"
            : mode === "biostimulant"
            ? "251,191,36"
            : "110,231,183",
        life: 1,
        start: now + Math.random() * 280,
      });
    }
  }

  if (verb === "disturb") {
    fx.shake = 1;
    for (let i = 0; i < 32; i++) {
      fx.particles.push({
        kind: "crumb",
        x: Math.random() * w,
        y: geom.soilTop + Math.random() * 28,
        vx: (Math.random() - 0.5) * 95,
        vy: -45 - Math.random() * 95,
        r: 1.6 + Math.random() * 3.4,
        rot: Math.random() * TAU,
        color: mode === "npk" ? "244,114,182" : "158,136,106",
        life: 1,
      });
    }
    for (let i = 0; i < 16; i++) {
      fx.particles.push({
        kind: "shard",
        x: Math.random() * w,
        y: a.y0 + Math.random() * (a.y1 - a.y0),
        vy: 8 + Math.random() * 28,
        len: 6 + Math.random() * 11,
        rot: Math.random() * TAU,
        life: 1,
        start: now,
      });
    }
  }
}

export function stepFx(fx, dt, now) {
  const s = dt / 1000;
  fx.shake = Math.max(0, fx.shake - dt / 340);
  fx.sheet = Math.max(0, fx.sheet - dt / 1500);
  fx.bloom = Math.max(0, fx.bloom - dt / 1600);
  const alive = [];
  for (const p of fx.particles) {
    if (p.start && now < p.start) {
      alive.push(p);
      continue;
    }
    if (p.kind === "drop") {
      p.vy += 1500 * s;
      p.y += p.vy * s;
      if (p.y < 4000) alive.push(p);
    } else if (p.kind === "sink") {
      p.y += p.vy * s;
      p.life -= dt / 950;
      if (p.life > 0 && p.y < p.maxY) alive.push(p);
    } else if (p.kind === "crumb") {
      p.vy += 520 * s;
      p.x += p.vx * s;
      p.y += p.vy * s;
      p.rot += s * 3;
      p.life -= dt / 1100;
      if (p.life > 0) alive.push(p);
    } else if (p.kind === "shard") {
      p.y += p.vy * s;
      p.life -= dt / 900;
      if (p.life > 0) alive.push(p);
    } else if (p.kind === "mote" || p.kind === "hex") {
      p.y += p.vy * s;
      p.life -= dt / 1500;
      if (p.life > 0) alive.push(p);
    }
  }
  fx.particles = alive.slice(-200);
}

/* ------------------------------------------------------------------ paint */

export function renderField(ctx, w, h, soil, disp, fx, now) {
  const geom = computeGeometry(w, h, soil.season.unlockedHorizons);
  ctx.clearRect(0, 0, w, h);
  const sx = fx.shake > 0 ? Math.sin(now * 0.055) * 3.4 * fx.shake : 0;
  const sy = fx.shake > 0 ? Math.cos(now * 0.041) * 1.8 * fx.shake : 0;

  drawSkyAndCanopy(ctx, geom, soil, disp, now);
  ctx.save();
  ctx.translate(sx, sy);

  drawDeepBase(ctx, geom);
  for (const b of geom.bands) {
    if (b.unlocked) drawBand(ctx, geom, soil, b, disp);
  }
  drawWater(ctx, geom, disp, now);
  drawMacroporesAndWorms(ctx, geom, soil, disp, now);
  drawAggregatesAndBacteria(ctx, geom, soil, disp, now);
  drawBiocharReefs(ctx, geom, soil, disp, now);
  drawHyphae(ctx, geom, disp, soil, now);
  drawRootsAndArbuscules(ctx, geom, soil, disp, now);
  drawMicroFauna(ctx, geom, soil, disp, now);
  if (fx.bloom > 0) drawBloom(ctx, geom, fx);
  drawSurface(ctx, geom, soil, disp, now);
  if (fx.sheet > 0) drawSheet(ctx, geom, fx, now);
  drawParticles(ctx, geom, fx, now);
  drawRuler(ctx, geom, soil);
  drawHotspots(ctx, geom, soil, now);
  ctx.restore();
  drawVignette(ctx, w, h);
}

function drawSkyAndCanopy(ctx, geom, soil, disp, now) {
  const g = ctx.createLinearGradient(0, 0, 0, geom.soilTop);
  g.addColorStop(0, "#1c241e");
  g.addColorStop(0.52, "#2f3d2e");
  g.addColorStop(1, "#4a5d43");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, geom.w, geom.soilTop);

  const sun = ctx.createRadialGradient(
    geom.w * 0.74,
    geom.soilTop * 0.28,
    0,
    geom.w * 0.74,
    geom.soilTop * 0.28,
    geom.sky * 1.15
  );
  sun.addColorStop(0, "rgba(253,230,178,0.45)");
  sun.addColorStop(0.5, "rgba(253,224,160,0.16)");
  sun.addColorStop(1, "rgba(253,224,160,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, geom.w, geom.soilTop);

  // Above-ground plant silhouettes tied to root positions (0.31, 0.50, 0.68)
  const vitality = clamp(0.35 + disp.arbuscules * 0.45 + disp.water.A * 0.3, 0.25, 1);
  const anchors = [0.31, 0.5, 0.68];

  anchors.forEach((ax, idx) => {
    const x = geom.w * ax;
    const baseY = geom.soilTop + 1;
    const sway = Math.sin(now / 1500 + idx * 1.7) * 2.2;

    if (idx === 0) {
      // Mother Oak trunk & canopy
      const h = Math.min(geom.sky * 0.52, 86) * (0.75 + vitality * 0.25);
      ctx.strokeStyle = "#3a2819";
      ctx.lineWidth = 4.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(x + sway * 0.3, baseY - h * 0.5, x + sway, baseY - h * 0.72);
      ctx.stroke();

      const puffs = [
        { dx: -16, dy: -h * 0.72, r: 17 },
        { dx: 15, dy: -h * 0.7, r: 16 },
        { dx: 0, dy: -h * 0.88, r: 21 },
      ];
      puffs.forEach((p, pi) => {
        ctx.beginPath();
        ctx.arc(x + sway + p.dx, baseY + p.dy, p.r * (0.8 + vitality * 0.25), 0, TAU);
        ctx.fillStyle =
          pi === 2
            ? `rgba(116,178,104,${0.55 + vitality * 0.35})`
            : `rgba(82,138,76,${0.5 + vitality * 0.35})`;
        ctx.fill();
      });
    } else if (idx === 1) {
      // Mycorrhizal Lupine / Nitrogen fixer guild
      const h = Math.min(geom.sky * 0.34, 52) * (0.7 + vitality * 0.3);
      for (let s = -2; s <= 2; s++) {
        ctx.strokeStyle = `rgba(124,185,112,${0.55 + vitality * 0.35})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(
          x + s * 6 + sway * 0.5,
          baseY - h * 0.55,
          x + s * 10 + sway,
          baseY - h
        );
        ctx.stroke();

        if (vitality > 0.45 && Math.abs(s) <= 1) {
          ctx.fillStyle = `rgba(167,139,250,${0.6 + vitality * 0.35})`;
          ctx.beginPath();
          ctx.arc(x + s * 10 + sway, baseY - h - 2, 2.5, 0, TAU);
          ctx.fill();
        }
      }
    } else {
      // Understory Sapling
      const h = Math.min(geom.sky * 0.38, 60) * (0.65 + vitality * 0.35);
      ctx.strokeStyle = "#4a3321";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(x + sway * 0.4, baseY - h * 0.5, x + sway, baseY - h * 0.78);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + sway, baseY - h * 0.84, 13 * (0.75 + vitality * 0.3), 0, TAU);
      ctx.fillStyle = `rgba(110,190,115,${0.52 + vitality * 0.38})`;
      ctx.fill();
    }
  });
}

function drawDeepBase(ctx, geom) {
  const deepest = geom.bands.filter((b) => b.unlocked).slice(-1)[0];
  const top = deepest ? deepest.y1 : geom.soilTop;
  const g = ctx.createLinearGradient(0, top, 0, geom.h);
  g.addColorStop(0, "#19130c");
  g.addColorStop(0.5, "#110d08");
  g.addColorStop(1, "#090705");
  ctx.fillStyle = g;
  ctx.fillRect(0, top, geom.w, geom.h - top);

  ctx.strokeStyle = "rgba(226,214,190,0.06)";
  ctx.lineWidth = 1;
  const rnd = mulberry32(17);
  let y = top + 18;
  while (y < geom.h) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= geom.w; x += 26) {
      ctx.lineTo(x, y + Math.sin((x + y) * 0.03) * 2.2 + (rnd() - 0.5) * 2);
    }
    ctx.stroke();
    y += 24 + rnd() * 28;
  }
}

function bandPalette(type, disp) {
  if (type === "O") return ["#3c2918", "#23170d", "#8d6b3f"];
  if (type === "A") {
    const grey = clamp((0.45 - disp.agg) / 0.4, 0, 1);
    const rich = clamp(disp.biochar * 0.5 + disp.glomalin * 0.5, 0, 1);
    const topHex = mix(mix("#432b18", "#1e1610", rich * 0.55), "#787163", grey * 0.75);
    const botHex = mix(mix("#2b1b0f", "#140f0a", rich * 0.55), "#615b4f", grey * 0.75);
    return [topHex, botHex, "#7a5c38"];
  }
  if (type === "E") return ["#695c4b", "#54483a", "#9c8d77"];
  if (type === "B") return ["#6b3c25", "#4c2918", "#945737"];
  return ["#544d42", "#3b362e", "#877d6d"];
}

function drawBand(ctx, geom, soil, b, disp) {
  const [top, bottom, fleck] = bandPalette(b.type, disp);
  const g = ctx.createLinearGradient(0, b.y0, 0, b.y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, b.y0, geom.w, b.y1 - b.y0);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, b.y0, geom.w, b.y1 - b.y0);
  ctx.clip();

  const rnd = mulberry32(ORDER.indexOf(b.type) * 977 + 13);
  const area = geom.w * (b.y1 - b.y0);

  if (b.type === "O") {
    for (let i = 0; i < area / 210; i++) {
      const x = rnd() * geom.w;
      const y = b.y0 + rnd() * (b.y1 - b.y0);
      const a = (rnd() - 0.5) * 0.85;
      const len = 6 + rnd() * 14;
      ctx.strokeStyle =
        rnd() > 0.35 ? "rgba(176,138,78,0.55)" : "rgba(114,168,98,0.45)";
      ctx.lineWidth = 1.1 + rnd() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
  } else if (b.type === "A") {
    const crumbs = area / 560;
    for (let i = 0; i < crumbs; i++) {
      const x = rnd() * geom.w;
      const y = b.y0 + rnd() * (b.y1 - b.y0);
      const r = (1.3 + rnd() * 3.8) * (0.55 + disp.agg * 0.9);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = `rgba(${hexToRgb(fleck).join(",")},${0.12 + rnd() * 0.14})`;
      ctx.fill();
    }
  } else if (b.type === "E") {
    for (let i = 0; i < area / 850; i++) {
      const x = rnd() * geom.w;
      ctx.strokeStyle = `rgba(214,202,178,${0.08 + rnd() * 0.12})`;
      ctx.lineWidth = 0.8 + rnd() * 2;
      ctx.beginPath();
      ctx.moveTo(x, b.y0);
      ctx.lineTo(x + (rnd() - 0.5) * 14, b.y1);
      ctx.stroke();
    }
  } else if (b.type === "B") {
    for (let i = 0; i < area / 1300; i++) {
      const x = rnd() * geom.w;
      const y = b.y0 + rnd() * (b.y1 - b.y0);
      const rx = 6 + rnd() * 20;
      const ry = 4 + rnd() * 11;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rnd() * TAU, 0, TAU);
      ctx.fillStyle = `rgba(176,108,68,${0.08 + rnd() * 0.1})`;
      ctx.fill();
    }
  } else {
    for (let i = 0; i < area / 2200; i++) {
      const x = rnd() * geom.w;
      const y = b.y0 + rnd() * (b.y1 - b.y0);
      const r = 4 + rnd() * 10;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.65, rnd() * TAU, 0, TAU);
      ctx.fillStyle = `rgba(182,172,154,${0.12 + rnd() * 0.14})`;
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(18,12,8,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, b.y0 + 0.5);
  ctx.lineTo(geom.w, b.y0 + 0.5);
  ctx.stroke();

  ctx.font = "600 9px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,248,232,0.42)";
  ctx.fillText(b.type, geom.w - 15, b.y0 + 13);
}

function drawWater(ctx, geom, disp, now) {
  for (const b of geom.bands) {
    if (!b.unlocked) continue;
    const level = disp.water[b.type];
    if (level < 0.02) continue;
    const top = b.y1 - (b.y1 - b.y0) * level;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, b.y0, geom.w, b.y1 - b.y0);
    ctx.clip();
    const g = ctx.createLinearGradient(0, top, 0, b.y1);
    g.addColorStop(0, "rgba(38,118,148,0.18)");
    g.addColorStop(1, "rgba(22,78,104,0.44)");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, geom.w, b.y1 - top);

    ctx.strokeStyle = "rgba(125,211,252,0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= geom.w; x += 6) {
      const y = top + Math.sin(x * 0.045 + b.y0 + now * 0.002) * 1.5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawMacroporesAndWorms(ctx, geom, soil, disp, now) {
  const a = geom.band.A;
  if (!a || !a.unlocked) return;
  const deepest = geom.bands.filter((b) => b.unlocked).slice(-1)[0];
  const maxB = deepest ? deepest.y1 : a.y1;
  const burrowCount = clamp(Math.round(disp.worms / 7), 1, 9);
  const rnd = mulberry32(909);

  for (let i = 0; i < burrowCount; i++) {
    const startX = geom.w * (0.12 + ((i + 0.4) / burrowCount) * 0.76) + (rnd() - 0.5) * 18;
    const endY = Math.min(maxB - 10, a.y0 + (a.y1 - a.y0) * (0.65 + rnd() * 0.85));
    const ctrlX = startX + (rnd() - 0.5) * 36;
    const endX = startX + (rnd() - 0.5) * 28;

    // Burrow channel with dark vermicast lining
    ctx.strokeStyle = "rgba(14,10,7,0.68)";
    ctx.lineWidth = 4.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, geom.soilTop + 3);
    ctx.quadraticCurveTo(ctrlX, (geom.soilTop + endY) * 0.5, endX, endY);
    ctx.stroke();

    // Hydrated pore meniscus sheen inside burrow
    ctx.strokeStyle = `rgba(125,211,252,${0.15 + disp.water.A * 0.35})`;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Animated earthworm gliding along burrow
    const t = (Math.sin(now * 0.0011 + i * 2.1) + 1) * 0.35 + 0.15;
    const wx =
      (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
    const wy =
      (1 - t) * (1 - t) * (geom.soilTop + 3) +
      2 * (1 - t) * t * ((geom.soilTop + endY) * 0.5) +
      t * t * endY;

    ctx.strokeStyle = "rgba(217,119,87,0.85)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(wx - 4, wy - 5);
    ctx.quadraticCurveTo(wx + Math.sin(now * 0.006 + i) * 3, wy, wx + 3, wy + 6);
    ctx.stroke();
  }
}

function drawAggregatesAndBacteria(ctx, geom, soil, disp, now) {
  const b = geom.band.A;
  if (!b || !b.unlocked) return;
  const rnd = mulberry32(404);
  const n = 28;

  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (geom.w / n) + (rnd() - 0.5) * 14;
    const y = b.y0 + 14 + rnd() * (b.y1 - b.y0 - 24);
    const r = 2.4 + disp.agg * 4.5 + rnd() * 1.6;

    // Glomalin glycoprotein glue aura around water-stable crumbs
    if (disp.glomalin > 0.18) {
      ctx.beginPath();
      ctx.arc(x, y, r + 2.2 * disp.glomalin, 0, TAU);
      ctx.fillStyle = `rgba(110,231,183,${0.05 + disp.glomalin * 0.16})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = `rgba(92,66,42,${0.35 + disp.agg * 0.35})`;
    ctx.fill();
  }

  // Shimmering rhizosphere PGPR bacterial colonies
  const bactCount = clamp(Math.round(disp.bacteria / 18), 12, 72);
  const bRnd = mulberry32(512);
  for (let i = 0; i < bactCount; i++) {
    const bx = bRnd() * geom.w;
    const by = b.y0 + 8 + bRnd() * (b.y1 - b.y0 - 16);
    const pulse = 0.45 + 0.55 * Math.sin(now * 0.004 + i * 1.3);
    ctx.fillStyle = `rgba(110,231,183,${(0.2 + disp.glomalin * 0.45) * pulse})`;
    ctx.beginPath();
    ctx.arc(bx, by, 1.1 + (i % 3) * 0.4, 0, TAU);
    ctx.fill();
  }
}

function drawBiocharReefs(ctx, geom, soil, disp, now) {
  const a = geom.band.A;
  if (!a || !a.unlocked || disp.biochar < 0.02) return;
  const clusterCount = clamp(Math.round(4 + disp.biochar * 18), 3, 22);
  const rnd = mulberry32(808);

  for (let i = 0; i < clusterCount; i++) {
    const cx = geom.w * (0.08 + rnd() * 0.84);
    const cy = a.y0 + 16 + rnd() * (a.y1 - a.y0 - 30);
    const radius = 5.5 + (rnd() * 4.5 + disp.biochar * 4);

    // Draw hexagonal pyrogenic carbon lattice
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rnd() - 0.5) * 0.6);

    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const ang = (s * TAU) / 6;
      const px = Math.cos(ang) * radius;
      const py = Math.sin(ang) * radius;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(15,18,22,0.82)";
    ctx.fill();
    ctx.strokeStyle = `rgba(56,189,248,${0.32 + disp.biochar * 0.48})`;
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Internal honeycomb micropores holding water & microbes
    const glow = 0.5 + 0.5 * Math.sin(now * 0.003 + i);
    for (let p = -1; p <= 1; p++) {
      ctx.beginPath();
      ctx.arc(p * radius * 0.36, (p % 2) * 1.8, 1.3, 0, TAU);
      ctx.fillStyle =
        p === 0
          ? `rgba(110,231,183,${0.55 + glow * 0.35})`
          : `rgba(56,189,248,${0.45 + disp.water.A * 0.45})`;
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawRootsAndArbuscules(ctx, geom, soil, disp, now) {
  const plants = soil.plants.filter((p) => p.isAlive);
  const anchors = [0.31, 0.5, 0.68];

  plants.slice(0, 3).forEach((plant, idx) => {
    const x = geom.w * anchors[idx % anchors.length];
    const bottom = depthToY(geom, soil, plant.rootDepthMm);
    const seed = 31 + idx * 17;
    const thickness = clamp(1.3 + Math.log10(plant.biomassKg + 1) * 1.65, 1.5, 4.8);
    const sway = Math.sin(now / 1600 + idx) * 1.2;

    const arbusculeNodes = [];
    ctx.lineCap = "round";
    branchRoot(
      ctx,
      x + sway * 0.35,
      geom.soilTop - 1,
      Math.PI / 2,
      Math.min(48, (bottom - geom.soilTop) * 0.44),
      thickness,
      5,
      seed,
      bottom,
      disp,
      arbusculeNodes
    );

    // Render glowing AMF Arbuscules inside root cortical cells
    arbusculeNodes.slice(0, 18).forEach((node, ni) => {
      const pulse = 0.6 + 0.4 * Math.sin(now * 0.004 + ni * 0.9);
      const r = (2.2 + disp.arbuscules * 3.8) * pulse;

      // Outer phosphorus-carbon exchange aura
      const aura = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.8);
      aura.addColorStop(0, `rgba(251,191,36,${0.25 + disp.exudates * 0.45})`);
      aura.addColorStop(0.55, `rgba(110,231,183,${0.18 + disp.arbuscules * 0.38})`);
      aura.addColorStop(1, "rgba(110,231,183,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 2.8, 0, TAU);
      ctx.fill();

      // Intracellular tree-like arbuscule core
      ctx.fillStyle = `rgba(167,243,208,${0.45 + disp.arbuscules * 0.5})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.65, 0, TAU);
      ctx.fill();
    });
  });
}

function branchRoot(ctx, x, y, ang, len, width, depth, seed, maxY, disp, arbusculeNodes) {
  if (depth <= 0 || len < 3 || y > maxY) return;
  const rnd = mulberry32(seed + depth * 101);
  const nx = x + Math.cos(ang) * len;
  const ny = y + Math.sin(ang) * len;

  // Golden liquid-carbon root exudate halo around root segments
  if (disp.exudates > 0.12 && depth <= 4) {
    ctx.strokeStyle = `rgba(251,191,36,${0.06 + disp.exudates * 0.18})`;
    ctx.lineWidth = Math.max(2.5, width * 3.2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(ang + 0.32) * len * 0.6,
      y + Math.sin(ang + 0.32) * len * 0.6,
      nx,
      ny
    );
    ctx.stroke();
  }

  // Primary root tissue
  ctx.strokeStyle = `rgba(238,220,188,${0.32 + depth * 0.12})`;
  ctx.lineWidth = Math.max(0.65, width);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(
    x + Math.cos(ang + 0.32) * len * 0.6,
    y + Math.sin(ang + 0.32) * len * 0.6,
    nx,
    ny
  );
  ctx.stroke();

  if (depth <= 3) {
    arbusculeNodes.push({ x: (x + nx) * 0.5, y: (y + ny) * 0.5 });
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = `rgba(248,236,208,${0.3 + disp.exudates * 0.35})`;
    for (let h = 0; h < 2; h++) {
      const t = 0.35 + rnd() * 0.55;
      const hx = x + (nx - x) * t;
      const hy = y + (ny - y) * t;
      const ha = ang + (rnd() - 0.5) * 1.9;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + Math.cos(ha) * 7, hy + Math.sin(ha) * 7);
      ctx.stroke();
    }
  }

  const spread = 0.48 + rnd() * 0.35;
  branchRoot(
    ctx,
    nx,
    ny,
    ang - spread,
    len * (0.62 + rnd() * 0.18),
    width * 0.64,
    depth - 1,
    seed + 3,
    maxY,
    disp,
    arbusculeNodes
  );
  branchRoot(
    ctx,
    nx,
    ny,
    ang + spread,
    len * (0.6 + rnd() * 0.2),
    width * 0.62,
    depth - 1,
    seed + 7,
    maxY,
    disp,
    arbusculeNodes
  );
}

function drawHyphae(ctx, geom, disp, soil, now) {
  const a = geom.band.A;
  if (!a || !a.unlocked) return;
  const count = clamp(Math.round(disp.mycelium / 24), 6, 44);
  const alpha = clamp(disp.fb / 1.1, 0.18, 0.92);
  const snapped = disp.fb < 0.28;
  const deepest = geom.bands.filter((b) => b.unlocked).slice(-1)[0];
  const bottom = Math.min(deepest ? deepest.y1 : a.y1, a.y1 + (a.y1 - a.y0) * 0.9);

  // 1. Common Mycorrhizal Network (CMN) bridges connecting the 3 plant root systems
  const rootAnchors = [geom.w * 0.31, geom.w * 0.5, geom.w * 0.68];
  const bridgeY = a.y0 + (a.y1 - a.y0) * 0.45;
  if (!snapped) {
    for (let b = 0; b < 2; b++) {
      const x0 = rootAnchors[b];
      const x1 = rootAnchors[b + 1];
      const cy = bridgeY + (b === 0 ? 14 : -10);

      ctx.strokeStyle = `rgba(167,243,208,${0.28 + disp.arbuscules * 0.45})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x0, bridgeY);
      ctx.quadraticCurveTo((x0 + x1) * 0.5, cy, x1, bridgeY);
      ctx.stroke();

      // Animated bidirectional nutrient packets (Gold = Liquid Carbon, Cyan = Phosphorus/Water)
      for (let p = 0; p < 3; p++) {
        const t = ((now * 0.00045 + p * 0.33 + b * 0.2) % 1);
        const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) * 0.5) + t * t * x1;
        const py = (1 - t) * (1 - t) * bridgeY + 2 * (1 - t) * t * cy + t * t * bridgeY;
        ctx.fillStyle = p % 2 === 0 ? "rgba(251,191,36,0.9)" : "rgba(56,189,248,0.9)";
        ctx.beginPath();
        ctx.arc(px, py, 1.9, 0, TAU);
        ctx.fill();
      }
    }
  }

  // 2. Extraradical foraging hyphae radiating across the soil profile
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const rnd = mulberry32(700 + i * 37);
    const x = rnd() * geom.w;
    const y = a.y0 + rnd() * (a.y1 - a.y0) * 0.85;
    const len = 26 + rnd() * 68;
    const drift = (rnd() - 0.5) * 44;
    const wobble = Math.sin(now / 2200 + i) * 1.8;

    ctx.strokeStyle =
      i % 3 === 0
        ? `rgba(167,243,208,${alpha * (0.45 + rnd() * 0.45)})`
        : `rgba(233,245,198,${alpha * (0.45 + rnd() * 0.45)})`;
    ctx.lineWidth = 0.75 + rnd() * 0.75;
    if (snapped) ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + drift * 0.4,
      y + len * 0.35,
      x - drift * 0.3 + wobble,
      y + len * 0.7,
      x + drift,
      Math.min(bottom, y + len)
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawMicroFauna(ctx, geom, soil, disp, now) {
  const o = geom.band.O;
  const a = geom.band.A;
  if (!a || !a.unlocked) return;

  // 1. Beneficial Nematodes (undulating silver-cyan roundworms in rhizosphere water films)
  const nemCount = clamp(Math.round(disp.nematodes / 5), 2, 14);
  const nRnd = mulberry32(303);
  for (let i = 0; i < nemCount; i++) {
    const cx = geom.w * (0.08 + nRnd() * 0.84) + Math.sin(now * 0.0008 + i) * 8;
    const cy = a.y0 + 12 + nRnd() * (a.y1 - a.y0 - 20);
    const ang = (nRnd() - 0.5) * 1.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.strokeStyle = "rgba(186,230,253,0.78)";
    ctx.lineWidth = 1.35;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let s = 0; s <= 10; s++) {
      const sx = (s - 5) * 1.5;
      const sy = Math.sin(now * 0.008 + i * 1.7 + s * 0.7) * 1.8;
      if (s === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 2. Soil Tardigrades (Water Bears) in O and upper A horizon water menisci
  const tardCount = clamp(Math.round(disp.tardigrades / 4), 2, 10);
  const tRnd = mulberry32(606);
  const isActive = disp.tardigradeActive >= 0.5;

  for (let i = 0; i < tardCount; i++) {
    const tx =
      geom.w * (0.1 + tRnd() * 0.8) +
      (isActive ? Math.sin(now * 0.0006 + i * 2.3) * 6 : 0);
    const ty = o.y0 + (o.y1 - o.y0) * 0.45 + tRnd() * ((a.y1 - a.y0) * 0.35);

    ctx.save();
    ctx.translate(tx, ty);

    if (isActive) {
      // Hydrated, plump segmented water bear with tiny legs
      ctx.fillStyle = "rgba(252,211,77,0.88)";
      for (let seg = -1.5; seg <= 1.5; seg += 1) {
        ctx.beginPath();
        ctx.ellipse(seg * 2.1, Math.sin(now * 0.005 + seg) * 0.4, 2.1, 1.6, 0, 0, TAU);
        ctx.fill();
      }
      // Tiny stubby legs
      ctx.strokeStyle = "rgba(254,240,138,0.85)";
      ctx.lineWidth = 0.9;
      for (let leg = -1.5; leg <= 1.5; leg += 1) {
        const step = Math.sin(now * 0.007 + leg * 1.5 + i) * 0.8;
        ctx.beginPath();
        ctx.moveTo(leg * 2.1, 1.2);
        ctx.lineTo(leg * 2.1 + step, 2.8);
        ctx.stroke();
      }
    } else {
      // Dormant cryptobiotic Tun state (compact barrel with protective shell ring)
      ctx.fillStyle = "rgba(217,160,91,0.68)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.6, 1.9, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(253,230,138,0.4)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHotspots(ctx, geom, soil, now) {
  const spots = getSubsurfaceHotspots(geom, soil);
  spots.forEach((spot, idx) => {
    const pulse = (Math.sin(now * 0.0035 + idx * 1.4) + 1) * 0.5;
    const outerR = 11 + pulse * 4;

    ctx.save();
    // Pulsing target ring
    ctx.strokeStyle = spot.color;
    ctx.globalAlpha = 0.38 + pulse * 0.32;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, outerR, 0, TAU);
    ctx.stroke();

    // Center dot
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = spot.color;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 3.2, 0, TAU);
    ctx.fill();

    // Compact darkfield label pill
    ctx.font = "600 9.5px ui-sans-serif, system-ui, sans-serif";
    const textW = ctx.measureText(spot.label).width;
    const pillW = textW + 14;
    const pillH = 18;
    const px = clamp(spot.x - pillW * 0.5, 8, geom.w - pillW - 8);
    const py = spot.y - outerR - 20;

    ctx.fillStyle = "rgba(11,8,6,0.78)";
    ctx.strokeStyle = "rgba(244,228,195,0.24)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.roundRect(px, py, pillW, pillH, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f8f0e0";
    ctx.fillText(spot.label, px + 7, py + 12.2);
    ctx.restore();
  });
}

function drawBloom(ctx, geom, fx) {
  const a = geom.band.A;
  const r = (1 - fx.bloom) * geom.w * 0.58 + 12;
  ctx.strokeStyle = fx.bloomColor || `rgba(110,231,183,${fx.bloom * 0.45})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(geom.w * 0.5, a.y0 + (a.y1 - a.y0) * 0.42, r, 0, TAU);
  ctx.stroke();
}

function drawSurface(ctx, geom, soil, disp) {
  const y = geom.soilTop;

  const straws = Math.round(disp.residue * 135);
  const rnd = mulberry32(555);
  for (let i = 0; i < straws; i++) {
    const x = rnd() * geom.w;
    const len = 7 + rnd() * 18;
    const a = (rnd() - 0.5) * 0.52;
    ctx.strokeStyle = [
      "rgba(209,176,112,0.88)",
      "rgba(168,137,79,0.82)",
      "rgba(112,164,96,0.75)",
    ][Math.floor(rnd() * 3)];
    ctx.lineWidth = 1 + rnd() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * len * 0.5, y - 2 - rnd() * 4);
    ctx.lineTo(
      x + Math.cos(a) * len * 0.5,
      y - 2 - rnd() * 4 + Math.sin(a) * len * 0.4
    );
    ctx.stroke();
  }

  const crust = clamp(disp.crust / 5, 0, 1);
  ctx.fillStyle = `rgba(163,155,136,${0.18 + crust * 0.52})`;
  ctx.fillRect(0, y - 1, geom.w, 1.5 + crust * 5);

  ctx.strokeStyle = "rgba(24,17,10,0.6)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(geom.w, y + 0.5);
  ctx.stroke();
}

function drawSheet(ctx, geom, fx, now) {
  const y = geom.soilTop;
  const k = fx.sheet;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y - 26, geom.w, 34);
  ctx.clip();
  for (let i = 0; i < 16; i++) {
    const x = ((now * 0.55 + i * 61) % (geom.w + 80)) - 40;
    const yy = y - 2 - (i % 4) * 2.6;
    ctx.fillStyle = `rgba(186,220,226,${0.32 * k})`;
    ctx.beginPath();
    ctx.ellipse(x, yy, 16 + (i % 5) * 4, 2.1, -0.06, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(ctx, geom, fx, now) {
  for (const p of fx.particles) {
    if (p.start && now < p.start) continue;
    if (p.kind === "drop") {
      if (p.y < -20 || p.y > geom.soilTop + 2) continue;
      ctx.strokeStyle = p.color || "rgba(196,224,232,0.78)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + 9);
      ctx.stroke();
    } else if (p.kind === "sink") {
      const c = p.color || "168,220,228";
      ctx.fillStyle = `rgba(${c},${0.7 * p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(${c},${0.32 * p.life})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 14);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (p.kind === "crumb") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(${p.color || "150,126,94"},${0.78 * p.life})`;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.restore();
    } else if (p.kind === "shard") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.strokeStyle = `rgba(214,229,178,${0.62 * p.life})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p.len, p.len * 0.4);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "mote" || p.kind === "hex") {
      const c = p.color || "110,231,183";
      ctx.fillStyle = `rgba(${c},${0.72 * p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r || 1.6, 0, TAU);
      ctx.fill();
    }
  }
}

function drawRuler(ctx, geom, soil) {
  let acc = 0;
  ctx.font = "500 8px ui-monospace, SFMono-Regular, Menlo, monospace";
  for (const b of geom.bands) {
    if (!b.unlocked) break;
    const label = acc + soil.horizons[b.type].depthMm;
    ctx.strokeStyle = "rgba(255,248,232,0.24)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, b.y1 - 0.5);
    ctx.lineTo(9, b.y1 - 0.5);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,248,232,0.36)";
    ctx.fillText(
      label >= 1000 ? `${(label / 1000).toFixed(1)} m` : `${label} mm`,
      12,
      b.y1 - 4
    );
    acc = label;
  }
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w * 0.5,
    h * 0.42,
    Math.min(w, h) * 0.28,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.78
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(14,10,6,0.42)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
