import { useState } from "react";
import { Droplet, Shovel, Sprout } from "lucide-react";
import { VERB_MODES } from "@/lib/soil/model";

const VERBS = [
  { id: "water", label: "Water", Icon: Droplet, accent: "#7dd3fc" },
  { id: "feed", label: "Biostimulate", Icon: Sprout, accent: "#6ee7b7" },
  { id: "disturb", label: "Disturb", Icon: Shovel, accent: "#f4a261" },
];

export function VerbDock({ onAct, disabled }) {
  const [open, setOpen] = useState(null);
  const [picked, setPicked] = useState({
    water: "cloudburst",
    feed: "biochar",
    disturb: "till",
  });

  const subtitle = (id) => {
    const modes = VERB_MODES[id] || [];
    const mode = modes.find((m) => m.id === picked[id]);
    return mode ? mode.label : modes[0]?.label || "";
  };

  const press = (id) => {
    if (disabled) return;
    setOpen((current) => (current === id ? null : id));
  };

  const choose = (id, mode) => {
    if (disabled) return;
    setPicked((p) => ({ ...p, [id]: mode }));
    setOpen(null);
    onAct(id, mode);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090705] via-[#090705]/80 to-transparent" />

      {open && (
        <div
          className={`relative mb-2.5 grid gap-2 ${
            VERB_MODES[open].length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
          }`}
        >
          {VERB_MODES[open].map((mode) => (
            <button
              key={mode.label}
              type="button"
              onClick={() => choose(open, mode.id)}
              className={`rounded-2xl border p-2.5 text-left backdrop-blur-md transition active:scale-[0.97] ${
                picked[open] === mode.id
                  ? "border-emerald-300/50 bg-[#1a1610]/90"
                  : "border-[#f4e4c3]/15 bg-[#0e0a07]/85"
              }`}
            >
              <span className="block text-[12px] font-semibold text-[#f8f0e0]">{mode.label}</span>
              <span className="mt-0.5 block text-[9.5px] font-medium uppercase tracking-[0.08em] text-emerald-300/85">
                {mode.hint}
              </span>
              {mode.detail && (
                <span className="mt-1 block text-[10px] leading-snug text-[#f2e7d2]/65">
                  {mode.detail}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="relative grid grid-cols-3 gap-2">
        {VERBS.map(({ id, label, Icon, accent }) => (
          <button
            key={id}
            type="button"
            onClick={() => press(id)}
            disabled={disabled}
            className={`group relative overflow-hidden rounded-[20px] border border-[#f4e4c3]/15 bg-[#0e0a07]/75 px-2 pb-2.5 pt-3 backdrop-blur-md transition active:scale-[0.97] ${
              disabled ? "opacity-40" : ""
            } ${open === id ? "border-[#f4e4c3]/50 ring-1 ring-[#f4e4c3]/25" : ""}`}
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] opacity-80"
              style={{ background: accent }}
            />
            <Icon size={19} strokeWidth={1.7} style={{ color: accent }} className="mx-auto" />
            <span className="mt-1.5 block text-[13px] font-medium text-[#f8f0e0]">{label}</span>
            <span className="mt-0.5 block truncate text-[9px] uppercase tracking-[0.12em] text-[#f2e7d2]/60">
              {subtitle(id)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
