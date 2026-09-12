import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
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

export function SpotLinkCard({
  href,
  src,
  title,
  meta,
  egg,
  className,
  action,
}: {
  href: string;
  src: string;
  title: string;
  meta?: string;
  egg?: boolean;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-slab bg-milk">
      <Link
        href={href}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk"
      >
        <div className={cn("relative min-h-44 overflow-hidden", className)}>
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105"
          />
          {egg ? (
            <Egg
              size={44}
              className="absolute right-3 top-3 rotate-[8deg] drop-shadow-sticker"
            />
          ) : null}
        </div>
        <span className="block px-4 py-3">
          <span className="block font-display text-2xl tracking-wide text-berry">
            {title}
          </span>
          {meta ? (
            <span className="mt-1 block text-sm font-semibold text-berry/70">
              {meta}
            </span>
          ) : null}
        </span>
      </Link>
      {action ? <div className="px-4 pb-3">{action}</div> : null}
    </div>
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
      aria-current={active ? "true" : undefined}
      className={cn(
        "candy-key px-4 py-1.5 text-sm font-bold aria-current:bg-blush aria-current:text-white",
        CHIP_REST[tone],
      )}
    >
      {children}
    </Link>
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
        "flex items-center rounded-full border border-berry/12 bg-white p-0.5 text-sm font-bold",
        className,
      )}
    >
      {children}
    </div>
  );
}

const segmentKeyClass =
  "candy-key px-3.5 py-1.5 text-berry hover:bg-milk aria-current:bg-blush aria-current:text-white aria-current:hover:bg-blush";

export function FilterToggle({
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
      aria-pressed={active}
      className="candy-key gap-2 px-3.5 py-1.5 text-berry hover:bg-milk"
    >
      <span
        aria-hidden
        className="flex size-4 items-center justify-center rounded-[4px] border border-berry/30 bg-white"
      >
        {active ? <Check className="size-3 text-blush" strokeWidth={3} /> : null}
      </span>
      {children}
    </Link>
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
      className={segmentKeyClass}
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
      className={segmentKeyClass}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
