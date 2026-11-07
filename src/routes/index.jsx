import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FieldCanvas } from "@/components/field/FieldCanvas";
import { Hud } from "@/components/field/Hud";
import { MicroscopeDive } from "@/components/field/MicroscopeDive";
import { SeasonEnd } from "@/components/field/SeasonEnd";
import { VerbDock } from "@/components/field/VerbDock";
import {
  BIOREGIONS,
  SEASON_MS,
  advanceToNextSeason,
  createDefaultSoilState,
  evaluateSeasonOutcome,
  performGestureVerb,
} from "@/lib/soil/model";
import { loadField, saveField } from "@/lib/soil/storage";
import { fieldGuideCards } from "@/lib/species";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soil Grower: Sanctuary Zero" },
      {
        name: "description",
        content:
          "Dive into the living soil subsurface: mycorrhizal arbuscules, tardigrades, nematodes, pre-charged biochar, and biostimulants across four ninety-second seasons.",
      },
      { name: "theme-color", content: "#0b0806" },
    ],
  }),
  component: Sanctuary,
});

const OPENING_LINE =
  "Tap any subsurface beacon to dive 400x, or water, biostimulate, and test your soil.";
const SECONDS = SEASON_MS / 1000;

const snapshot = (s) => ({
  rain: s.water.totalWaterInMm,
  sank: s.water.totalInfiltratedMm,
  shed: s.water.runoffVolumeMm,
  carbon: s.carbon.currentTotalCarbonKg,
});

function Sanctuary() {
  const [soil, setSoil] = useState(() => createDefaultSoilState("rogue_valley"));
  const [secondsLeft, setSecondsLeft] = useState(SECONDS);
  const [phase, setPhase] = useState("playing");
  const [flash, setFlash] = useState(OPENING_LINE);
  const [pulse, setPulse] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [balance, setBalance] = useState(null);
  const [species, setSpecies] = useState(() => fieldGuideCards("rogue_valley"));
  const [region, setRegion] = useState("rogue_valley");
  const [microscope, setMicroscope] = useState(null);

  const soilRef = useRef(soil);
  const deadline = useRef(Date.now() + SEASON_MS);
  const mark = useRef(snapshot(soil));
  const ended = useRef(false);

  useEffect(() => {
    const saved = loadField();
    if (saved) {
      soilRef.current = saved.state;
      setSoil(saved.state);
      const reg = saved.state.site?.bioregionId || "rogue_valley";
      setRegion(reg);
      setSpecies(fieldGuideCards(reg));
      const remaining = typeof saved.msLeft === "number" ? saved.msLeft : SEASON_MS;
      deadline.current = Date.now() + remaining;
      setSecondsLeft(Math.ceil(remaining / 1000));
      mark.current = saved.mark || snapshot(saved.state);
      if (saved.phase === "ended") {
        ended.current = true;
        setPhase("ended");
        setOutcome(evaluateSeasonOutcome(saved.state));
        setBalance(saved.balance || null);
      } else {
        setFlash(saved.flash || OPENING_LINE);
      }
    }
  }, []);

  const persist = useCallback((state, patch = {}) => {
    saveField({
      state,
      msLeft: Math.max(0, deadline.current - Date.now()),
      phase: patch.phase || "playing",
      flash: patch.flash,
      mark: mark.current,
      balance: patch.balance,
    });
  }, []);

  const endSeason = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    const state = soilRef.current;
    const result = evaluateSeasonOutcome(state);
    const now = snapshot(state);
    const seasonBalance = {
      rain: Math.max(0, now.rain - mark.current.rain),
      sank: Math.max(0, now.sank - mark.current.sank),
      shed: Math.max(0, now.shed - mark.current.shed),
      carbon: now.carbon - mark.current.carbon,
    };

    setPhase("ended");
    setOutcome(result);
    setBalance(seasonBalance);
    setSpecies(fieldGuideCards(state.site.bioregionId));
    persist(state, { phase: "ended", balance: seasonBalance });
  }, [persist]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, deadline.current - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        window.clearInterval(id);
        endSeason();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, endSeason]);

  const act = useCallback(
    (verb, mode) => {
      if (ended.current) return;
      const current = soilRef.current;
      if (current.season.decisionsTakenInSeason >= current.season.maxDecisionsPerSeason) return;

      const result = performGestureVerb(current, verb, mode);
      soilRef.current = result.state;
      setSoil(result.state);
      setPulse({ verb, mode, result, key: `${verb}-${Date.now()}` });
      setFlash(result.headlineOutcome);
      persist(result.state, { flash: result.headlineOutcome });

      if (result.state.season.decisionsTakenInSeason >= result.state.season.maxDecisionsPerSeason) {
        window.setTimeout(() => endSeason(), 1300);
      }
    },
    [endSeason, persist]
  );

  const nextSeason = useCallback(() => {
    const next = advanceToNextSeason(soilRef.current);
    soilRef.current = next;
    mark.current = snapshot(next);
    deadline.current = Date.now() + SEASON_MS;
    ended.current = false;
    setSoil(next);
    setPhase("playing");
    setOutcome(null);
    setBalance(null);
    setSecondsLeft(SECONDS);
    setFlash(OPENING_LINE);
    persist(next, { flash: OPENING_LINE });
  }, [persist]);

  const changeRegion = useCallback(
    (id) => {
      const site = BIOREGIONS[id] || BIOREGIONS.rogue_valley;
      const next = { ...soilRef.current, site };
      soilRef.current = next;
      setSoil(next);
      setRegion(id);
      setSpecies(fieldGuideCards(id));
      setFlash(`Subsurface profile calibrated to ${site.shortName} (${site.soilSeries}).`);
      persist(next);
    },
    [persist]
  );

  const handleInspectCanvas = useCallback((hit) => {
    if (!hit) return;
    setMicroscope({
      tab: hit.id || "amf",
      horizon: hit.horizon || "A",
    });
  }, []);

  const openMicroscopeTab = useCallback((tabId = "amf") => {
    const tabMap = {
      amf: "amf",
      fungus: "amf",
      tardigrade: "tardigrade",
      nematode: "tardigrade",
      biochar: "biochar",
      earthworm: "macropore",
      macropore: "macropore",
      horizons: "horizons",
    };
    setMicroscope({
      tab: tabMap[tabId] || "amf",
      horizon: "A",
    });
  }, []);

  const decisionsLeft = Math.max(0, 3 - soil.season.decisionsTakenInSeason);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0b0806] text-[#f8f0e0]">
      <FieldCanvas soil={soil} pulse={pulse} onInspect={handleInspectCanvas} />
      <Hud
        soil={soil}
        secondsLeft={secondsLeft}
        region={region}
        onRegion={changeRegion}
        flash={flash}
        onOpenMicroscope={openMicroscopeTab}
      />
      <VerbDock onAct={act} disabled={phase !== "playing" || decisionsLeft === 0} />
      {phase === "ended" && (
        <SeasonEnd
          soil={soil}
          outcome={outcome}
          species={species}
          loading={false}
          balance={balance}
          onNext={nextSeason}
          regionName={soil.site.shortName}
          onInspectGroup={openMicroscopeTab}
        />
      )}
      {microscope && (
        <MicroscopeDive
          soil={soil}
          initialTab={microscope.tab}
          initialHorizon={microscope.horizon}
          onClose={() => setMicroscope(null)}
          onQuickAct={act}
          canAct={phase === "playing" && decisionsLeft > 0}
        />
      )}
    </main>
  );
}
