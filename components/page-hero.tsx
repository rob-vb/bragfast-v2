import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const HEIGHT = {
  compact: "min-h-0",
  board: "min-h-[42svh]",
  city: "min-h-[52svh]",
  spot: "min-h-[58svh]",
} as const;

export function PageHero({
  children,
  size = "board",
  width = "wide",
  backdrop,
  className,
}: {
  children: ReactNode;
  size?: keyof typeof HEIGHT;
  width?: "wide" | "narrow";
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
          "relative mx-auto flex w-full flex-1 flex-col justify-end px-5 pb-10 pt-28 sm:px-8",
          height,
          width === "narrow" ? "max-w-3xl" : "max-w-6xl",
        )}
      >
        {children}
      </div>
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
        "font-display leading-[0.92] tracking-wide text-white",
        onPhoto && "text-shadow-photo",
        size === "lg" && "text-[clamp(3rem,10vw,7rem)]",
        size === "md" && "text-[clamp(2.4rem,8vw,5.5rem)]",
        size === "sm" && "text-[clamp(2rem,6vw,3.5rem)]",
      )}
    >
      {children}
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
