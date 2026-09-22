import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { foodEstablishmentJsonLd } from "@/domain/jsonld";
import { canonicalCitySlug } from "@/domain/cities";
import { t, type Locale } from "@/domain/messages";
import { loadSpotPage, publicSiteUrl } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { SpotShare } from "@/components/spot-share";
import { LikeButton } from "@/components/like-button";
import { SpotPhotos } from "@/components/spot-photos";
import { PageHero, PageHeroLead, PageHeroTitle } from "@/components/page-hero";
import { PhotoFrame } from "@/components/visual";

type Params = { city: string; spot: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city, spot } = await params;
  const canonical = canonicalCitySlug(city);
  if (canonical && canonical !== city) {
    redirect(`/nl/${canonical}/${spot}`);
  }
  const page = await loadSpotPage(city, spot);
  if (!page) {
    return { title: "brag.fast" };
  }
  return { title: `${page.name} · brag.fast` };
}

function cityName(locale: Locale, city: { nameNl: string; nameEn: string }): string {
  return locale === "en" ? city.nameEn : city.nameNl;
}

export default async function SpotPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city, spot } = await params;
  const canonical = canonicalCitySlug(city);
  if (canonical && canonical !== city) {
    redirect(`/nl/${canonical}/${spot}`);
  }
  const locale = await getLocale();
  const page = await loadSpotPage(city, spot);
  if (!page) {
    notFound();
  }

  const name = cityName(locale, page.city);
  const jsonLd = foodEstablishmentJsonLd({
    name: page.name,
    address: page.address,
    cityName: name,
    geo: page.geo,
    hours: page.hours,
    spotType: page.spotType,
    url: `${publicSiteUrl()}${page.canonicalPath}`,
    image: page.licensedImage,
  });
  const closed = page.lifecycle.kind === "gravestone";
  const hero = page.licensedImage?.url ?? null;
  const photoCopy = hero ? "text-shadow-photo " : "";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        size="spot"
        width="narrow"
        backdrop={
          hero ? <PhotoFrame src={hero} className="absolute inset-0 opacity-45" /> : null
        }
      >
        <PageHeroTitle onPhoto={Boolean(hero)}>{page.name}</PageHeroTitle>
        <PageHeroLead onPhoto={Boolean(hero)}>{page.address}</PageHeroLead>
        <Link
          href={`/nl/${page.city.slug}`}
          className={`${photoCopy}mt-4 w-fit text-sm font-bold text-yolk transition-colors duration-press ease-out-strong pointer-fine:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk`}
        >
          {t(locale, "backToCity")} {name}
        </Link>
        {closed ? (
          <p className="mt-6 inline-flex w-fit rounded-full bg-blush px-4 py-2 font-bold text-berry">
            {t(locale, "closed")}
          </p>
        ) : null}
      </PageHero>

      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex flex-wrap items-center gap-2">
          <LikeButton
            locale={locale}
            spotId={page.id}
            likeCount={page.likeCount}
          />
          <SpotShare
            locale={locale}
            url={`${publicSiteUrl()}${page.canonicalPath}`}
            name={page.name}
          />
        </div>
        <SpotPhotos locale={locale} photos={page.photos} />
      </div>
    </main>
  );
}
