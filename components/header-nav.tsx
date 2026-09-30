"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type HeaderNavLink = { href: string; label: string };

/**
 * The header's page links. One white pill rests on the current page and
 * glides to whichever link the mouse is over, so the bar says where you are
 * and where you would go with the same object.
 */
export function HeaderNav({
  label,
  links,
  className,
}: {
  label: string;
  links: readonly HeaderNavLink[];
  className?: string;
}) {
  const pathname = usePathname();
  const pillRef = useRef<HTMLSpanElement>(null);
  const [pointed, setPointed] = useState<string | null>(null);
  const current = links.some((link) => link.href === pathname) ? pathname : null;
  const target = pointed ?? current;

  useLayoutEffect(() => {
    const pill = pillRef.current;
    const track = pill?.parentElement;
    if (!pill || !track) {
      return;
    }

    function place(pill: HTMLSpanElement, track: HTMLElement) {
      const link = target
        ? track.querySelector<HTMLElement>(`[data-href="${target}"]`)
        : null;
      if (!link) {
        delete pill.dataset.shown;
        return;
      }
      // From nowhere the pill appears where it is needed instead of sliding
      // over from wherever it last faded out
      const arriving = !("shown" in pill.dataset);
      if (arriving) {
        pill.dataset.snap = "";
      }
      pill.style.width = `${link.offsetWidth}px`;
      pill.style.translate = `${link.offsetLeft}px 0`;
      if (arriving) {
        void pill.offsetWidth;
        delete pill.dataset.snap;
      }
      pill.dataset.shown = "";
    }

    place(pill, track);
    // Nunito arriving late changes every label's width
    const observer = new ResizeObserver(() => place(pill, track));
    observer.observe(track);
    return () => observer.disconnect();
  }, [target]);

  return (
    <nav aria-label={label} className={cn("header-nav relative", className)}>
      <span
        ref={pillRef}
        aria-hidden
        className="nav-pill pointer-events-none absolute inset-y-0 left-0 rounded-full bg-white"
      />
      <ul className="flex items-center" onPointerLeave={() => setPointed(null)}>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              data-href={link.href}
              aria-current={link.href === current ? "page" : undefined}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") {
                  setPointed(link.href);
                }
              }}
              className="relative inline-flex h-10 items-center rounded-full px-3.5 text-sm font-bold whitespace-nowrap text-berry/70 transition-[color,scale] duration-press ease-out-strong active:scale-[0.97] aria-[current=page]:text-berry pointer-fine:hover:text-berry"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
