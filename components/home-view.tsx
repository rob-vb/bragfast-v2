import {
  likeCountLabel,
  localFavoritesHeading,
  seeAllInCity,
  t,
  type Locale,
  type MessageKey,
} from "@/domain/messages";
import { Fragment, type CSSProperties } from "react";
import type { HomepageData, LocalFavorites } from "@/domain/viewModels";
import { AppSection } from "@/components/app-section";
import { VERBS } from "@/components/how-it-works";
import { SearchBox } from "@/components/search-box";
import { PhotoFrame, SpotLinkCard } from "@/components/visual";
import { displayFit } from "@/lib/display-fit";
import { HERO_SCENE } from "@/lib/scenes";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HomeView({
  locale,
  homepage,
}: {
  locale: Locale;
  homepage: HomepageData;
}) {
  return (
    <main>
      <HomeHero locale={locale} />

      <LocalFavoritesSection
        locale={locale}
        localFavorites={homepage.localFavorites}
      />

      <Steps locale={locale} />

      <AppSection locale={locale} stores={homepage.stores} />
    </main>
  );
}

const HERO_TRACKING = 0.012;

/**
 * The promise and its sticker: "Ontbijt- en brunchplekken," is painted on
 * the still and "per stad." is pressed onto it. Copy without a comma is all
 * paint and no sticker.
 */
function heroLockup(title: string): { lead: string; tag: string | null } {
  const cut = title.lastIndexOf(", ");
  return cut === -1
    ? { lead: title, tag: null }
    : { lead: title.slice(0, cut + 1), tag: title.slice(cut + 2) };
}

/**
 * Home opens inside the still. The title comes into focus word by word, the
 * way a camera finds the table, and then its last words land as a yolk
 * sticker: home's one authored moment. The search is usable from the first
 * frame; nothing it depends on waits for the moment.
 */
function HomeHero({ locale }: { locale: Locale }) {
  const title = t(locale, "hero");
  const { lead, tag } = heroLockup(title);
  const words = lead.split(" ");
  const fit = displayFit(lead, HERO_TRACKING);
  return (
    <section className="home-hero relative -mt-16 min-h-[92svh] overflow-clip sm:-mt-[4.5rem]">
      {/* The still paints up to 1.46x wide under its zoom (globals.css
          .hero-ken), and wider still when the frame is height-bound */}
      <PhotoFrame
        scene={HERO_SCENE}
        ken
        sizes="(max-height: 50rem) 180vw, 140vw"
        className="absolute inset-0"
      />
      <div className="@container relative mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-end px-5 pb-12 pt-28 sm:px-8 md:pb-20">
        <div>
          <h1
            aria-label={title}
            className="hero-title font-display text-white"
            style={
              {
                "--fit-word": fit.word,
                "--words": words.length,
                letterSpacing: `${HERO_TRACKING}em`,
              } as CSSProperties
            }
          >
            <span className="hero-lead text-shadow-photo">
              {words.map((word, i) => (
                <Fragment key={i}>
                  {i === 0 ? null : " "}
                  <span className="hero-word" style={{ "--i": i } as CSSProperties}>
                    {word}
                  </span>
                </Fragment>
              ))}
            </span>
            {tag ? (
              <span className="block">
                <span className="hero-tag sticker">{tag}</span>
              </span>
            ) : null}
          </h1>
          <p className="text-shadow-photo-copy mt-6 max-w-xl text-[clamp(1.0625rem,0.95rem+0.4vw,1.25rem)] leading-[1.5] font-semibold text-pretty text-white sm:mt-7">
            {t(locale, "intro")}
          </p>
          <SearchBox locale={locale} className="mt-7 sm:mt-8" />
        </div>
      </div>
    </section>
  );
}

const STEP_BODY = {
  search: "stepSearchBody",
  brag: "stepBragBody",
  like: "stepLikeBody",
  climb: "stepClimbBody",
} as const satisfies Record<(typeof VERBS)[number]["id"], MessageKey>;

/** The four verbs of how it works, one line each, each opening its poster. */
function Steps({ locale }: { locale: Locale }) {
  return (
    <section aria-labelledby="steps-title" className="bg-berry text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <h2 id="steps-title" className="font-display text-3xl tracking-wide sm:text-4xl">
          {t(locale, "stepsTitle")}
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VERBS.map((verb) => (
            <li
              key={verb.id}
              className="step-card relative grid grid-cols-[6.25rem_1fr] items-center gap-x-4 rounded-slab bg-white/7 p-5 ring-1 ring-white/10 sm:flex sm:flex-col sm:items-start sm:p-6 sm:pt-7 transition-[background-color,scale] duration-press ease-out-strong has-[a:active]:scale-[0.985] pointer-fine:hover:bg-white/12"
            >
              <h3>
                <Link
                  href={`/how-it-works#${verb.id}`}
                  aria-describedby={`step-${verb.id}`}
                  style={{ "--tilt": `${verb.tilt}deg` } as CSSProperties}
                  className={cn(
                    "hiw-sticker sticker inline-flex rounded-full px-4 py-1 font-display text-2xl tracking-wide text-berry sm:px-5 sm:py-1.5 sm:text-3xl",
                    "focus-visible:outline-none! after:absolute after:inset-0 after:rounded-slab after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-yolk",
                    verb.ink,
                  )}
                >
                  {t(locale, verb.word)}
                </Link>
              </h3>
              <p
                id={`step-${verb.id}`}
                className="text-base leading-7 font-semibold text-pretty text-milk/85 sm:mt-6"
              >
                {t(locale, STEP_BODY[verb.id])}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href="/how-it-works"
          className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-base font-bold text-berry transition-[color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:text-blush"
        >
          {t(locale, "stepsMore")}
          <ArrowRight aria-hidden className="size-4" strokeWidth={2.75} />
        </Link>
      </div>
    </section>
  );
}

function LocalFavoritesSection({
  locale,
  localFavorites,
}: {
  locale: Locale;
  localFavorites: LocalFavorites;
}) {
  if (localFavorites.kind === "omit") {
    return null;
  }
  const cityName =
    locale === "en" ? localFavorites.city.nameEn : localFavorites.city.nameNl;
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
        {localFavoritesHeading(locale, cityName)}
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {localFavorites.spots.map((spot) => (
          <li key={spot.slug}>
            <SpotLinkCard
              href={`/nl/${spot.citySlug}/${spot.slug}`}
              src={spot.photoUrl}
              title={spot.name}
              meta={likeCountLabel(locale, spot.likeCount)}
            />
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link
          href={`/nl/${localFavorites.city.slug}`}
          className="text-sm font-bold text-blush transition-colors duration-press ease-out-strong pointer-fine:hover:text-berry focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk"
        >
          {seeAllInCity(locale, cityName)}
        </Link>
      </p>
    </section>
  );
}
