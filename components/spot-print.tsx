import type { CSSProperties } from "react";
import Link from "next/link";
import type { UserSlug } from "@/domain/ids";
import { shortDate, t, type Locale } from "@/domain/messages";
import { photoSrc } from "@/lib/photo-src";
import { cn } from "@/lib/utils";

/**
 * The adder's photo as a print pressed onto the spot slab: a white slab
 * holding the photo, its lip captioned with who found the place and when.
 */
export function SpotPrint({
  locale,
  src,
  alt,
  adderSlug,
  addedAt,
  closed,
  className,
}: {
  locale: Locale;
  src: string;
  alt: string;
  adderSlug: UserSlug | null;
  addedAt: number;
  closed: boolean;
  className?: string;
}) {
  return (
    <figure className={cn("brag-print", closed && "is-closed", className)}>
      <div className="brag-print__photo">
        <img
          {...photoSrc(src, "(min-width: 72rem) 27rem, (min-width: 64rem) 40vw, (min-width: 40rem) 80vw, 100vw")}
          alt={alt}
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <figcaption className="flex items-end justify-between gap-4 px-3 pt-3 pb-3.5 sm:px-3.5">
        {adderSlug ? (
          <span className="min-w-0">
            <span className="block text-xs font-bold text-berry/70">
              {t(locale, "discoveredBy")}
            </span>
            <Link
              href={`/u/${adderSlug}`}
              className="block truncate rounded-full font-display text-xl leading-tight tracking-wide text-berry transition-colors duration-press ease-out-strong pointer-fine:hover:text-blush sm:text-2xl"
            >
              <span className="text-blush">@</span>
              {adderSlug}
            </Link>
          </span>
        ) : (
          <span className="font-display text-xl tracking-wide text-blush sm:text-2xl">
            #bragfast
          </span>
        )}
        {addedAt > 0 ? (
          <time
            dateTime={new Date(addedAt).toISOString()}
            className="shrink-0 pb-1 text-xs font-bold text-berry/70 tabular-nums"
          >
            {shortDate(locale, addedAt)}
          </time>
        ) : null}
      </figcaption>
    </figure>
  );
}

/** The print's own light, thrown softly across the berry slab. */
export function PrintGlow({
  src,
  at,
}: {
  src: string;
  /** Where the light pools, when the print does not hang on the right. */
  at?: string;
}) {
  return (
    <div
      aria-hidden
      className="print-glow"
      style={at ? ({ "--glow-at": at } as CSSProperties) : undefined}
    >
      {/* Blurred past recognition, so a thumbnail is plenty */}
      <img
        {...photoSrc(src, "8rem")}
        alt=""
        decoding="async"
      />
    </div>
  );
}
