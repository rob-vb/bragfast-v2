"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Locale } from "@/domain/messages";
import { t } from "@/domain/messages";
import { searchNeedle, woonplaatsSuggest } from "@/domain/searchMatch";
import type { SearchHit } from "@/domain/viewModels";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export function SearchBox({
  locale,
  onQueryChange,
  className,
}: {
  locale: Locale;
  /** Every keystroke, for a page that lights up what is being typed. */
  onQueryChange?: (query: string) => void;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const highlighted = useRef<SearchHit | undefined>(undefined);
  const pillRef = useRef<HTMLDivElement>(null);
  const suggest = woonplaatsSuggest(query);
  const items = suggest.kind === "list" ? [...suggest.hits] : [];

  function labelOf(hit: SearchHit) {
    return locale === "en" ? hit.nameEn : hit.nameNl;
  }

  function go(hit: SearchHit | undefined) {
    if (hit) {
      router.push(`/nl/${hit.slug}`);
    }
  }

  return (
    <div
      className={cn("relative mt-8 max-w-xl", className)}
      role="search"
      aria-label={t(locale, "searchLabel")}
    >
      <label className="sr-only" htmlFor="catalog-search">
        {t(locale, "searchLabel")}
      </label>
      <Combobox
        items={items}
        filteredItems={items}
        filter={null}
        autoHighlight
        open={open}
        onOpenChange={(next) => {
          if (next && searchNeedle(query).length < 2) {
            return;
          }
          setOpen(next);
        }}
        inputValue={query}
        onInputValueChange={(value) => {
          setQuery(value);
          onQueryChange?.(value);
          const next = woonplaatsSuggest(value);
          setOpen(next.kind === "list" || next.kind === "none");
        }}
        onItemHighlighted={(hit) => {
          highlighted.current = hit;
        }}
        onValueChange={(hit) => go(hit ?? undefined)}
        itemToStringLabel={labelOf}
        itemToStringValue={(hit) => hit.slug}
        isItemEqualToValue={(left, right) => left.slug === right.slug}
      >
        <ComboboxInputGroup
          ref={pillRef}
          className="flex h-16 items-center gap-2 rounded-full border border-white/40 bg-white/92 pl-6 pr-2 shadow-lift focus-within:ring-2 focus-within:ring-yolk sm:pl-5"
        >
          <Search className="hidden size-5 shrink-0 text-blush sm:block" aria-hidden />
          <ComboboxInput
            id="catalog-search"
            className="text-ellipsis"
            type="search"
            autoComplete="off"
            placeholder={t(locale, "searchPlaceholder")}
          />
          {/* 8px inside the pill on every side. On a phone the key is the
              glyph alone, so the placeholder keeps its whole line. */}
          <Button
            type="button"
            className="h-12 w-12 px-0 text-base sm:w-auto sm:px-6"
            onClick={() => go(highlighted.current)}
          >
            <Search className="size-5 sm:hidden" strokeWidth={2.5} aria-hidden />
            <span className="max-sm:sr-only">{t(locale, "searchSubmit")}</span>
          </Button>
        </ComboboxInputGroup>
        <ComboboxContent
          anchor={pillRef}
          collisionAvoidance={{ side: "none", fallbackAxisSide: "none" }}
        >
          <ComboboxEmpty>{t(locale, "noSearchResults")}</ComboboxEmpty>
          <ComboboxList>
            {(hit: SearchHit) => (
              <ComboboxItem key={hit.slug} value={hit}>
                {labelOf(hit)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
