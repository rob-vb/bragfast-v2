"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True once the element has been at least `threshold` in view. It stays
 * true after that: a poster's moment plays once.
 */
export function useSeen(ref: RefObject<Element | null>, threshold = 0.35) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return seen;
}

/**
 * Holds a poster's animations on their first frame while it is off-screen
 * and plays them when it arrives. A stage already on screen when the page
 * wakes up stays as rendered, so nothing jumps back to replay.
 */
export function Stage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<"armed" | "live" | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) {
      return;
    }
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      return;
    }
    setStage("armed");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStage("live");
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-stage={stage ?? undefined} className={cn(className)}>
      {children}
    </div>
  );
}
