import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getLocale } from "@/lib/i18n";
import { loadAppStores } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { NL_CITIES } from "@/domain/cities";
import { t, townCountLabel } from "@/domain/messages";
import { PageHero, PageHeroLead, PageHeroTitle } from "@/components/page-hero";
import {
  BragFacts,
  DemoPodium,
  DemoPrint,
  DemoStamp,
  HouseRules,
  LeaderboardLink,
  VerbPoster,
  VerbStickers,
  verbFit,
} from "@/components/how-it-works";
import { LikeDemo } from "@/components/like-demo";
import { Stage } from "@/components/stage";
import { StoreButtons } from "@/components/store-buttons";
import { TownSearch } from "@/components/town-search";
import { PrintGlow } from "@/components/spot-print";
import { Egg } from "@/components/visual";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata(locale, {
    title: t(locale, "howItWorks"),
    description: t(locale, "hiwLead"),
    path: "/how-it-works",
  });
}

const LEDE = "text-lg font-semibold leading-8 text-pretty sm:text-xl sm:leading-9";

export default async function HowItWorksPage() {
  const locale = await getLocale();
  const stores = loadAppStores();
  const fit = verbFit(locale);

  return (
    <main>
      <PageHero className="overflow-hidden">
        <div className="grid gap-y-10 lg:grid-cols-12 lg:items-end lg:gap-x-12">
          <div className="lg:col-span-7">
            <PageHeroTitle size="lg">{t(locale, "howItWorks")}</PageHeroTitle>
            <PageHeroLead className="max-w-md text-balance text-milk sm:text-xl">
              {t(locale, "hiwLead")}
            </PageHeroLead>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <VerbStickers locale={locale} />
          </div>
        </div>
      </PageHero>

      <VerbPoster id="search" word={t(locale, "hiwVerbSearch")} fit={fit} ground="milk">
        <Stage>
          <TownSearch
            locale={locale}
            mapLabel={t(locale, "hiwMapLabel")}
            count={townCountLabel(locale, NL_CITIES.length)}
            note={t(locale, "hiwSearchNote")}
          >
            <p className={LEDE}>{t(locale, "hiwSearchBody")}</p>
          </TownSearch>
        </Stage>
      </VerbPoster>

      <VerbPoster
        id="brag"
        word={t(locale, "hiwVerbBrag")}
        fit={fit}
        ground="berry"
        backdrop={<PrintGlow src="/how-it-works/pancakes.webp" at="28% 72%" />}
      >
        {/* Mobile reads print, copy, stores; desktop hangs the stores under the print */}
        <Stage className="grid items-start gap-14 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10">
          <div className="lg:col-span-6 lg:row-start-1 lg:-mt-24">
            <DemoPrint locale={locale} />
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:pt-36">
            <p className={`${LEDE} text-white`}>{t(locale, "hiwBragBody")}</p>
            <BragFacts locale={locale} />
          </div>
          <StoreButtons
            locale={locale}
            ios={stores.ios}
            android={stores.android}
            className="-mt-4 lg:col-span-6 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:pl-4"
          />
        </Stage>
      </VerbPoster>

      <VerbPoster id="like" word={t(locale, "hiwVerbLike")} fit={fit} ground="white">
        <LikeDemo
          locale={locale}
          rules={{
            one: t(locale, "hiwLikeRuleOne"),
            undo: t(locale, "hiwLikeRuleUndo"),
            tie: t(locale, "hiwLikeRuleTie"),
          }}
        >
          <p className={LEDE}>{t(locale, "hiwLikeBody")}</p>
        </LikeDemo>
      </VerbPoster>

      <VerbPoster id="climb" word={t(locale, "hiwVerbClimb")} fit={fit} ground="berry" floor>
        <Stage className="relative grid items-end gap-14 lg:grid-cols-12 lg:gap-x-12">
          <DemoStamp
            locale={locale}
            className="absolute -top-16 right-1 z-10 w-24 sm:-top-28 sm:w-36 lg:-top-44 lg:right-12 lg:w-48"
          />
          <div className="order-2 lg:order-1 lg:col-span-7">
            <DemoPodium locale={locale} />
          </div>
          <div className="order-1 self-start pt-12 sm:pt-16 lg:order-2 lg:col-span-4 lg:col-start-9 lg:pt-14">
            <p className={`${LEDE} text-white`}>{t(locale, "hiwClimbBody")}</p>
            <p className="mt-4 text-base leading-7 font-semibold text-pretty text-milk/80">
              {t(locale, "hiwClimbPassport")}
            </p>
            <LeaderboardLink locale={locale} />
          </div>
        </Stage>
      </VerbPoster>

      <HouseRules locale={locale} />

      <section aria-labelledby="close-title" className="bg-milk">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
          <Egg size={96} className="rotate-6 drop-shadow-sticker" />
          <h2
            id="close-title"
            className="mt-6 font-display text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.95] tracking-wide text-balance"
          >
            {t(locale, "appRowBragTitle")}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-8 font-semibold text-pretty text-berry/80">
            {t(locale, "hiwCloseBody")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className={buttonVariants()}>
              <Search aria-hidden className="size-4" strokeWidth={2.5} />
              {t(locale, "hiwSearchAPlace")}
            </Link>
            <StoreButtons locale={locale} ios={stores.ios} android={stores.android} className="mt-0" />
          </div>
        </div>
      </section>
    </main>
  );
}
