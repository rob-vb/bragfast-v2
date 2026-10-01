import type { CSSProperties } from "react";
import { InstantCamera } from "@/components/instant-camera";
import { StoreButtons } from "@/components/store-buttons";
import { t, type Locale } from "@/domain/messages";
import type { AppStores } from "@/domain/viewModels";
import { displayFit } from "@/lib/display-fit";

const TITLE_TRACKING = 0.012;
/** The tag is set at this share of the title, and its pill pads 0.36em a side. */
const TAG_SCALE = 0.86;
const TAG_PAD = 0.72;

/**
 * Home's app band: one photo in the app, and the two ways it lands on the
 * site. The title counts the demo's beats: "Klik. Brag." painted in berry,
 * "Klaar." pressed on as a candy sticker, both fitted to the column.
 */
export function AppSection({ locale, stores }: { locale: Locale; stores: AppStores }) {
  const lead = t(locale, "appTitleLead");
  const tag = t(locale, "appTitleTag");
  const fit = Math.max(
    displayFit(lead, TITLE_TRACKING).line,
    (displayFit(tag, TITLE_TRACKING).line + TAG_PAD) * TAG_SCALE,
  );
  return (
    <section aria-labelledby="app-title" className="overflow-clip bg-milk">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <InstantCamera
          locale={locale}
          heading={
            <div className="@container">
              <h2
                id="app-title"
                aria-label={`${lead} ${tag}`}
                className="cam-title font-display text-berry"
                style={{ "--fit-line": fit, letterSpacing: `${TITLE_TRACKING}em` } as CSSProperties}
              >
                <span className="block">{lead}</span>
                <span className="block">
                  <span className="cam-title-tag sticker">{tag}</span>
                </span>
              </h2>
              <p className="mt-6 max-w-md text-lg leading-[1.55] font-semibold text-pretty text-berry/80 sm:mt-7">
                {t(locale, "appLede")}
              </p>
            </div>
          }
          cta={<StoreButtons locale={locale} ios={stores.ios} className="mt-0" />}
        />
      </div>
    </section>
  );
}
