import type { LicensedImage } from "./post";
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
  image: LicensedImage | null;
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
