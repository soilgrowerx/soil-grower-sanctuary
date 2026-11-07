import { Microscope } from "lucide-react";
import { SpeciesCard } from "./SpeciesCard";

export function SeasonEnd({
  soil,
  outcome,
  species,
  loading,
  balance,
  onNext,
  regionName,
  onInspectGroup,
}) {
  const score = outcome?.livingSoilScore ?? 0;
  const circumference = 2 * Math.PI * 34;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-[#0b0806]/65 backdrop-blur-[2px]">
      <div className="max-h-[92%] overflow-y-auto overscroll-contain rounded-t-[30px] bg-[#f4ecdc] px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-20px_60px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-[#2a1e13]/20" />

        <div className="flex items-center gap-4">
          <div className="relative h-[78px] w-[78px] shrink-0">
            <svg viewBox="0 0 78 78" className="h-full w-full -rotate-90">
              <circle
                cx="39"
                cy="39"
                r="34"
                fill="none"
                stroke="#2a1e13"
                strokeOpacity="0.12"
                strokeWidth="3.5"
              />
              <circle
                cx="39"
                cy="39"
                r="34"
                fill="none"
                stroke="#2e6f40"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score / 100)}
                style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[27px] leading-none text-[#231a12]">{score}</span>
              <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.18em] text-[#5c4e3c]">
                vitality
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#6b5b46]">
                Season {soil.season.seasonNumber} complete
              </p>
              <button
                type="button"
                onClick={() => onInspectGroup && onInspectGroup("amf")}
                className="flex items-center gap-1 rounded-full bg-[#231a12] px-2.5 py-1 text-[9.5px] font-medium text-[#f7efdd]"
              >
                <Microscope size={11} />
                Dive 400x
              </button>
            </div>
            <p className="mt-1 font-display text-[16.5px] leading-snug text-[#231a12]">
              {outcome?.soilBecameLine}
            </p>
          </div>
        </div>

        <p className="mt-3 rounded-xl bg-[#2a1e13]/8 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[#4a3b2a]">
          rain {balance?.rain.toFixed(0)} mm · sank {balance?.sank.toFixed(0)} mm · shed{" "}
          {balance?.shed.toFixed(0)} mm
          {balance && balance.carbon !== 0
            ? ` · carbon ${balance.carbon > 0 ? "+" : ""}${balance.carbon.toFixed(1)} kg`
            : ""}
          {` · AMF arbuscules ${Math.round(soil.biology.arbusculeDensity ?? 18)}%`}
        </p>

        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#5c4e3c]">
            Subsurface Soil Food Web (Tap to Inspect)
          </p>
          <p className="text-[9px] uppercase tracking-[0.14em] text-[#7a6a53]">
            {regionName} · Rhizosphere Atlas
          </p>
        </div>

        <div className="mt-2 space-y-2">
          {loading && species.length === 0
            ? [0, 1, 2].map((i) => (
                <div key={i} className="h-[86px] animate-pulse rounded-2xl bg-[#2a1e13]/8" />
              ))
            : species.map((card) => (
                <SpeciesCard
                  key={card.id}
                  card={card}
                  soil={soil}
                  onInspectGroup={onInspectGroup}
                />
              ))}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="mt-4 w-full rounded-2xl bg-[#231a12] py-3.5 text-[13px] font-medium tracking-wide text-[#f7efdd] transition active:scale-[0.99]"
        >
          {soil.season.seasonNumber >= 4
            ? "Keep tending the living profile"
            : `Open season ${soil.season.seasonNumber + 1} (Unlock deeper horizon)`}
        </button>
      </div>
    </div>
  );
}
