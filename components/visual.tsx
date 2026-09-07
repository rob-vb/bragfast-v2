import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type Tone = "candy" | "mint" | "yolk";
export type LogoSize = "header" | "hero";

const LOGO_SIZE: Record<LogoSize, string> = {
  header: "h-9 sm:h-10",
  hero: "h-[clamp(4.2rem,13vw,9.2rem)] drop-shadow-sticker",
};

const CHIP_REST: Record<Tone, string> = {
  candy: "bg-candy text-berry",
  mint: "bg-mint text-berry",
  yolk: "bg-yolk text-berry",
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

function Stamp({ children }: { children: ReactNode }) {
  return (
    <span className="absolute right-3 top-3 rotate-[8deg] rounded-full bg-candy px-2.5 py-1 text-xs font-extrabold text-berry shadow-stamp">
      {children}
    </span>
  );
}

export function SpotLinkCard({
  href,
  src,
  title,
  meta,
  rank,
  stamp,
  className,
}: {
  href: string;
  src: string;
  title: string;
  meta?: string;
  rank?: number;
  stamp?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block min-h-44 overflow-hidden rounded-slab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk",
        className,
      )}
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-berry/55 to-transparent" />
      {rank !== undefined ? <RankMark rank={rank} /> : null}
      {stamp ? <Stamp>{stamp}</Stamp> : null}
      <span className="absolute inset-x-0 bottom-0 p-5">
        <span className="text-shadow-photo block font-display text-2xl tracking-wide text-white">
          {title}
        </span>
        {meta ? (
          <span className="text-shadow-photo mt-1 block text-sm font-semibold text-white">
            {meta}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function RankMark({ rank }: { rank: number }) {
  return (
    <span className="absolute left-3 top-3 flex size-[4.35rem] -rotate-[12deg] items-center justify-center">
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 drop-shadow-burst"
        aria-hidden
      >
        <ellipse
          cx="32"
          cy="32"
          rx="26"
          ry="22"
          fill="var(--color-yolk)"
          stroke="var(--color-blush)"
          strokeWidth="3"
        />
        <circle cx="22" cy="38" r="3.2" fill="var(--color-blush)" />
        <circle cx="42" cy="38" r="3.2" fill="var(--color-blush)" />
      </svg>
      <span className="relative font-display text-xl text-berry">
        {String(rank).padStart(2, "0")}
      </span>
    </span>
  );
}

export function Chip({
  href,
  active,
  tone = "candy",
  children,
}: {
  href: string;
  active: boolean;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      data-active={active ? "true" : undefined}
      className={cn(
        "candy-key px-4 py-1.5 text-sm font-bold",
        active ? "bg-blush text-white" : CHIP_REST[tone],
      )}
    >
      {children}
    </Link>
  );
}

export function Segmented({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center rounded-full border border-berry/12 bg-white p-0.5 text-sm font-bold"
    >
      {children}
    </div>
  );
}

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
      className="candy-key px-3.5 py-1.5 aria-current:bg-blush aria-current:text-white"
    >
      {children}
    </Link>
  );
}

export function SegmentButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      className="candy-key px-3.5 py-1.5 aria-current:bg-blush aria-current:text-white"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
