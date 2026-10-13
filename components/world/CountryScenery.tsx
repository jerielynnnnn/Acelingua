import { useId } from "react";
import { languageLocations } from "@/lib/world/languageLocations";

const colors: Record<string, [string, string, string]> = {
  ja: ["#FCE4EE", "#9FAFDB", "#C47699"], ko: ["#E0EEFA", "#8EAEC5", "#6478A8"],
  zh: ["#F8EAD5", "#91AD9E", "#B3786A"], es: ["#FCE8CE", "#D5AA8B", "#AA725C"],
  fr: ["#EAE5FA", "#AAA8CD", "#706B99"], de: ["#DCEEE8", "#8EAEA7", "#637F85"],
  th: ["#DBF0EE", "#88B8AB", "#A88754"],
};
/** Project-owned illustrations: representative destination scenery, not a geographic map. */
export default function CountryScenery({ languageCode, className = "" }: { languageCode: string; className?: string }) {
  const id = useId().replaceAll(":", "");
  const [sky, hills, landmark] = colors[languageCode] ?? ["#EAF5FF", "#A9BED5", "#7894B6"];
  const country = languageLocations[languageCode]?.country ?? "Your language journey";
  return <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" className={className} role="img" aria-label={`Illustrated ${country} landscape`}>
    <defs><linearGradient id={id} x2="0" y2="1"><stop stopColor={sky} /><stop offset="1" stopColor="#F8FBFF" /></linearGradient></defs>
    <rect width="1200" height="400" fill={`url(#${id})`} /><circle cx="965" cy="90" r="43" fill="#FFF7E5" opacity=".95" />
    <g fill="white" opacity=".7"><ellipse cx="160" cy="90" rx="100" ry="14" /><ellipse cx="520" cy="65" rx="78" ry="12" /></g>
    <path d="M0 305 Q130 190 275 290 Q425 140 610 265 Q795 130 990 275 Q1110 225 1200 260 V400 H0Z" fill={hills} opacity=".32" />
    {languageCode === "ja" && <><path d="M100 320 365 100 590 320Z" fill={hills} /><path d="m365 100-72 60 43-7 25 16 23-17 54 15Z" fill="white" /><g fill={landmark}><path d="M730 172 Q870 200 1010 172 L1000 191 Q870 217 740 191Z" /><rect x="764" y="189" width="18" height="164" /><rect x="958" y="189" width="18" height="164" /><rect x="750" y="232" width="240" height="13" /></g><g fill="#E9ABC5"><circle cx="1070" cy="270" r="44" /><circle cx="1120" cy="253" r="35" /><circle cx="1098" cy="219" r="34" /></g><path d="M1095 270v105" stroke={landmark} strokeWidth="12" /></>}
    {languageCode === "ko" && <g fill={landmark}><rect x="650" y="270" width="310" height="90" /><path d="m625 270 90-55h160l105 55Z" /><path d="m692 215 54-44h87l62 44Z" /><rect x="1035" y="124" width="13" height="225" /><rect x="1016" y="130" width="52" height="28" /><path d="M1042 124V65" stroke={landmark} strokeWidth="5" />{[685,750,815,880].map(x => <rect key={x} x={x} y="298" width="30" height="62" fill={sky} />)}</g>}
    {languageCode === "zh" && <g fill={landmark}><rect x="798" y="208" width="130" height="152" />{[190,235,280].map((y,i) => <path key={y} d={`M${770-i*16} ${y+28} Q860 ${y-15} ${950+i*16} ${y+28}Z`} />)}<rect x="845" y="315" width="32" height="45" fill={sky} /><path d="M80 320q160-70 340-10t240-20" fill="none" stroke={landmark} strokeWidth="13" opacity=".6" /></g>}
    {languageCode === "fr" && <g stroke={landmark} strokeWidth="13" fill="none" strokeLinejoin="round"><path d="M875 72Q875 190 798 354M875 72q0 118 77 282M812 320h126M833 250h83M850 195h50M858 145h34M832 353q43-79 87 0" /><path d="m835 250 86 69m-4-69-105 70m40-123 63 52m-16-53-65 52" strokeWidth="5" />{[90,200,320,435,565].map((x,i) => <path key={x} d={`M${x} 365v-${60+i%3*20}h75v${60+i%3*20}`} strokeWidth="8" opacity=".4" />)}</g>}
    {languageCode === "de" && <g fill={landmark}><rect x="700" y="228" width="340" height="24" /><path d="m675 228 195-55 195 55Z" /><rect x="687" y="347" width="366" height="17" />{[715,775,835,895,955,1015].map(x => <rect key={x} x={x} y="252" width="20" height="97" />)}<path d="M260 350V230h55v-50l30-35 30 35v50h60v120" opacity=".5" /></g>}
    {languageCode === "es" && <g fill={landmark}><rect x="620" y="258" width="450" height="104" /><rect x="640" y="170" width="45" height="92" /><rect x="1000" y="170" width="45" height="92" /><path d="m630 170 32-36 32 36m296 0 32-36 32 36" />{[715,805,895].map(x => <path key={x} d={`M${x} 362v-40a30 30 0 0 1 60 0v40Z`} fill={sky} />)}<path d="M125 350V265h150v85" opacity=".45" /></g>}
    {languageCode === "th" && <g fill={landmark}><rect x="722" y="285" width="280" height="70" /><path d="m680 285 185-92 177 92Zm50-60 135-79 131 79Zm84-55 51-99 49 99Z" />{[735,855,975].map(x => <rect key={x} x={x} y="292" width="14" height="63" fill={sky} />)}<path d="M180 364q0-80 25-142" fill="none" stroke={landmark} strokeWidth="11" /><path d="M205 222q-80-60-112 6 65-25 108 1-18-82 58-75-41 24-43 68 74-34 106 30-52-25-117-30" /></g>}
    {!colors[languageCode] && <g fill={landmark}><rect x="800" y="245" width="170" height="115" /><path d="m780 245 105-75 105 75Z" /><rect x="865" y="295" width="40" height="65" fill={sky} /></g>}
    <path d="M0 365 Q250 330 490 372 T950 362 T1200 357V400H0Z" fill={hills} opacity=".55" /><path d="M0 390q350-30 600-8t600-5" stroke="white" strokeWidth="3" fill="none" opacity=".45" />
  </svg>;
}
