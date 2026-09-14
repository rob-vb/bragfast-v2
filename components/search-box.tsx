"use client";

import { useState, type FocusEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Locale } from "@/domain/messages";
import { t } from "@/domain/messages";
import {
  moveWoonplaatsSuggest,
  pickWoonplaatsHref,
  woonplaatsSuggest,
  type WoonplaatsSuggest,
} from "@/domain/searchMatch";
import { Button } from "@/components/ui/button";

export function SearchBox({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggest, setSuggest] = useState<WoonplaatsSuggest>({ kind: "closed" });
  const listboxId = "woonplaats-suggest";
  const expanded = suggest.kind === "list" || suggest.kind === "none";
  const activeId =
    suggest.kind === "list" ? `woonplaats-${suggest.active.slug}` : undefined;

  function onChange(value: string) {
    setQuery(value);
    setSuggest(woonplaatsSuggest(value));
  }

  function go(state: WoonplaatsSuggest) {
    const href = pickWoonplaatsHref(state);
    if (href) {
      router.push(href);
    }
  }

  function collapseIfLeaving(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    setSuggest({ kind: "closed" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab") {
      setSuggest({ kind: "closed" });
      return;
    }
    if (suggest.kind !== "list") {
      if (event.key === "Enter") {
        event.preventDefault();
      }
      if (event.key === "Escape") {
        setSuggest({ kind: "closed" });
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSuggest(moveWoonplaatsSuggest(suggest, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSuggest(moveWoonplaatsSuggest(suggest, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(suggest);
    } else if (event.key === "Escape") {
      setSuggest({ kind: "closed" });
    }
  }

  return (
    <div
      className="relative mt-8 max-w-xl"
      role="search"
      aria-label={t(locale, "searchLabel")}
      onBlur={collapseIfLeaving}
    >
      <label className="sr-only" htmlFor="catalog-search">
        {t(locale, "searchLabel")}
      </label>
      <div className="flex h-16 items-center gap-2 rounded-full border border-white/40 bg-white/92 pl-5 pr-2 shadow-lift">
        <Search className="size-5 shrink-0 text-blush" aria-hidden />
        <input
          id="catalog-search"
          type="search"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          value={query}
          placeholder={t(locale, "searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-base text-berry outline-none placeholder:text-berry/45"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button
          type="button"
          size="sm"
          className="shrink-0 sm:h-10 sm:px-5 sm:text-sm"
          onClick={() => go(suggest)}
        >
          {t(locale, "searchSubmit")}
        </Button>
      </div>
      {suggest.kind === "list" ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-2 max-h-72 w-full overflow-y-auto rounded-slab bg-white py-1 shadow-lift"
        >
          {suggest.hits.map((hit) => {
            const name = locale === "en" ? hit.nameEn : hit.nameNl;
            const selected = hit.slug === suggest.active.slug;
            return (
              <li key={hit.slug} role="presentation">
                <Link
                  id={`woonplaats-${hit.slug}`}
                  role="option"
                  aria-selected={selected}
                  href={`/nl/${hit.slug}`}
                  className={`block px-4 py-2.5 text-sm font-bold text-berry ${
                    selected ? "bg-milk" : "hover:bg-milk/70"
                  }`}
                  onMouseEnter={() =>
                    setSuggest({ ...suggest, active: hit })
                  }
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : suggest.kind === "none" ? (
        <p
          id={listboxId}
          role="status"
          className="absolute z-10 mt-2 w-full rounded-slab bg-white px-4 py-3 text-sm font-semibold text-berry/80 shadow-lift"
        >
          {t(locale, "noSearchResults")}
        </p>
      ) : null}
    </div>
  );
}
