import Image from "next/image";

const artwork: Record<string, string> = {
  fr: "france", ja: "japan", ko: "korea", es: "spain",
};

/** Compact landmarks for map pins, using the project's existing illustrations. */
export default function CountryMapArtwork({ code }: { code: string }) {
  if (artwork[code]) return <Image src={`/world/landmarks/${artwork[code]}.png`} width={76} height={76} alt="" draggable={false} />;
  return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <ellipse cx="50" cy="88" rx="44" ry="9" fill="#AED6C2" />
    <circle cx="76" cy="23" r="12" fill="#FFD46E" />
    {code === "de" ? <g stroke="#9A714D" strokeWidth="2" strokeLinejoin="round">
      <path d="M13 42 50 26 87 42Z" fill="#FFD794" />
      <path d="M17 42H83V50H17Z" fill="#E7B66E" />
      {[22, 35, 48, 61, 74].map(x => <path key={x} d={`M${x} 50h6v30h-6z`} fill="#F9DCAB" />)}
      <path d="M12 80H88V87H12Z" fill="#E7B66E" />
      <path d="M42 26V18H59V26M46 18 42 11M55 18 59 11" stroke="#5A9A91" strokeWidth="4" />
    </g> : code === "th" ? <g stroke="#AA7440" strokeWidth="2" strokeLinejoin="round">
      <path d="M25 63H75V85H25Z" fill="#FFCF7D" />
      <path d="M12 63 50 40 88 63ZM23 46 50 26 77 46ZM39 29 50 7 61 29Z" fill="#F4AF66" />
      <path d="M45 85V68H55V85" fill="#CE798B" />
      <path d="M17 85V68M83 85V68" stroke="#7DAF93" strokeWidth="5" />
    </g> : <g stroke="#A95B4F" strokeWidth="2" strokeLinejoin="round">
      <path d="M30 31H70V84H30Z" fill="#F6B96F" />
      {[25, 43, 61].map(y => <path key={y} d={`M19 ${y + 9}Q50 ${y - 10} 81 ${y + 9}L75 ${y + 14}H25Z`} fill="#D97B77" />)}
      <path d="M44 84V70Q50 64 56 70V84" fill="#FFF0BF" />
      <path d="M50 15V9" stroke="#B97B4A" strokeWidth="3" />
      <path d="M13 84V52M8 63 18 58M9 75 18 69M87 84V48M81 59 92 54M82 72 93 67" stroke="#73A98D" strokeWidth="4" />
    </g>}
  </svg>;
}
