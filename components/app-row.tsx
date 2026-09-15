import { PhoneShell } from "@/components/phone-shell";
import { StoreButtons } from "@/components/store-buttons";
import { t, type Locale, type MessageKey } from "@/domain/messages";
import type { AppStores } from "@/domain/viewModels";
import { cn } from "@/lib/utils";

export function AppRow({
  locale,
  stores,
  titleKey,
  bodyKey,
  phoneFirst,
}: {
  locale: Locale;
  stores: AppStores;
  titleKey: Extract<MessageKey, "appRowBragTitle" | "appRowPhotosTitle">;
  bodyKey: Extract<MessageKey, "appRowBragBody" | "appRowPhotosBody">;
  phoneFirst: boolean;
}) {
  return (
    <section className={cn("py-14 sm:py-20", phoneFirst ? "bg-shell" : "bg-milk")}>
      <div
        className={cn(
          "mx-auto flex max-w-6xl flex-col items-center gap-10 px-5 sm:flex-row sm:items-center sm:gap-16 sm:px-8",
          phoneFirst && "sm:flex-row-reverse",
        )}
      >
        <div className="w-full flex-1">
          <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
            {t(locale, titleKey)}
          </h2>
          <p className="mt-4 max-w-md text-base font-semibold leading-7 text-berry/80">
            {t(locale, bodyKey)}
          </p>
          <StoreButtons locale={locale} ios={stores.ios} android={stores.android} />
        </div>
        <PhoneShell />
      </div>
    </section>
  );
}
