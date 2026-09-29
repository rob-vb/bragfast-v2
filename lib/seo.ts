import type { Metadata } from "next";
import type { Locale } from "@/domain/messages";

export const SITE_NAME = "brag.fast";

/** The site's mark as a raster, for the Organization logo. */
export const SITE_LOGO = "/brag_fast_egg-512.png";

/** The share card for a page without a photo of its own (`public/og.jpg`, 1200×630). */
const SHARE_IMAGE = { url: "/og.jpg", width: 1200, height: 630, alt: SITE_NAME };

const OG_LOCALE: Record<Locale, string> = { nl: "nl_NL", en: "en_GB" };

export const HTML_LANG: Record<Locale, string> = { nl: "nl-NL", en: "en-GB" };

/** The share card fields every page carries; the root layout's `metadataBase` makes paths absolute. */
export function shareCard(locale: Locale): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: SITE_NAME,
    locale: OG_LOCALE[locale],
    images: [SHARE_IMAGE],
  };
}

/**
 * Title, description, canonical URL and share card for one page. `title`
 * runs through the root layout's "%s | brag.fast" template unless the page
 * sits in the root segment, which writes its title in full.
 */
export function pageMetadata(
  locale: Locale,
  page: {
    title: string;
    description: string;
    path: string;
    image?: string;
  },
): Metadata {
  const card = shareCard(locale);
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      ...card,
      title: page.title,
      description: page.description,
      url: page.path,
      images: page.image ? [{ url: page.image }] : card.images,
    },
  };
}
