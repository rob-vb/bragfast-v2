"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const chromeLinkClass =
  "inline-flex items-center rounded-full px-2 py-1 text-sm font-bold whitespace-nowrap text-berry transition-[color,transform] duration-press ease-out-strong pointer-fine:hover:text-blush active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk aria-[current=page]:text-blush";

export const footerLinkClass =
  "inline-flex items-center rounded-full px-1 py-0.5 text-sm font-bold text-berry transition-[color,transform] duration-press ease-out-strong pointer-fine:hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk aria-[current=page]:text-white";

export function ChromeNavLink({
  href,
  children,
  className,
  hiddenOnMobile,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  hiddenOnMobile?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        chromeLinkClass,
        hiddenOnMobile && "hidden sm:inline-flex",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function FooterNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={footerLinkClass}
    >
      {children}
    </Link>
  );
}
