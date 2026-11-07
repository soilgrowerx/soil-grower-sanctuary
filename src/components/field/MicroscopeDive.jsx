import { useEffect, useRef, useState } from "react";
import { Microscope, Sparkles, X } from "lucide-react";

const TABS = [
  { id: "amf", label: "AMF Arbuscules", mag: "400x Root Cortex" },
  { id: "tardigrade", label: "Tardigrades & Nematodes", mag: "200x Pore Film" },
  { id: "biochar", label: "Biochar Reef", mag: "500x Carbon Matrix" },
  { id: "macropore", label: "Glomalin Sponge", mag: "100x Crumb & Burrow" },
  { id: "horizons", label: "Horizon Ledger", mag: "Mass Balance" },
];

const TAU = Math.PI * 2;

export function MicroscopeDive({
  soil,
  initialTab = "amf",
  initialHorizon = "A",
  onClose,
  onQuickAct,
  canAct,
}) {
  const [tab, setTab] = useState(initialTab || "amf");
  const [selectedHorizon, setSelectedHorizon] = useState(initialHorizon || "A");
  const canvasRef = useRef(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
    if (initialHorizon) setSelectedHorizon(initialHorizon);
  }, [initialTab, initialHorizon]);

  useEffect(() => {
    if (tab === "horizons") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame = 0;

    const render = (now) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawMicroscopeScene(ctx, w, h, tab, soil, now);
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [tab, soil]);

  const bio = soil.biology || {};
  const arbuscules = Math.round(bio.arbusculeDensity ?? 18);
  const exudates = Math.round((bio.rootExudateFlux ?? 0.26) * 100);
  const glomalin = Math.round((bio.glomalinIndex ?? 0.2) * 100);
  const biochar = Math.round((bio.biocharCarbonFraction ?? 0.04) * 100);
  const tardState = bio.tardigradeState || "tun";
  const hData = soil.horizons[selectedHorizon] || soil.horizons.A;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-[#f4e4c3]/20 bg-[#120d09] text-[#f8f0e0] shadow-2xl sm:rounded-[28px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f4e4c3]/12 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <Microscope size={17} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.24em] text-emerald-300/80">
                Subsurface Rhizosphere Dive
              </p>
              <h2 className="font-display text-[15px] text-[#f8f0e0]">
                {TABS.find((t) => t.id === tab)?.label} :{" "}
                <span className="text-[#f2e7d2]/60">{TABS.find((t) => t.id === tab)?.mag}</span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#f4e4c3]/15 bg-[#1c140e] p-1.5 text-[#f2e7d2]/75 hover:text-white"
            aria-label="Close microscope"
          >
            <X size={16} />
          </button>
        </div>

        {/* Microscope Specimen Tabs */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-[#f4e4c3]/10 px-3 py-2 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition ${
                tab === t.id
                  ? "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40"
                  : "bg-[#1b140e] text-[#f2e7d2]/65 hover:text-[#f8f0e0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-4 py-3.5 space-y-3.5">
          {tab !== "horizons" ? (
            <div className="relative h-[200px] w-full overflow-hidden rounded-2xl border border-[#f4e4c3]/15 bg-[#080604]">
              <canvas ref={canvasRef} className="h-full w-full" />
              <div className="pointer-events-none absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9.5px] font-mono uppercase tracking-wider text-[#f8f0e0]/75">
                <span className="rounded bg-black/65 px-2 py-0.5 ring-1 ring-white/10">
                  {TABS.find((t) => t.id === tab)?.mag}
                </span>
                <span className="rounded bg-black/65 px-2 py-0.5 text-emerald-300 ring-1 ring-emerald-400/25">
                  Live State Simulation
                </span>
              </div>
            </div>
          ) : null}

          {/* Tab-Specific Scientific Explanation & Gamified Cause-and-Effect */}
          {tab === "amf" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-amber-200/75">
                    Root Sugar Exudates
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-amber-300">
                    {exudates}%
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-emerald-200/75">
                    AMF Arbuscules
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-emerald-300">
                    {arbuscules}%
                  </span>
                </div>
                <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-sky-200/75">
                    Mycelium Network
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-sky-300">
                    {bio.activeMyceliumLengthM} m
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f4e4c3]/12 bg-[#1a130d] p-3 text-[12px] leading-relaxed text-[#f2e7d2]/90">
                <p className="font-medium text-emerald-300">
                  The Biological Market Inside Root Cells
                </p>
                <p className="mt-1">
                  Plants pump up to 30% of their photosynthesized carbon out of their roots as{" "}
                  <strong className="text-amber-300">liquid-carbon sugars (gold)</strong>. In exchange,{" "}
                  <strong className="text-emerald-300">
                    Arbuscular Mycorrhizal Fungi (Rhizophagus irregularis)
                  </strong>{" "}
                  penetrate root cortical cells to form branching{" "}
                  <strong className="text-emerald-300">arbuscules</strong> that deliver mined{" "}
                  <strong className="text-sky-300">phosphorus, zinc, and bound pore water (cyan)</strong>.
                </p>
                <p className="mt-2 text-[11px] text-[#f2e7d2]/70">
                  <strong className="text-amber-200">How to boost:</strong> Apply{" "}
                  <strong>Kelp & Humic Biostimulant</strong> (auxins trigger root-hair and sugar surges) or{" "}
                  <strong>Aerated Compost Tea</strong>. Avoid <strong>Synthetic N-P-K salts</strong>, which
                  cause roots to shut off carbon exudates and starve their fungal partners.
                </p>
              </div>

              {canAct && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickAct("feed", "biostimulant");
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-2.5 text-[12px] font-medium text-emerald-200 ring-1 ring-emerald-400/40 transition active:scale-[0.98]"
                >
                  <Sparkles size={14} />
                  Apply Kelp & Humic Biostimulant (Bloom Arbuscules)
                </button>
              )}
            </div>
          )}

          {tab === "tardigrade" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-amber-200/75">
                    Tardigrades
                  </span>
                  <span className="font-mono text-[15px] font-semibold text-amber-300">
                    {bio.tardigradeCount ?? 6}/cm³ ({tardState === "active" ? "Active" : "Tun"})
                  </span>
                </div>
                <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-sky-200/75">
                    Nematodes
                  </span>
                  <span className="font-mono text-[15px] font-semibold text-sky-300">
                    {bio.nematodeCount ?? 14}/cm³
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-emerald-200/75">
                    PGPR Bacteria
                  </span>
                  <span className="font-mono text-[15px] font-semibold text-emerald-300">
                    {bio.rhizosphereBacteriaMgPerKg ?? 210} mg/kg
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f4e4c3]/12 bg-[#1a130d] p-3 text-[12px] leading-relaxed text-[#f2e7d2]/90">
                <p className="font-medium text-amber-300">
                  Water Bears, Nematodes, and the Rhizosphere Nitrogen Loop
                </p>
                <p className="mt-1">
                  <strong className="text-amber-300">Tardigrades (Water Bears)</strong> and{" "}
                  <strong className="text-sky-300">Beneficial Nematodes</strong> live inside microscopic
                  water films lining soil crumbs. When soil crusts over or gets shocked by synthetic salt
                  fertilizers, tardigrades curl into dormant{" "}
                  <strong className="text-amber-200">cryptobiotic tuns</strong>. When hydrated with humic
                  water and compost tea, they wake up while nematodes graze rhizosphere bacteria, excreting
                  plant-available ammonium right at root tips.
                </p>
              </div>

              {canAct && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onQuickAct("water", "humic_soak");
                      onClose();
                    }}
                    className="rounded-xl bg-amber-500/20 py-2.5 text-[11.5px] font-medium text-amber-200 ring-1 ring-amber-400/40"
                  >
                    Run Humic Soak (Wake Tuns)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onQuickAct("feed", "tea");
                      onClose();
                    }}
                    className="rounded-xl bg-sky-500/20 py-2.5 text-[11.5px] font-medium text-sky-200 ring-1 ring-sky-400/40"
                  >
                    Drench Aerated Compost Tea
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "biochar" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-sky-200/75">
                    Biochar Matrix
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-sky-300">
                    {biochar}%
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-emerald-200/75">
                    A-Horizon Water Cap
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-emerald-300">
                    {soil.horizons.A.waterHoldingCapacityMm} mm
                  </span>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-amber-200/75">
                    Topsoil Carbon
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-amber-300">
                    {soil.carbon.poolByHorizonKg.A.toFixed(1)} kg
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f4e4c3]/12 bg-[#1a130d] p-3 text-[12px] leading-relaxed text-[#f2e7d2]/90">
                <p className="font-medium text-sky-300">
                  Pre-Charged Biochar: The Coral Reef of the Soil Subsurface
                </p>
                <p className="mt-1">
                  Raw charcoal can temporarily tie up nutrients, but{" "}
                  <strong className="text-sky-300">Pre-Charged Biochar</strong> is soaked in aerated
                  compost and humic minerals before entering the soil. Its hexagonal carbon walls carry
                  high cation exchange capacity (CEC) that holds{" "}
                  <strong className="text-amber-300">Ca²⁺, Mg²⁺, K⁺, and NH₄⁺</strong> while its internal
                  micropores act as permanent apartments sheltering AMF hyphae, PGPR bacteria, and
                  tardigrades from compaction and drought.
                </p>
              </div>

              {canAct && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickAct("feed", "biochar");
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500/20 py-2.5 text-[12px] font-medium text-sky-200 ring-1 ring-sky-400/40"
                >
                  <Sparkles size={14} />
                  Apply Pre-Charged Biochar into Topsoil
                </button>
              )}
            </div>
          )}

          {tab === "macropore" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-emerald-200/75">
                    Glomalin Glue
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-emerald-300">
                    {glomalin}%
                  </span>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-amber-200/75">
                    Worm Burrows
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-amber-300">
                    {bio.earthwormActivityIndex}/m²
                  </span>
                </div>
                <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-sky-200/75">
                    Infiltration Rate
                  </span>
                  <span className="font-mono text-[16px] font-semibold text-sky-300">
                    {soil.water.infiltrationRateMmPerHr} mm/hr
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f4e4c3]/12 bg-[#1a130d] p-3 text-[12px] leading-relaxed text-[#f2e7d2]/90">
                <p className="font-medium text-emerald-300">
                  Glomalin Super-Glue and Earthworm Macropore Channels
                </p>
                <p className="mt-1">
                  Why does healthy soil drink a 2-inch cloudburst while degraded dirt floods and washes
                  away? AMF hyphae coat mineral grains in{" "}
                  <strong className="text-emerald-300">glomalin glycoprotein</strong>, binding silt and
                  clay into water-stable macro-aggregates that do not collapse when wet. Meanwhile,{" "}
                  <strong className="text-amber-300">earthworms</strong> pull surface mulch down into deep
                  vertical burrows that pipe storm water straight into the B-horizon moisture bank.
                </p>
              </div>

              {canAct && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickAct("feed", "mulch");
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/20 py-2.5 text-[12px] font-medium text-amber-200 ring-1 ring-amber-400/40"
                >
                  Lay Living Compost & Woodchip Mulch
                </button>
              )}
            </div>
          )}

          {tab === "horizons" && (
            <div className="space-y-3">
              {/* Horizon Selector Pills */}
              <div className="flex gap-1.5">
                {["O", "A", "E", "B", "C"].map((hKey) => {
                  const unlocked = soil.season.unlockedHorizons.includes(hKey);
                  return (
                    <button
                      key={hKey}
                      type="button"
                      onClick={() => setSelectedHorizon(hKey)}
                      className={`flex-1 rounded-xl border py-1.5 text-center font-mono text-[12px] transition ${
                        selectedHorizon === hKey
                          ? "border-amber-300/60 bg-amber-400/20 text-amber-200"
                          : unlocked
                          ? "border-[#f4e4c3]/15 bg-[#1a130d] text-[#f8f0e0]"
                          : "border-[#f4e4c3]/5 bg-[#140f0a] text-[#f2e7d2]/35"
                      }`}
                    >
                      {hKey} {unlocked ? "" : "(Locked)"}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-[#f4e4c3]/15 bg-[#1a130d] p-3">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-[15px] text-amber-200">
                    Horizon {hData.type} : {hData.name}
                  </p>
                  <span className="font-mono text-[11px] text-[#f2e7d2]/65">
                    Depth {hData.depthMm} mm
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11.5px]">
                  <div className="rounded-lg bg-black/35 p-2">
                    <span className="block text-[9.5px] uppercase text-[#f2e7d2]/55">
                      Water Held / Cap
                    </span>
                    <span className="font-mono text-sky-300">
                      {hData.currentWaterMm.toFixed(1)} / {hData.waterHoldingCapacityMm.toFixed(1)} mm
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/35 p-2">
                    <span className="block text-[9.5px] uppercase text-[#f2e7d2]/55">
                      Carbon Pool
                    </span>
                    <span className="font-mono text-amber-300">
                      {soil.carbon.poolByHorizonKg[hData.type].toFixed(2)} kg C
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/35 p-2">
                    <span className="block text-[9.5px] uppercase text-[#f2e7d2]/55">
                      Aggregate Stability
                    </span>
                    <span className="font-mono text-emerald-300">
                      {(hData.aggregateStability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/35 p-2">
                    <span className="block text-[9.5px] uppercase text-[#f2e7d2]/55">
                      Bulk Density & Ksat
                    </span>
                    <span className="font-mono text-[#f8f0e0]">
                      {hData.bulkDensityGcm3.toFixed(2)} g/cm³ · {hData.saturatedConductivityMmPerHr} mm/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Exact Reconciled Mass Balance Equations */}
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-3 font-mono text-[11px] space-y-1.5">
                <p className="text-[9.5px] uppercase tracking-wider text-emerald-300">
                  Verified Plot Mass Balance
                </p>
                <p className="text-sky-200">
                  Water In ({soil.water.totalWaterInMm.toFixed(1)} mm) = Sank (
                  {soil.water.totalInfiltratedMm.toFixed(1)} mm) + Shed (
                  {soil.water.runoffVolumeMm.toFixed(1)} mm)
                </p>
                <p className="text-amber-200">
                  Carbon Start ({soil.carbon.initialTotalCarbonKg.toFixed(2)} kg) + Gained (
                  {soil.carbon.totalCarbonGainedKg.toFixed(2)}) - Oxidized (
                  {soil.carbon.fluxToAtmosphereKg.toFixed(2)}) - Exported (
                  {soil.carbon.lossOffPlotKg.toFixed(2)}) ={" "}
                  {soil.carbon.currentTotalCarbonKg.toFixed(2)} kg
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function drawMicroscopeScene(ctx, w, h, tab, soil, now) {
  ctx.clearRect(0, 0, w, h);

  // Darkfield epifluorescence background
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.65);
  bg.addColorStop(0, "#162019");
  bg.addColorStop(0.6, "#0b110d");
  bg.addColorStop(1, "#040605");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle microscope grid reticle
  ctx.strokeStyle = "rgba(167,243,208,0.06)";
  ctx.lineWidth = 1;
  for (let x = 24; x < w; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 24; y < h; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const bio = soil.biology || {};
  const arbusculeFrac = Math.min(1, Math.max(0.08, (bio.arbusculeDensity ?? 18) / 100));
  const exudateFrac = Math.min(1, Math.max(0.08, bio.rootExudateFlux ?? 0.26));
  const biocharFrac = Math.min(1, Math.max(0.05, bio.biocharCarbonFraction ?? 0.04));
  const isTardActive = (bio.tardigradeState || "tun") === "active";

  if (tab === "amf") {
    // Draw plant root cortical cells across left/center
    const cellW = w * 0.54;
    const cellH = 46;
    for (let row = 0; row < 3; row++) {
      const cy = 22 + row * (cellH + 8);
      ctx.fillStyle = `rgba(251,191,36,${0.06 + exudateFrac * 0.12})`;
      ctx.strokeStyle = "rgba(238,214,168,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(18, cy, cellW, cellH, 12);
      ctx.fill();
      ctx.stroke();

      // Intracellular tree-like Arbuscule inside each root cortical cell
      const ax = 18 + cellW * 0.62;
      const ay = cy + cellH * 0.5;
      drawArbusculeTree(ctx, ax, ay, Math.PI, 16 * (0.55 + arbusculeFrac * 0.6), 4, now + row * 400, arbusculeFrac);

      // Extraradical hypha entering from right rhizosphere
      ctx.strokeStyle = `rgba(110,231,183,${0.45 + arbusculeFrac * 0.5})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.bezierCurveTo(
        18 + cellW + 30,
        ay + Math.sin(now * 0.002 + row) * 10,
        w - 50,
        ay - 8,
        w - 12,
        ay + (row - 1) * 18
      );
      ctx.stroke();

      // Animated exchange molecules: Gold C6H12O6 moving root -> fungus, Cyan PO4 moving fungus -> root
      const t = ((now * 0.0006 + row * 0.33) % 1);
      const sugarX = 36 + t * (cellW + 70);
      ctx.fillStyle = "rgba(251,191,36,0.95)";
      ctx.beginPath();
      ctx.arc(sugarX, ay - 6, 3.2, 0, TAU);
      ctx.fill();

      const phosX = w - 24 - t * (w - ax - 24);
      ctx.fillStyle = "rgba(56,189,248,0.95)";
      ctx.beginPath();
      ctx.arc(phosX, ay + 6, 3.2, 0, TAU);
      ctx.fill();
    }
  } else if (tab === "tardigrade") {
    // Hydrated pore meniscus film
    ctx.fillStyle = "rgba(56,189,248,0.12)";
    ctx.beginPath();
    ctx.ellipse(w * 0.42, h * 0.52, w * 0.34, h * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(125,211,252,0.38)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw detailed Tardigrade (Water Bear) at center-left
    ctx.save();
    ctx.translate(w * 0.4, h * 0.52);
    if (isTardActive) {
      const walk = Math.sin(now * 0.004) * 3;
      ctx.translate(walk, 0);
      // 4 plump body segments
      const segs = [
        { x: -26, rx: 12, ry: 11 },
        { x: -10, rx: 15, ry: 14 },
        { x: 8, rx: 15, ry: 14 },
        { x: 24, rx: 12, ry: 10 },
      ];
      segs.forEach((s, si) => {
        ctx.fillStyle = "rgba(252,211,77,0.82)";
        ctx.strokeStyle = "rgba(254,240,138,0.9)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(s.x, Math.sin(now * 0.006 + si) * 1.4, s.rx, s.ry, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();

        // Stubby legs with claws
        const legSwing = Math.sin(now * 0.008 + si * 1.6) * 4;
        ctx.beginPath();
        ctx.moveTo(s.x - 3, s.ry - 2);
        ctx.lineTo(s.x - 3 + legSwing, s.ry + 10);
        ctx.stroke();
      });
      // Mouth stylet & eye spot
      ctx.fillStyle = "#120d09";
      ctx.beginPath();
      ctx.arc(31, -3, 1.8, 0, TAU);
      ctx.fill();
    } else {
      // Cryptobiotic Tun state (contracted dormant barrel)
      ctx.fillStyle = "rgba(217,160,91,0.75)";
      ctx.strokeStyle = "rgba(253,230,138,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 15, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(254,240,138,0.85)";
      ctx.font = "600 10px ui-monospace, monospace";
      ctx.fillText("TUN (DORMANT)", -38, 28);
    }
    ctx.restore();

    // Draw swimming Beneficial Nematodes on the right
    for (let n = 0; n < 2; n++) {
      const nx = w * 0.78;
      const ny = h * (0.34 + n * 0.36);
      ctx.strokeStyle = "rgba(186,230,253,0.9)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let s = 0; s <= 16; s++) {
        const px = nx + (s - 8) * 3.8;
        const py = ny + Math.sin(now * 0.008 + s * 0.65 + n * 2) * 6;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  } else if (tab === "biochar") {
    // Draw porous hexagonal Biochar Honeycomb Matrix
    const hexR = 26;
    const centers = [
      { x: w * 0.34, y: h * 0.42 },
      { x: w * 0.5, y: h * 0.32 },
      { x: w * 0.5, y: h * 0.58 },
      { x: w * 0.66, y: h * 0.44 },
      { x: w * 0.34, y: h * 0.68 },
    ];
    centers.forEach((c, idx) => {
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const ang = (s * TAU) / 6;
        const px = c.x + Math.cos(ang) * hexR;
        const py = c.y + Math.sin(ang) * hexR;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(15,23,30,0.9)";
      ctx.fill();
      ctx.strokeStyle = `rgba(56,189,248,${0.45 + biocharFrac * 0.5})`;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Trapped water meniscus and emerald PGPR bacteria inside each honeycomb pore
      ctx.fillStyle = "rgba(56,189,248,0.22)";
      ctx.beginPath();
      ctx.arc(c.x, c.y, hexR * 0.65, 0, TAU);
      ctx.fill();

      for (let b = 0; b < 4; b++) {
        const a = now * 0.002 + b * 1.5 + idx;
        const bx = c.x + Math.cos(a) * (hexR * 0.35);
        const by = c.y + Math.sin(a) * (hexR * 0.35);
        ctx.fillStyle = b % 2 === 0 ? "#6ee7b7" : "#fcd34d";
        ctx.beginPath();
        ctx.arc(bx, by, 2.4, 0, TAU);
        ctx.fill();
      }
    });
  } else if (tab === "macropore") {
    // Glomalin-coated macro-aggregates + vertical earthworm macropore channel
    const crumbs = [
      { x: w * 0.25, y: h * 0.36, r: 24 },
      { x: w * 0.28, y: h * 0.68, r: 28 },
      { x: w * 0.74, y: h * 0.38, r: 26 },
      { x: w * 0.72, y: h * 0.7, r: 24 },
    ];
    crumbs.forEach((c) => {
      ctx.fillStyle = "rgba(110,231,183,0.18)";
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r + 6, 0, TAU);
      ctx.fill();

      ctx.fillStyle = "#4a331f";
      ctx.strokeStyle = "rgba(110,231,183,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, TAU);
      ctx.fill();
      ctx.stroke();
    });

    // Central Earthworm Macropore Channel with percolating water droplets
    ctx.fillStyle = "rgba(14,22,28,0.85)";
    ctx.fillRect(w * 0.44, 0, w * 0.12, h);

    for (let d = 0; d < 5; d++) {
      const dy = ((now * 0.09 + d * 42) % h);
      ctx.fillStyle = "rgba(56,189,248,0.85)";
      ctx.beginPath();
      ctx.arc(w * 0.5 + Math.sin(d) * 5, dy, 3.5, 0, TAU);
      ctx.fill();
    }
  }
}

function drawArbusculeTree(ctx, x, y, ang, len, depth, now, vigor) {
  if (depth <= 0 || len < 2) return;
  const nx = x + Math.cos(ang) * len;
  const ny = y + Math.sin(ang) * len;
  ctx.strokeStyle = `rgba(110,231,183,${0.35 + vigor * 0.6})`;
  ctx.lineWidth = Math.max(0.9, depth * 0.65);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(nx, ny);
  ctx.stroke();

  if (depth === 1) {
    ctx.fillStyle = `rgba(251,191,36,${0.5 + vigor * 0.45})`;
    ctx.beginPath();
    ctx.arc(nx, ny, 1.8, 0, TAU);
    ctx.fill();
  }

  const sway = Math.sin(now * 0.003 + depth) * 0.08;
  drawArbusculeTree(ctx, nx, ny, ang - 0.52 + sway, len * 0.72, depth - 1, now, vigor);
  drawArbusculeTree(ctx, nx, ny, ang + 0.52 + sway, len * 0.72, depth - 1, now, vigor);
}
