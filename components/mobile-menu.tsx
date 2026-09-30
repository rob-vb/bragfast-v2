"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Preloaded } from "convex/react";
import { Drawer } from "@base-ui/react/drawer";
import { ArrowRight, Menu as MenuGlyph, X } from "lucide-react";
import type { api } from "@/convex/_generated/api";
import { chromeLinks } from "@/domain/chrome";
import { t, type Locale } from "@/domain/messages";
import { authClient } from "@/lib/auth-client";
import { requestSignIn } from "@/lib/sign-in-signal";
import { useUsername } from "@/components/auth-control";
import { LanguageSwitch } from "@/components/language-switch";
import { Button, buttonVariants } from "@/components/ui/button";
import { Egg } from "@/components/visual";
import { cn } from "@/lib/utils";

/**
 * The phone header: one Menu pill that raises a sheet holding every page,
 * the account and the language. The header's AuthControl stays mounted
 * (hidden) and still owns the sign-in dialog, so the sheet asks it to open
 * once the sheet is out of the way.
 */
export function MobileMenu({
  locale,
  preloadedUser,
  passportSlug,
  isOwner,
  className,
}: {
  locale: Locale;
  preloadedUser: Preloaded<typeof api.auth.getCurrentUser>;
  passportSlug: string | null;
  isOwner: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const username = useUsername(preloadedUser);
  const signInNext = useRef(false);

  // Back or forward while the sheet is up lands on a page without it
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  const links = [
    ...chromeLinks("menu").map((link) => ({
      href: link.href,
      label: t(locale, link.label),
    })),
    ...(isOwner ? [{ href: "/admin", label: t(locale, "viewAdmin") }] : []),
  ];

  async function signOut() {
    setOpen(false);
    await authClient.signOut();
    router.refresh();
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen && signInNext.current) {
          signInNext.current = false;
          requestSignIn();
        }
      }}
    >
      <Drawer.Trigger
        className={cn(
          "relative inline-flex h-10 items-center gap-2 rounded-full border border-berry/12 bg-white pr-4 pl-3 text-sm font-bold text-berry",
          "transition-[color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:text-blush",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk",
          "after:absolute after:-inset-1 after:content-['']",
          className,
        )}
      >
        <MenuGlyph aria-hidden className="size-5" strokeWidth={2.5} />
        {t(locale, "menu")}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop
          data-slot="drawer-backdrop"
          className="fixed inset-0 z-50 min-h-dvh bg-berry/45 opacity-[calc(1-var(--drawer-swipe-progress,0))] backdrop-blur-sm transition-opacity duration-modal ease-drawer data-starting-style:opacity-0 data-ending-style:opacity-0 data-swiping:duration-0"
        />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Drawer.Popup
            data-slot="drawer-popup"
            className={cn(
              "relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-slab bg-white px-3 pt-2.5 pb-3 text-berry shadow-lift outline-none",
              "[transform:translateY(var(--drawer-swipe-movement-y,0px))] transition-transform duration-modal ease-drawer",
              "data-swiping:select-none data-swiping:duration-0",
              "data-starting-style:[transform:translateY(calc(100%+1rem))] data-ending-style:[transform:translateY(calc(100%+1rem))]",
              "data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*300ms)]",
            )}
          >
            <div aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-berry/15" />
            <Drawer.Content>
              <div className="flex items-center gap-3 pt-3 pr-1 pb-4 pl-3">
                <Egg size={44} className="menu-egg size-11 -rotate-8 drop-shadow-sticker" />
                <Drawer.Title className="font-display text-3xl tracking-wide">
                  {t(locale, "menu")}
                </Drawer.Title>
                <Drawer.Close
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t(locale, "close")}
                      className="ml-auto size-11"
                    />
                  }
                >
                  <X className="size-5" />
                </Drawer.Close>
              </div>

              <nav aria-label={t(locale, "menu")}>
                <ul className="grid gap-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={pathname === link.href ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group/row flex h-16 items-center justify-between gap-4 rounded-full bg-milk pr-2 pl-6 font-display text-2xl tracking-wide text-berry",
                          "transition-[background-color,color,transform] duration-press ease-out-strong active:scale-[0.98] pointer-fine:hover:bg-candy/45",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk",
                          "aria-[current=page]:bg-yolk pointer-fine:aria-[current=page]:hover:bg-yolk",
                        )}
                      >
                        <span className="min-w-0 truncate">{link.label}</span>
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-blush transition-transform duration-press ease-out-strong pointer-fine:group-hover/row:translate-x-0.5">
                          <ArrowRight aria-hidden className="size-5" strokeWidth={2.75} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-3 grid gap-3 rounded-field bg-shell p-3">
                {username ? (
                  <div className="flex flex-wrap items-center gap-2 pl-2">
                    <p className="mr-auto min-w-0 truncate font-display text-2xl tracking-wide">
                      <span className="text-blush">@</span>
                      {username}
                    </p>
                    {passportSlug ? (
                      <Link
                        href={`/u/${passportSlug}`}
                        onClick={() => setOpen(false)}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        {t(locale, "viewPassport")}
                      </Link>
                    ) : null}
                    <Button type="button" variant="ghost" onClick={() => void signOut()}>
                      {t(locale, "signOut")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      signInNext.current = true;
                      setOpen(false);
                    }}
                  >
                    {t(locale, "signIn")}
                  </Button>
                )}
                <div className="flex items-center justify-between gap-4 pl-2">
                  <span className="text-sm font-bold text-berry/70">
                    {t(locale, "language")}
                  </span>
                  <LanguageSwitch locale={locale} label={t(locale, "language")} />
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
