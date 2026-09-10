export const DISCOVERY_TYPES = [
  "cafe",
  "bakery",
  "hotel",
  "breakfast_restaurant",
  "brunch_restaurant",
  "coffee_shop",
] as const;

export type DiscoveryType = (typeof DISCOVERY_TYPES)[number];

export const DISCOVERY_QUERIES = ["ontbijt", "brunch"] as const;

export type DiscoveryQuery = (typeof DISCOVERY_QUERIES)[number];

/** Text Search IDs-only is unlimited free. Place Details Pro is 5,000/month.
 * Do not put `regularOpeningHours` on the Details mask: that field is the
 * Enterprise SKU (1,000 free/month). Hours already stored stay via hygiene. */
export const PLACE_DETAILS_PRO_FREE_MONTHLY = 5_000;

/** Leave headroom for signed-in user-add Place Details on the same SKU. */
export const INGEST_DETAILS_MONTHLY_CAP = 4_000;

export const DETAILS_PER_RUN = 200;

export const GEMEENTEN_PER_RUN = 10;

export function billingMonthKey(now: number): string {
  const date = new Date(now);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

export function detailsBudgetLeft(used: number, cap: number): number {
  if (used >= cap) {
    return 0;
  }
  return cap - used;
}
