"use client";

import { languageLocations, mapPosition } from "@/lib/world/languageLocations";
import type { WorldLanguage } from "@/lib/world/data";
import styles from "./World.module.css";

type Props = { languages: WorldLanguage[]; selectedId: string | null; onSelect: (language: WorldLanguage) => void };

/** Original simplified equirectangular illustration; replace the SVG backdrop
 * with a 1000×500 asset using the same projection without changing markers. */
export default function WorldMap({ languages, selectedId, onSelect }: Props) {
  return <div className={styles.mapScroll} tabIndex={0} aria-label="World map. Scroll horizontally on smaller screens.">
    <div className={styles.mapCanvas}>
      <svg viewBox="0 0 1000 500" className={styles.mapArt} role="img" aria-label="Stylized world map with approximate continent outlines">
        <defs>
          <pattern id="world-grid" width="100" height="83.333" patternUnits="userSpaceOnUse"><path d="M100 0H0V83.333" fill="none" stroke="#fff" strokeOpacity=".3" /></pattern>
        </defs>
        <rect width="1000" height="500" rx="28" fill="#DDEFF8" />
        <rect width="1000" height="500" fill="url(#world-grid)" />
        <g fill="#FAFCFF" stroke="#B3C8DB" strokeWidth="2" strokeLinejoin="round">
          <path d="M65 95L105 65 180 60 220 85 270 85 325 115 315 145 285 170 270 200 240 212 215 230 225 250 260 264 282 292 268 305 245 277 212 260 185 215 140 185 112 153 72 145Z" />
          <path d="M280 278L320 270 357 292 385 315 375 350 348 380 328 425 300 465 288 442 292 392 275 365 270 323Z" />
          <path d="M350 52L395 40 425 65 409 109 377 121 355 88Z" />
          <path d="M455 119L483 104 500 78 517 87 518 124 535 128 550 150 545 165 511 173 496 164 475 180 457 169 473 144Z" />
          <path d="M470 180L513 175 555 193 575 227 560 265 577 293 550 344 526 385 501 359 490 315 465 284 452 243 443 210Z" />
          <path d="M529 132L548 86 591 70 630 78 668 67 728 72 773 63 843 76 905 106 950 103 935 136 893 151 870 177 872 205 845 212 820 245 799 267 783 245 756 231 745 210 723 217 708 258 683 241 671 210 638 185 601 195 575 169 546 170Z" />
          <path d="M883 178L897 184 894 211 882 223 875 214Z" />
          <path d="M805 270L820 285 838 278 850 301 834 313 821 299 803 299 786 283Z" />
          <path d="M795 344L832 328 865 334 886 354 915 365 921 398 888 420 855 416 828 400 798 398 782 371Z" />
          <path d="M945 415L956 401 964 407 954 434 940 452 932 447Z" />
          <path d="M560 348L566 361 557 388 549 379Z" />
        </g>
        <g fill="#7595B1" fontSize="13" fontFamily="sans-serif" letterSpacing="3" opacity=".7">
          <text x="115" y="340">PACIFIC OCEAN</text><text x="360" y="245" transform="rotate(-12 360 245)">ATLANTIC</text><text x="635" y="345">INDIAN OCEAN</text>
        </g>
        <path d="M180 335Q440 60 840 168" fill="none" stroke="#C7A9D4" strokeWidth="2" strokeDasharray="5 8" opacity=".6" />
        {languages.map(language => {
          const location = languageLocations[language.code];
          if (!location) return null;
          const p = mapPosition(location);
          return <line key={language.id} x1={p.x * 10} y1={p.y * 5} x2={p.x * 10 + location.markerOffset[0]} y2={p.y * 5 + location.markerOffset[1]} stroke="#3558AE" strokeOpacity=".55" strokeWidth="1.5" />;
        })}
      </svg>
      {languages.map(language => {
        const location = languageLocations[language.code];
        if (!location) return null;
        const p = mapPosition(location);
        return <button key={language.id} type="button" aria-label={`Explore ${location.country} — ${language.name}`} aria-pressed={selectedId === language.id}
          title={`${location.country} · ${language.name}`} onClick={() => onSelect(language)}
          className={`${styles.marker} ${selectedId === language.id ? styles.selected : ""}`}
          style={{ left: `${p.x + location.markerOffset[0] / 10}%`, top: `${p.y + location.markerOffset[1] / 5}%` }}>
          <span aria-hidden="true">{language.flag_emoji || location.country.slice(0, 2).toUpperCase()}</span>
          <span className={styles.markerLabel}>{language.name}</span>
        </button>;
      })}
      <span className={styles.mapCaption}>A world of words awaits</span>
    </div>
  </div>;
}
