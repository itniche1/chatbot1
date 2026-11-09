import { useId } from "react";

/**
 * Chatbase mascot: a glossy orange robot head with a dark visor and pill eyes.
 * Pure SVG + CSS motion (.bot-* in marketing.css): floats and tilts, blinks,
 * glances side to side, and the antenna wiggles with a glowing tip.
 */
export function RobotMascot({ size = 180, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const g = (n: string) => `${n}-${id}`;
  return (
    <svg className={`bot ${className}`} width={size} height={size} viewBox="0 0 200 200" fill="none" role="img" aria-label="Chatbase assistant mascot">
      <defs>
        <radialGradient id={g("head")} cx="30%" cy="22%" r="85%">
          <stop offset="0" stopColor="#FFF3E8" />
          <stop offset=".32" stopColor="#F9B783" />
          <stop offset=".7" stopColor="#E9781F" />
          <stop offset="1" stopColor="#C2570B" />
        </radialGradient>
        <linearGradient id={g("shine")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g("visor")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2A2E" />
          <stop offset=".45" stopColor="#141416" />
          <stop offset="1" stopColor="#0B0B0D" />
        </linearGradient>
        <linearGradient id={g("eye")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC99E" />
          <stop offset="1" stopColor="#E57119" />
        </linearGradient>
        <linearGradient id={g("antenna")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBC79C" />
          <stop offset="1" stopColor="#E57119" />
        </linearGradient>
        <filter id={g("soft")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id={g("glow")} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>

      {/* Ground shadow (shrinks as the robot rises) */}
      <ellipse cx="100" cy="186" rx="52" ry="7" fill="#000" opacity=".35" filter={`url(#${g("soft")})`} className="bot__shadow" />

      <g className="bot__body">
        {/* Halo behind the head */}
        <rect x="26" y="44" width="148" height="136" rx="50" fill="#E57119" opacity=".45" filter={`url(#${g("soft")})`} />

        {/* Antenna */}
        <g className="bot__antenna">
          <circle cx="100" cy="26" r="9" fill="#F5A46A" filter={`url(#${g("glow")})`} className="bot__antenna-glow" />
          <rect x="92" y="18" width="16" height="32" rx="8" fill={`url(#${g("antenna")})`} />
          <rect x="95" y="21" width="5" height="12" rx="2.5" fill="#fff" opacity=".55" />
        </g>

        {/* Head */}
        <rect x="30" y="46" width="140" height="130" rx="46" fill={`url(#${g("head")})`} />
        <rect x="30" y="46" width="140" height="130" rx="46" fill={`url(#${g("shine")})`} />
        <path d="M58 60 C 74 52, 98 50, 116 52" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".5" />

        {/* Visor */}
        <rect x="50" y="86" width="100" height="58" rx="27" fill={`url(#${g("visor")})`} />
        <rect x="50.5" y="86.5" width="99" height="57" rx="26.5" stroke="#fff" strokeOpacity=".08" />
        <path d="M66 94 C 86 90, 114 90, 134 94" stroke="#fff" strokeOpacity=".1" strokeWidth="3" strokeLinecap="round" />

        {/* Eyes */}
        <g className="bot__eyes">
          <rect x="79" y="104" width="11" height="22" rx="5.5" fill={`url(#${g("eye")})`} className="bot__eye" />
          <rect x="110" y="104" width="11" height="22" rx="5.5" fill={`url(#${g("eye")})`} className="bot__eye" />
        </g>
      </g>
    </svg>
  );
}
