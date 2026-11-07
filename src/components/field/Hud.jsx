import { Microscope } from "lucide-react";
import { BIOREGIONS } from "@/lib/soil/model";

function clock(seconds) {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Hud({ soil, secondsLeft, region, onRegion, flash, onOpenMicroscope }) {
  const spent = soil.season.decisionsTakenInSeason;
  const left = Math.max(0, 3 - spent);
  const bio = soil.biology || {};
  const arbuscules = Math.round(bio.arbusculeDensity ?? 18);
  const biochar = Math.round((bio.biocharCarbonFraction ?? 0.04) * 100);
  const tardState = (bio.tardigradeState || "tun") === "active" ? "Active" : "Tun";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-[#0d0906]/85 via-[#0d0906]/45 to-transparent pb-8">
      <div className="flex items-start justify-between px-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-[9px] uppercase tracking-[0.34em] text-emerald-300/75">
            Soil Grower : Subsurface
          </p>
          <p className="font-display text-[16px] leading-tight text-[#f8f0e0]">Sanctuary Zero</p>
        </div>

        <div className="text-right">
          <div className="flex items-baseline justify-end gap-2">
            <span className="text-[9px] uppercase tracking-[0.24em] text-[#f2e7d2]/60">
              Season {soil.season.seasonNumber}/4
            </span>
            <span className="font-mono text-[18px] leading-none tabular-nums text-[#f8f0e0]">
              {clock(secondsLeft)}
            </span>
          </div>
          <div className="mt-2 flex justify-end gap-1.5" aria-label={`${left} decisions left`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-[3.5px] w-5 rounded-full transition-colors duration-500 ${
                  i < left ? "bg-emerald-300" : "bg-[#f4e4c3]/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-2.5 px-4 font-display text-[13px] italic leading-snug text-[#f7efdd]/95">
        {flash}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 px-4">
        <select
          value={region}
          onChange={(e) => onRegion(e.target.value)}
          aria-label="Bioregion"
          className="pointer-events-auto appearance-none rounded-full border border-[#f4e4c3]/20 bg-[#0d0906]/65 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#f7efdd]/85 backdrop-blur-sm focus:outline-none"
        >
          {Object.values(BIOREGIONS).map((r) => (
            <option
              key={r.bioregionId}
              value={r.bioregionId}
              className="bg-[#1a130d] text-[#f7efdd]"
            >
              {r.shortName}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onOpenMicroscope("amf")}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-950/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-200 backdrop-blur-sm transition active:scale-95"
        >
          <Microscope size={12} />
          Dive 400x
        </button>

        <button
          type="button"
          onClick={() => onOpenMicroscope("amf")}
          className="pointer-events-auto hidden sm:flex items-center gap-2 rounded-full border border-[#f4e4c3]/15 bg-[#0d0906]/55 px-2.5 py-1 font-mono text-[9.5px] text-[#f2e7d2]/80 backdrop-blur-sm"
        >
          <span className="text-emerald-300">AMF {arbuscules}%</span>
          <span>·</span>
          <span className="text-sky-300">Biochar {biochar}%</span>
          <span>·</span>
          <span className="text-amber-300">Water Bears: {tardState}</span>
        </button>
      </div>
    </div>
  );
}
