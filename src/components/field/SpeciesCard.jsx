import { groupMechanic } from "@/lib/species";

function SpecimenPortrait({ type, soil }) {
  const isTardActive = (soil?.biology?.tardigradeState || "tun") === "active";

  if (type === "amf" || type === "fungus") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full bg-[#0c1612]">
        <rect x="6" y="12" width="32" height="40" rx="8" fill="#fbbf24" fillOpacity="0.14" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M58 32 C46 32, 42 32, 28 32" stroke="#6ee7b7" strokeWidth="2.2" fill="none" />
        <path d="M28 32 L20 22 M28 32 L20 42 M20 22 L14 18 M20 22 L15 26 M20 42 L14 38 M20 42 L15 46" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="14" cy="18" r="2.2" fill="#fbbf24" />
        <circle cx="15" cy="26" r="2.2" fill="#38bdf8" />
        <circle cx="14" cy="38" r="2.2" fill="#fbbf24" />
        <circle cx="15" cy="46" r="2.2" fill="#38bdf8" />
      </svg>
    );
  }

  if (type === "tardigrade") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full bg-[#11151c]">
        <ellipse cx="32" cy="34" rx="24" ry="16" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeOpacity="0.4" />
        {isTardActive ? (
          <g>
            <ellipse cx="20" cy="32" rx="6" ry="5.5" fill="#fcd34d" />
            <ellipse cx="28" cy="31" rx="7" ry="6.5" fill="#fcd34d" />
            <ellipse cx="37" cy="31" rx="7" ry="6.5" fill="#fcd34d" />
            <ellipse cx="45" cy="32" rx="5.5" ry="5" fill="#fcd34d" />
            <path d="M19 37 L17 43 M27 37 L26 44 M36 37 L37 44 M44 37 L46 43" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="48" cy="30" r="1.2" fill="#120d09" />
          </g>
        ) : (
          <g>
            <ellipse cx="32" cy="33" rx="11" ry="8" fill="#d9a05b" stroke="#fef08a" strokeWidth="1.2" />
            <text x="32" y="52" textAnchor="middle" fill="#fef08a" fontSize="7" fontFamily="monospace">
              TUN STATE
            </text>
          </g>
        )}
      </svg>
    );
  }

  if (type === "nematode") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full bg-[#0b151c]">
        <path
          d="M10 42 Q20 18, 32 32 T54 22"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M14 48 Q26 34, 38 44 T56 38"
          fill="none"
          stroke="#bae6fd"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <circle cx="22" cy="26" r="2" fill="#6ee7b7" />
        <circle cx="42" cy="28" r="1.8" fill="#6ee7b7" />
        <circle cx="30" cy="44" r="2.2" fill="#6ee7b7" />
      </svg>
    );
  }

  if (type === "biochar") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full bg-[#0a1017]">
        <polygon
          points="32,10 50,20 50,44 32,54 14,44 14,20"
          fill="#111827"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        <polygon
          points="32,19 42,25 42,39 32,45 22,39 22,25"
          fill="#0ea5e9"
          fillOpacity="0.2"
          stroke="#6ee7b7"
          strokeWidth="1.2"
        />
        <circle cx="28" cy="30" r="2.3" fill="#6ee7b7" />
        <circle cx="36" cy="34" r="2.1" fill="#fbbf24" />
        <circle cx="31" cy="37" r="1.8" fill="#38bdf8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="h-full w-full bg-[#17110b]">
      <path d="M30 6 Q24 32, 34 58" stroke="#090705" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M30 12 Q26 32, 33 52" stroke="#d97757" strokeWidth="4.2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="24" r="5" fill="#5c422a" stroke="#6ee7b7" strokeOpacity="0.5" />
      <circle cx="48" cy="38" r="6" fill="#5c422a" stroke="#6ee7b7" strokeOpacity="0.5" />
    </svg>
  );
}

export function SpeciesCard({ card, soil, onInspectGroup }) {
  const mechanic = groupMechanic(card.group, soil);
  const credit = card.credit || "Subsurface Rhizosphere Atlas";

  return (
    <div
      onClick={() => onInspectGroup && onInspectGroup(card.group)}
      role={onInspectGroup ? "button" : undefined}
      tabIndex={onInspectGroup ? 0 : undefined}
      className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/70 p-2.5 ring-1 ring-[#2a1e13]/12 transition hover:bg-white/90 active:scale-[0.99]"
    >
      <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-xl ring-1 ring-black/15">
        <SpecimenPortrait type={card.specimen_type || card.group} soil={soil} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13px] font-semibold text-[#231a12]">
            {card.common_name || card.scientific_name}
          </p>
          <span className="shrink-0 rounded-full bg-[#231a12]/10 px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#3f5a3a]">
            {mechanic.functionTitle}
          </span>
        </div>
        <p className="truncate font-display text-[11px] italic text-[#6b5b46]">
          {card.scientific_name}
        </p>
        <p className="mt-1 text-[11.5px] leading-snug text-[#3a2d20]">{mechanic.sentence}</p>
        {mechanic.tacticHint && (
          <p className="mt-1 text-[10.5px] font-medium text-[#3f5a3a]">{mechanic.tacticHint}</p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[9px] font-mono uppercase tracking-[0.08em] text-[#6b5b46]">
          <span className="shrink-0 font-semibold text-[#231a12]">{mechanic.metric}</span>
          <span className="truncate">{credit}</span>
        </div>
      </div>
    </div>
  );
}
