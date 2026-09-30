"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The header is a milk band across the top of the page. Once the page
 * scrolls, the milk lifts off into a pill on the content column and the page
 * shows around it. A sentinel at the top of the document says when, so no
 * scroll listener runs.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setLifted(!entry.isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-10"
      />
      <header
        data-lifted={lifted ? "" : undefined}
        className="site-header sticky top-0 z-30 h-16 text-berry sm:h-[4.5rem]"
      >
        <div aria-hidden className="header-milk" />
        {children}
      </header>
    </>
  );
}
