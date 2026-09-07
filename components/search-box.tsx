"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Locale } from "@/domain/messages";
import { t } from "@/domain/messages";
import { Button } from "@/components/ui/button";

export function SearchBox({
  locale,
  defaultQuery = "",
}: {
  locale: Locale;
  defaultQuery?: string;
}) {
  const [showHint, setShowHint] = useState(defaultQuery.trim().length === 1);
  const hintId = "catalog-search-hint";

  return (
    <form
      role="search"
      action="/"
      method="get"
      className="mt-8 max-w-xl"
      aria-label={t(locale, "searchLabel")}
    >
      <label className="sr-only" htmlFor="catalog-search">
        {t(locale, "searchLabel")}
      </label>
      <div className="flex h-16 items-center gap-2 rounded-full border border-white/40 bg-white/92 pl-5 pr-2 shadow-lift">
        <Search className="size-5 shrink-0 text-blush" aria-hidden />
        <input
          id="catalog-search"
          type="search"
          name="q"
          defaultValue={defaultQuery}
          minLength={2}
          aria-describedby={showHint ? hintId : undefined}
          placeholder={t(locale, "searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-base text-berry outline-none placeholder:text-berry/45"
          onChange={(event) =>
            setShowHint(event.target.value.trim().length === 1)
          }
        />
        <Button type="submit" size="sm" className="shrink-0 sm:h-10 sm:px-5 sm:text-sm">
          {t(locale, "searchSubmit")}
        </Button>
      </div>
      {showHint ? (
        <p id={hintId} className="text-shadow-photo mt-3 text-sm font-semibold text-white">
          {t(locale, "searchHint")}
        </p>
      ) : null}
    </form>
  );
}

