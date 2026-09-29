import { addressLines, splitDutchPlace, type OpeningHours, type SpotType } from "./spot";

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
  /** Hosted photo URLs, hero first. */
  images: readonly string[];
  likeCount: number;
}): Record<string, unknown> {
  const { street, place } = addressLines(input.address);
  const { postalCode, locality } = splitDutchPlace(place ?? input.cityName);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType[input.spotType],
    "@id": `${input.url}#spot`,
    name: input.name,
    url: input.url,
    address: {
      "@type": "PostalAddress",
      streetAddress: street,
      ...(postalCode ? { postalCode } : {}),
      addressLocality: locality,
      addressCountry: "NL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: input.geo.lat,
      longitude: input.geo.lng,
    },
    // The board's rank unit, counted the way the page shows it; never a rating
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: input.likeCount,
    },
  };

  const images = [...new Set(input.images)];
  if (images.length > 0) {
    node.image = images.length === 1 ? images[0] : images;
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

type Crumb = { name: string; url: string };

/** The trail from the home page down to this page, last crumb included. */
export function breadcrumbJsonLd(crumbs: readonly Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * A list page's entries in the order the page shows them: a board ranked by
 * likes, or the woonplaats index A to Z.
 */
export function itemListJsonLd(input: {
  name: string;
  url: string;
  order: "ranked" | "alphabetical";
  items: readonly Crumb[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${input.url}#list`,
    name: input.name,
    url: input.url,
    itemListOrder:
      input.order === "ranked"
        ? "https://schema.org/ItemListOrderDescending"
        : "https://schema.org/ItemListOrderAscending",
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

/** Several nodes in one script, sharing one `@context`. */
export function jsonLdGraph(nodes: readonly Record<string, unknown>[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.map((node) => {
      const copy = { ...node };
      delete copy["@context"];
      return copy;
    }),
  };
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
