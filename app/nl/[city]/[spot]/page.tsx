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
      <section className="relative -mt-16 min-h-[58svh] bg-berry sm:-mt-[4.5rem]">
        {hero ? (
          <PhotoFrame src={hero} className="absolute inset-0 opacity-45" />
        ) : null}
        <div className="relative mx-auto flex min-h-[58svh] max-w-3xl flex-col justify-end px-5 pb-10 pt-28 sm:px-8">
          <h1
            className={`${photoCopy}font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.92] tracking-wide text-white`}
          >
            {page.name}
          </h1>
          <p className={`${photoCopy}mt-3 text-lg text-white`}>{page.address}</p>
          <Link
            href={`/nl/${page.city.slug}`}
            className={`${photoCopy}mt-4 w-fit text-sm font-bold text-yolk`}
          >
            {t(locale, "backToCity")} {name}
          </Link>
          {closed ? (
            <p className="mt-6 inline-flex w-fit rounded-full bg-blush px-4 py-2 font-bold text-berry">
              {t(locale, "closed")}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
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
