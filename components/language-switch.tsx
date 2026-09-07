"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/domain/messages";

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
      className="flex items-center rounded-full border border-berry/15 bg-white/70 p-0.5 text-sm font-bold text-berry backdrop-blur-sm"
    >
      {(["nl", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          className="rounded-full px-2.5 py-1.5 uppercase transition-colors aria-pressed:bg-blush aria-pressed:text-white"
          onClick={() => choose(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
