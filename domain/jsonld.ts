import type { OpeningHours, SpotType } from "./spot";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const schemaType: Record<SpotType, string> = {
  cafe: "CafeOrCoffeeShop",
  bakery: "Bakery",
  hotel: "Hotel",
  other: "FoodEstablishment",
};

export function foodEstablishmentJsonLd(input: {
  name: string;
  address: string;
  cityName: string;
  geo: { lat: number; lng: number };
  hours: OpeningHours | null;
  spotType: SpotType;
  url: string;
  image: { url: string } | null;
}): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType[input.spotType],
    name: input.name,
    url: input.url,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address,
      addressLocality: input.cityName,
      addressCountry: "NL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: input.geo.lat,
      longitude: input.geo.lng,
    },
  };

  if (input.image) {
    node.image = input.image.url;
  }

  if (input.hours) {
    node.openingHoursSpecification = input.hours.periods.map((period) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${WEEKDAYS[period.day]}`,
      opens: period.open,
      closes: period.close,
    }));
  }

  return node;
}

/**
 * The home page's WebSite and Organization nodes, so search shows the site
 * as "brag.fast" with its own mark.
 */
export function siteJsonLd(input: {
  origin: string;
  description: string;
  language: string;
  logo: string;
}): Record<string, unknown> {
  const home = `${input.origin}/`;
  const organization = `${input.origin}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${input.origin}/#website`,
        url: home,
        name: "brag.fast",
        alternateName: ["bragfast", "brag fast"],
        description: input.description,
        inLanguage: input.language,
        publisher: { "@id": organization },
      },
      {
        "@type": "Organization",
        "@id": organization,
        name: "brag.fast",
        url: home,
        logo: `${input.origin}${input.logo}`,
      },
    ],
  };
}

/** JSON for a `<script type="application/ld+json">`, with `<` escaped so no value can close the tag. */
export function jsonLdScript(node: Record<string, unknown>): string {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}
