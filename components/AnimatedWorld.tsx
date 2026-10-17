"use client";

import Image from "next/image";
import { useId } from "react";
import WorldLandmarks from "./WorldLandmarks";

const CLOUD_SRC = "/world/clouds.png";
const PLANE_SRC = "/world/aceairplane.png";

const MAP_WIDTH = 800;

function LandShapes() {
  return (
    <g
      fill="#8BD975"
      stroke="#76CC69"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* North America */}
      <path d="M35 82 L58 51 L92 35 L125 42 L146 63 L178 57 L198 83 L181 104 L159 111 L148 139 L123 149 L111 180 L88 160 L69 129 L42 119 Z" />

      {/* Alaska */}
      <path d="M31 82 L9 70 L2 49 L27 35 L51 43 L58 63 Z" />

      {/* Greenland */}
      <path d="M171 19 L198 7 L220 25 L213 55 L189 68 L173 48 Z" />

      {/* Central America */}
      <path d="M122 149 L143 161 L158 184 L174 193 L169 208 L151 197 L137 178 Z" />

      {/* South America */}
      <path d="M157 210 L192 190 L228 210 L244 247 L227 289 L208 322 L188 356 L171 334 L165 295 L148 258 Z" />

      {/* Europe */}
      <path d="M320 99 L342 81 L362 88 L378 76 L395 89 L386 109 L365 116 L350 131 L330 122 Z" />

      {/* Asia */}
      <path d="M383 85 L421 55 L466 49 L498 64 L536 44 L584 56 L628 77 L668 96 L682 122 L659 143 L631 139 L613 161 L582 155 L563 178 L534 157 L510 165 L482 143 L449 154 L425 130 L396 128 Z" />

      {/* Africa */}
      <path d="M349 150 L387 139 L420 161 L437 196 L422 238 L397 285 L372 304 L356 268 L345 225 L330 184 Z" />

      {/* Arabian Peninsula */}
      <path d="M438 181 L466 173 L483 195 L473 219 L448 212 Z" />

      {/* India */}
      <path d="M507 171 L534 181 L546 208 L530 239 L517 218 L501 194 Z" />

      {/* Southeast Asia */}
      <path d="M574 176 L598 183 L611 207 L602 228 L585 217 L578 198 Z" />

      {/* Japan */}
      <path d="M677 141 L683 149 L680 160 L674 153 Z" />
      <path d="M685 164 L691 171 L687 182 L681 176 Z" />

      {/* Philippines */}
      <path d="M644 202 L649 211 L645 220 L640 214 Z" />
      <path d="M652 227 L657 235 L652 244 L648 237 Z" />

      {/* Indonesia */}
      <path d="M585 252 L613 249 L622 257 L597 262 Z" />
      <path d="M629 260 L657 263 L665 272 L639 270 Z" />

      {/* Australia */}
      <path d="M626 285 L661 264 L703 278 L729 307 L712 341 L679 356 L642 343 L617 318 Z" />

      {/* New Zealand */}
      <path d="M748 333 L757 344 L753 357 L744 347 Z" />
      <path d="M760 362 L769 374 L762 386 L754 375 Z" />

      {/* Madagascar */}
      <path d="M443 283 L450 299 L445 320 L438 306 Z" />

      {/* Iceland */}
      <path d="M293 72 L305 68 L313 75 L302 82 Z" />

      {/* Islands */}
      <ellipse cx="256" cy="159" rx="7" ry="4" />
      <ellipse cx="273" cy="166" rx="5" ry="3" />
      <ellipse cx="711" cy="208" rx="6" ry="4" />
      <ellipse cx="730" cy="219" rx="4" ry="3" />

      {/* Antarctica */}
      <path d="M0 385 L65 374 L125 380 L190 371 L260 383 L330 375 L395 382 L465 372 L535 383 L600 374 L675 381 L740 372 L800 383 L800 400 L0 400 Z" />
    </g>
  );
}

const clouds = ["cloud-a", "cloud-b", "cloud-c"];

export default function AnimatedWorld() {
  const maskId = useId();

  return (
    <div
      className="ace-world-v6"
      role="img"
      aria-label="Ace flying in front of a moving world with country landmarks"
    >
      <div className="ace-world-v6-stage">
        {/* Landmarks sit behind the upper edge of Earth */}
        <WorldLandmarks />

        {/* Globe */}
        <div className="ace-world-v6-globe">
          <svg
            viewBox="0 0 400 400"
            className="h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={maskId}>
                <circle cx="200" cy="200" r="198" />
              </clipPath>
            </defs>

            {/* Flat blue ocean */}
            <circle
              cx="200"
              cy="200"
              r="198"
              fill="#72DFEC"
            />

            {/* Seamlessly moving continents */}
            <g clipPath={`url(#${maskId})`}>
              <g className="ace-world-v6-land">
                <g transform={`translate(${-MAP_WIDTH} 0)`}>
                  <LandShapes />
                </g>

                <LandShapes />

                <g transform={`translate(${MAP_WIDTH} 0)`}>
                  <LandShapes />
                </g>
              </g>
            </g>

            {/* Thin outline */}
            <circle
              cx="200"
              cy="200"
              r="197"
              fill="none"
              stroke="#5BCBDF"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Three clouds */}
        {clouds.map((cloud) => (
          <div
            key={cloud}
            className={`ace-world-v6-cloud ${cloud}`}
          >
            <Image
              src={CLOUD_SRC}
              alt=""
              fill
              sizes="(max-width: 640px) 110px, 150px"
              className="object-contain"
            />
          </div>
        ))}

        {/* Ace and airplane */}
        <div className="ace-world-v6-plane">
          <Image
            src={PLANE_SRC}
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 47vw, 256px"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
