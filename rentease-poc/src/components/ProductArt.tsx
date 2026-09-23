/**
 * Schematic line-art stand-ins for product photography. Same drafting language
 * as the floor plans, so the catalogue sits in the same visual world.
 */
const S = { stroke: '#1E4634', strokeWidth: 2, fill: 'none', strokeLinejoin: 'round' as const };
const H = { fill: '#CE8A22', opacity: 0.28 };

const ART: Record<string, React.ReactNode> = {
  bed: (
    <>
      <rect x="12" y="34" width="96" height="34" rx="3" {...H} />
      <rect x="12" y="34" width="96" height="34" rx="3" {...S} />
      <path d="M12 44h96M8 68v10M112 68v10M30 40v-2h24v2" {...S} />
      <rect x="22" y="20" width="76" height="14" rx="3" {...S} />
    </>
  ),
  table: (
    <>
      <rect x="16" y="30" width="88" height="10" rx="2" {...H} />
      <rect x="16" y="30" width="88" height="10" rx="2" {...S} />
      <path d="M24 40v34M96 40v34M24 58h44" {...S} />
      <rect x="60" y="44" width="36" height="14" rx="2" {...S} />
    </>
  ),
  wardrobe: (
    <>
      <rect x="30" y="14" width="60" height="62" rx="3" {...H} />
      <rect x="30" y="14" width="60" height="62" rx="3" {...S} />
      <path d="M60 14v62M52 44h4M64 44h4" {...S} />
    </>
  ),
  sofa: (
    <>
      <rect x="10" y="36" width="100" height="26" rx="5" {...H} />
      <rect x="10" y="36" width="100" height="26" rx="5" {...S} />
      <path d="M18 36V24a4 4 0 0 1 4-4h76a4 4 0 0 1 4 4v12M46 36v26M74 36v26M18 62v10M102 62v10" {...S} />
    </>
  ),
  dining: (
    <>
      <ellipse cx="60" cy="38" rx="42" ry="12" {...H} />
      <ellipse cx="60" cy="38" rx="42" ry="12" {...S} />
      <path d="M40 48v22M80 48v22M32 70h16M72 70h16" {...S} />
      <circle cx="20" cy="60" r="8" {...S} />
      <circle cx="100" cy="60" r="8" {...S} />
    </>
  ),
  shelf: (
    <>
      <rect x="28" y="14" width="64" height="62" rx="3" {...S} />
      <path d="M28 34h64M28 54h64" {...S} />
      <rect x="34" y="20" width="8" height="12" {...H} />
      <rect x="46" y="20" width="8" height="12" {...H} />
      <rect x="34" y="40" width="20" height="12" {...H} />
    </>
  ),
  lights: (
    <>
      <path d="M6 24c18 20 36 0 54 20s36 0 54-20" {...S} />
      <g fill="#CE8A22">
        <circle cx="24" cy="34" r="5" />
        <circle cx="48" cy="40" r="5" />
        <circle cx="72" cy="44" r="5" />
        <circle cx="96" cy="36" r="5" />
      </g>
      <path d="M6 54c18 20 36 0 54 20s36 0 54-20" {...S} strokeWidth={1.4} opacity={0.5} />
    </>
  ),
  diya: (
    <>
      <path d="M28 54c0 10 14 16 32 16s32-6 32-16" {...H} />
      <path d="M28 54c0 10 14 16 32 16s32-6 32-16Z" {...S} />
      <path d="M22 54h76" {...S} />
      <path d="M60 46c0-8-8-10-4-18 6 4 12 8 12 14a8 8 0 0 1-8 8 6 6 0 0 1-6-6c0-3 3-4 6 2Z" fill="#CE8A22" />
    </>
  ),
  rangoli: (
    <>
      <circle cx="60" cy="44" r="30" {...S} />
      <circle cx="60" cy="44" r="16" {...H} />
      <circle cx="60" cy="44" r="16" {...S} strokeWidth={1.4} />
      <path d="M60 14v60M30 44h60M39 23l42 42M81 23 39 65" {...S} strokeWidth={1.2} opacity={0.6} />
    </>
  ),
  toran: (
    <>
      <path d="M10 20h100" {...S} />
      <path d="M22 20v14M40 20v22M58 20v16M76 20v24M94 20v14" {...S} strokeWidth={1.4} />
      <g fill="#CE8A22" opacity={0.7}>
        <circle cx="22" cy="38" r="6" />
        <circle cx="40" cy="46" r="6" />
        <circle cx="58" cy="40" r="6" />
        <circle cx="76" cy="48" r="6" />
        <circle cx="94" cy="38" r="6" />
      </g>
      <path d="M14 58h92" {...S} strokeWidth={1.2} opacity={0.4} />
    </>
  ),
  pack: (
    <>
      <rect x="24" y="30" width="72" height="46" rx="3" {...H} />
      <rect x="24" y="30" width="72" height="46" rx="3" {...S} />
      <path d="M24 44h72M60 30v46" {...S} />
      <path d="M60 30c-8-14-24-10-20 0M60 30c8-14 24-10 20 0" {...S} strokeWidth={1.6} />
    </>
  ),
  balloon: (
    <>
      <path d="M14 74C14 34 46 14 60 14s46 20 46 60" {...S} />
      <g fill="#CE8A22">
        <circle cx="20" cy="52" r="9" opacity={0.55} />
        <circle cx="42" cy="28" r="9" opacity={0.35} />
        <circle cx="70" cy="24" r="9" opacity={0.55} />
        <circle cx="96" cy="44" r="9" opacity={0.35} />
      </g>
    </>
  ),
  leaftoran: (
    <>
      <path d="M10 22h100" {...S} />
      <g {...S} strokeWidth={1.5}>
        <path d="M24 22c-6 6-6 16 0 22 6-6 6-16 0-22Z" />
        <path d="M42 22c-7 8-7 20 0 28 7-8 7-20 0-28Z" />
        <path d="M60 22c-6 7-6 18 0 25 6-7 6-18 0-25Z" />
        <path d="M78 22c-7 8-7 20 0 28 7-8 7-20 0-28Z" />
        <path d="M96 22c-6 6-6 16 0 22 6-6 6-16 0-22Z" />
      </g>
      <path d="M24 24v18M42 24v24M60 24v21M78 24v24M96 24v18" {...S} strokeWidth={1} opacity={0.5} />
    </>
  ),
  mirrorwork: (
    <>
      <rect x="26" y="14" width="68" height="60" rx="3" {...H} />
      <rect x="26" y="14" width="68" height="60" rx="3" {...S} />
      <g {...S} strokeWidth={1.3}>
        <circle cx="44" cy="30" r="7" />
        <circle cx="60" cy="44" r="9" />
        <circle cx="76" cy="30" r="7" />
        <circle cx="44" cy="60" r="7" />
        <circle cx="76" cy="60" r="7" />
      </g>
      <g fill="#CE8A22" opacity={0.5}>
        <circle cx="60" cy="44" r="4" />
        <circle cx="44" cy="30" r="3" />
        <circle cx="76" cy="60" r="3" />
      </g>
    </>
  ),
  curtain: (
    <>
      <path d="M12 18h96" {...S} />
      <g {...S} strokeWidth={1.1} opacity={0.65}>
        <path d="M22 18v56M38 18v52M54 18v58M70 18v50M86 18v56M100 18v48" />
      </g>
      <g fill="#CE8A22">
        <circle cx="22" cy="36" r="3" /><circle cx="22" cy="58" r="3" />
        <circle cx="38" cy="30" r="3" /><circle cx="38" cy="52" r="3" />
        <circle cx="54" cy="40" r="3" /><circle cx="54" cy="64" r="3" />
        <circle cx="70" cy="28" r="3" /><circle cx="70" cy="48" r="3" />
        <circle cx="86" cy="38" r="3" /><circle cx="86" cy="60" r="3" />
        <circle cx="100" cy="32" r="3" />
      </g>
    </>
  ),
  decal: (
    <>
      <rect x="18" y="14" width="84" height="62" rx="2" {...S} />
      <g {...H}>
        <circle cx="40" cy="34" r="9" />
        <rect x="58" y="26" width="16" height="16" rx="2" />
        <circle cx="82" cy="52" r="7" />
      </g>
      <g {...S} strokeWidth={1.4}>
        <circle cx="40" cy="34" r="9" />
        <rect x="58" y="26" width="16" height="16" rx="2" />
        <circle cx="82" cy="52" r="7" />
        <path d="M30 58h26M30 66h16" />
      </g>
    </>
  ),
  nameplate: (
    <>
      <rect x="20" y="28" width="80" height="34" rx="4" {...H} />
      <rect x="20" y="28" width="80" height="34" rx="4" {...S} />
      <path d="M30 40h44M30 50h30" {...S} strokeWidth={1.5} />
      <circle cx="88" cy="45" r="6" {...S} strokeWidth={1.4} />
      <path d="M28 28v-6M92 28v-6" {...S} strokeWidth={1.4} />
    </>
  ),
  bunting: (
    <>
      <path d="M8 22c26 16 78 16 104 0" {...S} />
      <g {...S} strokeWidth={1.4}>
        <path d="M24 27l8 18 8-16z" />
        <path d="M46 33l8 18 8-18z" />
        <path d="M68 33l8 16 8-19z" />
      </g>
      <g fill="#CE8A22" opacity={0.45}>
        <path d="M24 27l8 18 8-16z" />
        <path d="M68 33l8 16 8-19z" />
      </g>
      <path d="M14 62h92" {...S} strokeWidth={1.2} opacity={0.4} />
    </>
  ),
  wreath: (
    <>
      <circle cx="60" cy="44" r="28" {...S} strokeWidth={6} opacity={0.25} />
      <circle cx="60" cy="44" r="28" {...S} />
      <circle cx="60" cy="44" r="20" {...S} strokeWidth={1.2} opacity={0.5} />
      <g fill="#CE8A22">
        <circle cx="60" cy="16" r="4" />
        <circle cx="84" cy="52" r="4" />
        <circle cx="40" cy="62" r="4" />
      </g>
      <path d="M52 12c4 4 12 4 16 0" {...S} strokeWidth={1.5} />
    </>
  ),
  lantern: (
    <>
      <g {...S}>
        <path d="M30 30h20l-4 34H34zM28 30h24M32 24h16v6H32zM36 64h12v5H36z" />
        <path d="M62 22h20l-4 42H66zM60 22h24M64 16h16v6H64zM68 64h12v5H68z" />
        <path d="M92 34h16l-3 28H95zM90 34h20M94 29h12v5H94z" />
      </g>
      <g fill="#CE8A22" opacity={0.5}>
        <rect x="36" y="38" width="10" height="18" rx="2" />
        <rect x="68" y="32" width="10" height="24" rx="2" />
        <rect x="96" y="40" width="8" height="16" rx="2" />
      </g>
    </>
  ),
  backdrop: (
    <>
      <path d="M14 14h92v58H14z" {...H} />
      <path d="M14 14h92v58H14z" {...S} />
      <path d="M26 14c4 20-4 38 0 58M46 14c-4 20 4 38 0 58M66 14c4 20-4 38 0 58M86 14c-4 20 4 38 0 58" {...S} strokeWidth={1.2} opacity={0.55} />
      <path d="M10 14h100" {...S} />
    </>
  ),
  stencil: (
    <>
      <rect x="20" y="16" width="80" height="58" rx="2" {...S} />
      <g {...S} strokeWidth={1.3} opacity={0.75}>
        <path d="M34 30l10-10 10 10-10 10zM66 30l10-10 10 10-10 10zM50 54l10-10 10 10-10 10z" />
      </g>
      <g {...H}>
        <path d="M34 30l10-10 10 10-10 10zM50 54l10-10 10 10-10 10z" />
      </g>
    </>
  ),
};

export function ProductArt({ art, className }: { art: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 88" className={className} aria-hidden>
      {ART[art] ?? ART.pack}
    </svg>
  );
}
