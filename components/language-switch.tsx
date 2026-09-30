"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/domain/messages";
import { LOCALE_FLAGS } from "@/domain/chrome";

const FLAG_MARK = {
  nl: FlagNl,
  en: FlagGb,
} as const;

/**
 * "tray" is the Menu sheet's switch. "bar" is the header's: a 40px tray to
 * match the row, with each flag cut to a coin so the pressed one sits in the
 * blush key like a sticker instead of a rectangle on a disc.
 */
export function LanguageSwitch({
  locale,
  label,
  variant = "tray",
}: {
  locale: Locale;
  label: string;
  variant?: "tray" | "bar";
}) {
  const router = useRouter();

  async function choose(nextLocale: Locale) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={
        variant === "bar"
          ? "flex h-10 items-center gap-0.5 rounded-full border border-berry/12 bg-white p-[3px]"
          : "flex items-center rounded-full border border-berry/12 bg-white p-0.5"
      }
    >
      {LOCALE_FLAGS.map((option) => {
        const Flag = FLAG_MARK[option.locale];
        return (
          <button
            key={option.locale}
            type="button"
            aria-label={option.autonym}
            aria-pressed={locale === option.locale}
            className={
              variant === "bar"
                ? "group/flag flex size-8 items-center justify-center rounded-full transition-[background-color,scale] duration-press ease-out-strong active:scale-[0.94] pointer-fine:hover:bg-milk aria-pressed:bg-blush pointer-fine:aria-pressed:hover:bg-blush"
                : "flex size-8 items-center justify-center rounded-full transition-[background-color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:bg-milk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk aria-pressed:bg-blush pointer-fine:aria-pressed:hover:bg-blush"
            }
            onClick={() => choose(option.locale)}
          >
            <Flag coin={variant === "bar"} />
          </button>
        );
      })}
    </div>
  );
}

/** The pressed coin takes a white die-cut, a sticker on the blush key. */
const COIN_CLASS =
  "size-5 overflow-hidden rounded-full shadow-[0_0_0_1px_rgb(74_21_52/0.12)] transition-shadow duration-press ease-out-strong group-aria-pressed/flag:shadow-[0_0_0_2px_#fff]";

const RECT_CLASS =
  "h-3.5 w-[1.3rem] overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgb(74_21_52/0.12)]";

function FlagNl({ coin }: { coin: boolean }) {
  return (
    <svg
      viewBox={coin ? "1.5 0 6 6" : "0 0 9 6"}
      className={coin ? COIN_CLASS : RECT_CLASS}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="9" height="2" fill="#AE1C28" />
      <rect y="2" width="9" height="2" fill="#fff" />
      <rect y="4" width="9" height="2" fill="#21468B" />
    </svg>
  );
}

function FlagGb({ coin }: { coin: boolean }) {
  return (
    <svg
      viewBox={coin ? "15 0 30 30" : "0 0 60 30"}
      className={coin ? COIN_CLASS : RECT_CLASS}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
