import type { CSSProperties } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { AdderRow } from "@/domain/leaderboard";
import {
  likeCountLabel,
  t,
  uniqueSpotsLabel,
  type Locale,
} from "@/domain/messages";
import { Egg } from "@/components/visual";
import { displayFit } from "@/lib/display-fit";
import { cn } from "@/lib/utils";

// Second stands left of first, third right. The steps rise out of the slab's
// floor third first, so first arrives last.
const STEPS = [
  { place: 1, column: "col-start-2", height: "h-36 sm:h-56 lg:h-64", ink: "bg-yolk", rise: 420 },
  { place: 2, column: "col-start-1", height: "h-24 sm:h-40 lg:h-44", ink: "bg-candy", rise: 270 },
  { place: 3, column: "col-start-3", height: "h-16 sm:h-28 lg:h-32", ink: "bg-mint", rise: 120 },
] as const;

/**
 * The top three adders on a podium standing on the berry slab's floor. A
 * place nobody holds yet is an open dashed step.
 */
export function Podium({
  locale,
  adders,
  label,
}: {
  locale: Locale;
  adders: readonly AdderRow[];
  label: string;
}) {
  return (
    <ol aria-label={label} className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      {STEPS.map((step) => {
        const adder = adders[step.place - 1];
        return (
          <li
            key={step.place}
            className={cn("group/step @container relative row-start-1 min-w-0", step.column)}
          >
            <div
              className="podium-rise flex flex-col items-center"
              style={{ "--rise": `${step.rise}ms` } as CSSProperties}
            >
              {adder ? (
                <div className="flex w-full min-w-0 flex-col items-center px-1 pb-3 text-center sm:pb-4">
                  {step.place === 1 ? (
                    <Egg
                      size={60}
                      className="podium-egg mb-1.5 size-11 -rotate-8 drop-shadow-sticker sm:size-15"
                    />
                  ) : null}
                  <Link
                    href={`/nl/u/${adder.username}`}
                    style={
                      {
                        "--fit-word": displayFit(`@${adder.username}`, 0.025).word,
                      } as CSSProperties
                    }
                    className="podium-name line-clamp-3 max-w-full font-display leading-tight tracking-wide text-balance wrap-break-word text-white transition-colors duration-press ease-out-strong focus-visible:outline-none! after:absolute after:inset-0 after:rounded-t-slab after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-yolk pointer-fine:group-hover/step:text-milk"
                  >
                    <span className="text-blush">@</span>
                    {adder.username}
                  </Link>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-milk tabular-nums sm:text-sm">
                    <Heart
                      aria-hidden
                      className="size-3.5 fill-candy text-candy"
                      strokeWidth={2.5}
                    />
                    {likeCountLabel(locale, adder.likeSum)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-milk/70 tabular-nums">
                    {uniqueSpotsLabel(locale, adder.spotCount)}
                  </p>
                </div>
              ) : (
                <p className="pb-3 text-xs font-bold text-milk/60 sm:pb-4 sm:text-sm">
                  {t(locale, "podiumOpen")}
                </p>
              )}
              <div
                className={cn(
                  "flex w-full justify-center rounded-t-slab pt-2 sm:pt-4",
                  step.height,
                  adder
                    ? cn(step.ink, "shadow-[inset_0_3px_0_rgb(255_255_255/0.45)]")
                    : "border-2 border-b-0 border-dashed border-white/22",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "font-display text-5xl leading-none tabular-nums sm:text-7xl",
                    "transition-[rotate,translate] duration-300 ease-out-strong",
                    adder
                      ? "text-berry pointer-fine:group-hover/step:-translate-y-1 pointer-fine:group-hover/step:-rotate-6"
                      : "text-white/25",
                  )}
                >
                  {step.place}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
