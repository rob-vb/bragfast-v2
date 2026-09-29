import type { CSSProperties, ReactNode } from "react";
import { displayFit, displayWords } from "@/lib/display-fit";
import { cn } from "@/lib/utils";

const HEIGHT = {
  compact: "min-h-0",
  board: "min-h-[42svh]",
  city: "min-h-[52svh]",
  poster: "min-h-[46svh]",
  spot: "min-h-[58svh]",
} as const;

export function PageHero({
  children,
  size = "board",
  width = "wide",
  edge = "straight",
  backdrop,
  className,
}: {
  children: ReactNode;
  size?: keyof typeof HEIGHT;
  width?: "wide" | "narrow";
  edge?: "straight" | "scallop";
  backdrop?: ReactNode;
  className?: string;
}) {
  const height = HEIGHT[size];
  return (
    <section
      className={cn(
        "relative -mt-16 flex flex-col bg-berry sm:-mt-[4.5rem]",
        height,
        className,
      )}
    >
      {backdrop}
      <div
        className={cn(
          "@container relative mx-auto flex w-full flex-1 flex-col justify-end px-5 pb-10 pt-28 sm:px-8",
          height,
          width === "narrow" ? "max-w-3xl" : "max-w-6xl",
        )}
      >
        {children}
      </div>
      {edge === "scallop" ? (
        <div aria-hidden className="scallop-edge absolute inset-x-0 top-full" />
      ) : null}
    </section>
  );
}

export function PageHeroTitle({
  children,
  size = "md",
  onPhoto,
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  onPhoto?: boolean;
}) {
  return (
    <h1
      className={cn(
        "font-display tracking-wide text-white",
        onPhoto && "text-shadow-photo",
        size === "lg" && "text-[clamp(3rem,10vw,7rem)]",
        size === "md" && "text-[clamp(2.4rem,8vw,5.5rem)]",
        size === "sm" && "text-[clamp(2rem,6vw,3.5rem)]",
        // After the size: tailwind-merge drops a leading-* that precedes a text-*
        "leading-[0.92]",
      )}
    >
      {children}
    </h1>
  );
}

const POSTER_TRACKING = 0.012;

/**
 * A name set edge to edge. On a woonplaats the letters land one by one like
 * stickers pressed onto the slab; the heading's name is the plain text. A
 * spot sets its name in the column beside its print, and the print is the
 * page's moment, so its letters stay put. A passport sets the username the
 * same way, behind a blush @, beside its stamps.
 */
export function PageHeroPoster({
  children,
  fit: measure = "city",
}: {
  children: string;
  fit?: "city" | "spot" | "handle";
}) {
  const handle = measure === "handle";
  const fit = displayFit(handle ? `@${children}` : children, POSTER_TRACKING);
  const words = displayWords(children);
  const land = measure === "city";
  let index = 0;
  return (
    <h1
      aria-label={children}
      className={cn(
        "poster-title font-display text-white",
        measure !== "city" && "poster-title--spot",
      )}
      style={
        {
          "--fit-line": fit.line,
          "--fit-word": fit.word,
          "--fit-pair": fit.pair,
          letterSpacing: `${POSTER_TRACKING}em`,
        } as CSSProperties
      }
    >
      {words.map((word, w) => (
        <span key={w}>
          {w === 0 ? null : words[w - 1].endsWith("-") ? <wbr /> : " "}
          <span className="inline-block whitespace-nowrap">
            {handle && w === 0 ? <span className="text-blush">@</span> : null}
            {land
              ? [...word].map((letter) => {
                  const i = index++;
                  return (
                    <span
                      key={i}
                      className="poster-letter"
                      style={{ "--i": i, "--tilt": i % 2 ? 7 : -9 } as CSSProperties}
                    >
                      {letter}
                    </span>
                  );
                })
              : word}
          </span>
        </span>
      ))}
    </h1>
  );
}

export function PageHeroLead({
  children,
  onPhoto,
  className,
}: {
  children: ReactNode;
  onPhoto?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-3 text-lg text-white",
        onPhoto && "text-shadow-photo",
        className,
      )}
    >
      {children}
    </p>
  );
}
