"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/domain/messages";
import { LOCALE_FLAGS } from "@/domain/chrome";

const FLAG_MARK = {
  nl: FlagNl,
  en: FlagGb,
} as const;

export function LanguageSwitch({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
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
      className="flex items-center rounded-full border border-berry/15 bg-white/70 p-0.5 backdrop-blur-sm"
    >
      {LOCALE_FLAGS.map((option) => {
        const Flag = FLAG_MARK[option.locale];
        return (
          <button
            key={option.locale}
            type="button"
            aria-label={option.autonym}
            aria-pressed={locale === option.locale}
            className="flex size-8 items-center justify-center rounded-full transition-colors aria-pressed:bg-blush"
            onClick={() => choose(option.locale)}
          >
            <Flag />
          </button>
        );
      })}
    </div>
  );
}

function FlagNl() {
  return (
    <svg
      viewBox="0 0 9 6"
      className="h-3.5 w-[1.3rem] overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgb(74_21_52/0.12)]"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="9" height="2" fill="#AE1C28" />
      <rect y="2" width="9" height="2" fill="#fff" />
      <rect y="4" width="9" height="2" fill="#21468B" />
    </svg>
  );
}

function FlagGb() {
  return (
    <svg
      viewBox="0 0 60 30"
      className="h-3.5 w-[1.3rem] overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgb(74_21_52/0.12)]"
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
