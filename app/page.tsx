import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale } from "@/lib/i18n";
import { loadHomepage, publicSiteUrl } from "@/lib/catalog";
import { HTML_LANG, SITE_LOGO, pageMetadata } from "@/lib/seo";
import { HomeView } from "@/components/home-view";
import { clientIpFrom } from "@/domain/clientIp";
import { jsonLdScript, siteJsonLd } from "@/domain/jsonld";
import { t } from "@/domain/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata(locale, {
    title: t(locale, "metaHomeTitle"),
    description: t(locale, "metaHomeDescription"),
    path: "/",
  });
}

export default async function HomePage() {
  const locale = await getLocale();
  const homepage = await loadHomepage(clientIpFrom(await headers()));
  const jsonLd = siteJsonLd({
    origin: publicSiteUrl(),
    description: t(locale, "metaHomeDescription"),
    language: HTML_LANG[locale],
    logo: SITE_LOGO,
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <HomeView locale={locale} homepage={homepage} />
    </>
  );
}
