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

export function SearchBox({ locale }: { locale: Locale }) {
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
    <div className="relative mt-8 max-w-xl" role="search" aria-label={t(locale, "searchLabel")}>
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
          className="flex h-16 items-center gap-2 rounded-full border border-white/40 bg-white/92 pl-5 pr-2 shadow-lift focus-within:ring-2 focus-within:ring-yolk"
        >
          <Search className="size-5 shrink-0 text-blush" aria-hidden />
          <ComboboxInput
            id="catalog-search"
            type="search"
            autoComplete="off"
            placeholder={t(locale, "searchPlaceholder")}
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0 sm:h-10 sm:px-5 sm:text-sm"
            onClick={() => go(highlighted.current)}
          >
            {t(locale, "searchSubmit")}
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
