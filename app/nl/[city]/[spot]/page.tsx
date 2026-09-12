import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { foodEstablishmentJsonLd } from "@/domain/jsonld";
import { canonicalCitySlug } from "@/domain/cities";
import { openNow } from "@/domain/spot";
import { t, type Locale } from "@/domain/messages";
import { loadSpotPage, publicSiteUrl } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { SpotShare } from "@/components/spot-share";
import { LikeButton } from "@/components/like-button";
import { PhotoFrame } from "@/components/visual";
import { cityScene } from "@/lib/scenes";

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

function weekdayLabel(locale: Locale, day: number): string {
  const date = new Date(Date.UTC(2024, 0, 7 + day));
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
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
  const isOpen = openNow(page.hours, new Date());
  const closed = page.lifecycle.kind === "gravestone";
  const hero = page.licensedImage?.url ?? cityScene(page.city.slug);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative -mt-16 min-h-[58svh] sm:-mt-[4.5rem]">
        <PhotoFrame src={hero} className="absolute inset-0" />
        <div className="relative mx-auto flex min-h-[58svh] max-w-3xl flex-col justify-end px-5 pb-10 pt-28 sm:px-8">
          <h1 className="text-shadow-photo font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.92] tracking-wide text-white">
            {page.name}
          </h1>
          <p className="text-shadow-photo mt-3 text-lg text-white">{page.address}</p>
          <Link
            href={`/nl/${page.city.slug}`}
            className="text-shadow-photo mt-4 w-fit text-sm font-bold text-yolk"
          >
            {t(locale, "backToCity")} {name}
          </Link>
          {closed ? (
            <p className="mt-6 inline-flex w-fit rounded-full bg-blush px-4 py-2 font-bold text-berry">
              {t(locale, "closed")}
            </p>
          ) : isOpen ? (
            <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-full bg-yolk px-3 py-1 text-berry">
                {t(locale, "openNow")}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl tracking-wide">
              {t(locale, "hoursHeading")}
            </h2>
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
          </div>
          {page.hours ? (
            <ul className="mt-4 grid gap-1 text-berry/75">
              {page.hours.periods.map((period) => (
                <li key={`${period.day}-${period.open}`}>
                  {weekdayLabel(locale, period.day)} {period.open}–{period.close}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-berry/55">{t(locale, "hoursUnknown")}</p>
          )}
        </section>
      </div>
    </main>
  );
}
