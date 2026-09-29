import type { CSSProperties } from "react";
import Link from "next/link";
import {
  cityNoun,
  shortDate,
  spotNoun,
  t,
  uniqueSpotsLabel,
  type Locale,
} from "@/domain/messages";
import { displayFit } from "@/lib/display-fit";
import { cn } from "@/lib/utils";

export type CityStamp = {
  citySlug: string;
  name: string;
  count: number;
  firstAt: number;
};

const INKS = ["text-yolk", "text-mint", "text-candy", "text-milk", "text-blush"];
const TILTS = [-9, 8, -3, 12, -12, 5];
/** Past this many woonplaatsen the last stamp counts the rest. */
const MAX_STAMPS = 6;

// A stamp is 200 units across. The name runs 240° over the top and the date
// 120° along the bottom, both centred on one 75-unit radius, with a dot where
// they meet. The count sits inside the inner ring.
const ARC_START = { x: 35.05, y: 137.5 };
const ARC_END = { x: 164.95, y: 137.5 };
const TOP_ARC = `M ${ARC_START.x} ${ARC_START.y} A 75 75 0 1 1 ${ARC_END.x} ${ARC_END.y}`;
const BOTTOM_ARC = `M ${ARC_START.x} ${ARC_START.y} A 75 75 0 0 0 ${ARC_END.x} ${ARC_END.y}`;
/** The top arc is 314 units; this leaves clear ink round the dots. */
const TOP_ROOM = 268;
const TOP_TRACKING = 0.06;

/**
 * The adder's woonplaatsen as rubber stamps pressed onto the passport slab,
 * one after another in the order they were first bragged. Each stamp opens
 * that board.
 */
export function PassportStamps({
  locale,
  stamps,
}: {
  locale: Locale;
  stamps: readonly CityStamp[];
}) {
  const overflow = stamps.length > MAX_STAMPS;
  const shown = overflow ? stamps.slice(0, MAX_STAMPS - 1) : stamps;
  const rest = stamps.length - shown.length;
  const slot = (i: number) =>
    ({ "--i": i, "--tilt": `${TILTS[i % TILTS.length]}deg` }) as CSSProperties;

  return (
    <>
      <StampDefs />
      <ul
        aria-label={t(locale, "passportCities")}
        className={cn("stamp-sheet", stamps.length > 2 && "stamp-sheet--full")}
      >
        {shown.map((stamp, i) => (
          <li key={stamp.citySlug} className="stamp-slot" style={slot(i)}>
            <Link
              href={`/nl/${stamp.citySlug}`}
              aria-label={`${stamp.name}, ${uniqueSpotsLabel(locale, stamp.count)}`}
              className={cn("stamp", INKS[i % INKS.length])}
            >
              <StampFace
                top={stamp.name.toUpperCase()}
                count={String(stamp.count)}
                noun={spotNoun(locale, stamp.count)}
                bottom={shortDate(locale, stamp.firstAt)}
              />
            </Link>
          </li>
        ))}
        {rest > 0 ? (
          <li className="stamp-slot" style={slot(shown.length)}>
            <span
              role="img"
              aria-label={`+${rest} ${cityNoun(locale, rest)}`}
              className={cn("stamp", INKS[shown.length % INKS.length])}
            >
              <StampFace
                top="#bragfast"
                count={`+${rest}`}
                noun={cityNoun(locale, rest)}
                bottom="brag.fast"
              />
            </span>
          </li>
        ) : null}
      </ul>
    </>
  );
}

function StampFace({
  top,
  count,
  noun,
  bottom,
}: {
  top: string;
  count: string;
  noun: string;
  bottom: string;
}) {
  const topSize = Math.min(26, TOP_ROOM / displayFit(top, TOP_TRACKING).line);
  return (
    <svg viewBox="0 0 200 200" aria-hidden className="block size-full overflow-visible">
      <g filter="url(#stamp-ink)" fill="currentColor">
        <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx={ARC_START.x} cy={ARC_START.y} r="3.5" />
        <circle cx={ARC_END.x} cy={ARC_END.y} r="3.5" />
        <text
          className="font-display"
          fontSize={topSize}
          letterSpacing={`${TOP_TRACKING}em`}
          dominantBaseline="central"
        >
          <textPath href="#stamp-arc-top" startOffset="50%" textAnchor="middle">
            {top}
          </textPath>
        </text>
        <text
          fontSize="12.5"
          fontWeight="800"
          letterSpacing="0.14em"
          dominantBaseline="central"
        >
          <textPath href="#stamp-arc-bottom" startOffset="50%" textAnchor="middle">
            {bottom.toUpperCase()}
          </textPath>
        </text>
        <text
          x="100"
          y="94"
          className="font-display"
          fontSize={count.length > 2 ? 42 : 58}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {count}
        </text>
        <text
          x="100"
          y="131"
          fontSize="11"
          fontWeight="800"
          letterSpacing="0.16em"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {noun.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}

/**
 * The arcs the stamp text runs along, and the ink: grain that knocks specks
 * out of the fill, then a faint warp so no edge is machine-true.
 */
function StampDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <path id="stamp-arc-top" d={TOP_ARC} />
        <path id="stamp-arc-bottom" d={BOTTOM_ARC} />
        <filter id="stamp-ink" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.55"
            numOctaves="2"
            seed="11"
            result="grain"
          />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -14 10"
            result="specks"
          />
          <feComposite in="SourceGraphic" in2="specks" operator="in" result="inked" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045"
            numOctaves="2"
            seed="4"
            result="warp"
          />
          <feDisplacementMap
            in="inked"
            in2="warp"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
