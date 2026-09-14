import { buttonVariants } from "@/components/ui/button";
import { t, type Locale } from "@/domain/messages";
import type { StoreButton } from "@/domain/viewModels";

export function StoreButtons({
  locale,
  ios,
  android,
}: {
  locale: Locale;
  ios: StoreButton;
  android: StoreButton;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <StoreControl locale={locale} store={ios} liveLabel={t(locale, "downloadIos")} />
      <StoreControl
        locale={locale}
        store={android}
        liveLabel={t(locale, "downloadAndroid")}
      />
    </div>
  );
}

function StoreControl({
  locale,
  store,
  liveLabel,
}: {
  locale: Locale;
  store: StoreButton;
  liveLabel: string;
}) {
  switch (store.kind) {
    case "live":
      return (
        <a href={store.href} className={buttonVariants()}>
          {liveLabel}
        </a>
      );
    case "comingSoon":
      return (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className={buttonVariants({ variant: "outline" })}
        >
          {t(locale, "comingSoon")}
        </button>
      );
    default: {
      const _exhaustive: never = store;
      return _exhaustive;
    }
  }
}
