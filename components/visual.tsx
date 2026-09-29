import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type LogoSize = "header" | "hero";

const LOGO_SIZE: Record<LogoSize, string> = {
  header: "h-9 sm:h-10",
  hero: "h-[clamp(4.2rem,13vw,9.2rem)] drop-shadow-sticker",
};

export function Logo({
  size,
  className,
}: {
  size: LogoSize;
  className?: string;
}) {
  return (
    <img
      src="/brag_fast_logo.svg"
      alt="brag.fast"
      className={cn("w-auto object-contain object-left", LOGO_SIZE[size], className)}
    />
  );
}

export function Egg({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <img
      src="/brag_fast_egg.svg"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}

export function PhotoFrame({
  src,
  alt = "",
  className,
  ken,
  children,
}: {
  src: string;
  alt?: string;
  className?: string;
  ken?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          ken && "hero-ken",
        )}
      />
      {children}
    </div>
  );
}

/**
 * A milk slab holding a photo print. The whole slab is the link (a stretched
 * ::after), so the action can sit beside the name without nesting controls.
 */
export function SpotLinkCard({
  href,
  src,
  title,
  meta,
  className,
  action,
  featured,
  eager,
  muted,
  heading: Heading = "h3",
}: {
  href: string;
  src: string;
  title: string;
  meta?: string;
  /** Classes for the photo well, e.g. its aspect ratio. */
  className?: string;
  action?: ReactNode;
  featured?: boolean;
  /** Above-the-fold prints skip lazy loading. */
  eager?: boolean;
  /** A closed spot's print fades toward grey, as on its own page. */
  muted?: boolean;
  heading?: "h2" | "h3";
}) {
  return (
    <article
      className={cn(
        "group/card relative flex h-full flex-col rounded-slab bg-milk p-2",
        "transition-[translate,scale,box-shadow] duration-300 ease-out-strong has-[a:active]:scale-[0.985]",
        "pointer-fine:hover:-translate-y-1 pointer-fine:hover:shadow-lift",
      )}
    >
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-candy/40",
          className,
        )}
      >
        <img
          src={src}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-strong pointer-fine:group-hover/card:scale-[1.045]",
            muted && "grayscale-90",
          )}
        />
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-berry/10 ring-inset" />
      </div>
      <div
        className={cn(
          "flex items-center gap-3 px-3 pt-3.5 pb-2",
          featured && "sm:px-4 sm:pt-4 sm:pb-3",
        )}
      >
        <div className="min-w-0 flex-1">
          <Heading
            className={cn(
              "font-display leading-[1.08] tracking-wide text-balance text-berry",
              featured ? "text-2xl sm:text-3xl lg:text-4xl" : "text-2xl",
            )}
          >
            <Link
              href={href}
              className="focus-visible:outline-none! after:absolute after:inset-0 after:rounded-slab after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-yolk"
            >
              {title}
            </Link>
          </Heading>
          {meta ? (
            <p className="mt-1 truncate text-sm font-semibold text-berry/70">
              {meta}
            </p>
          ) : null}
        </div>
        {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
      </div>
    </article>
  );
}

export function Segmented({
  label,
  labelledBy,
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
} & (
  | { label: string; labelledBy?: undefined }
  | { label?: undefined; labelledBy: string }
)) {
  return (
    <div
      role="group"
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cn(
        "flex w-fit items-center rounded-full border border-berry/12 bg-white p-0.5 text-sm font-bold",
        className,
      )}
    >
      {children}
    </div>
  );
}

const segmentKeyClass =
  "candy-key gap-1.5 px-3.5 py-2 text-berry transition-[color,background-color,transform] duration-press ease-out-strong pointer-fine:hover:bg-milk active:scale-[0.97] aria-current:bg-blush aria-current:text-white pointer-fine:aria-current:hover:bg-blush";

export function SegmentLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={segmentKeyClass}
    >
      {children}
    </Link>
  );
}
