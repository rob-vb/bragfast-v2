const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class DomainParseError extends Error {
  constructor(name: string, value: string) {
    super(`Invalid ${name}: ${JSON.stringify(value)}`);
    this.name = "DomainParseError";
  }
}

type Brand<Value, Name extends string> = Value & { readonly __brand: Name };

export type CitySlug = Brand<string, "CitySlug">;
export type SpotSlug = Brand<string, "SpotSlug">;
export type UserSlug = Brand<string, "UserSlug">;
export type PlaceId = Brand<string, "PlaceId">;

function parseSlug<Name extends string>(name: Name, raw: string): Brand<string, Name> {
  if (!SLUG_PATTERN.test(raw)) {
    throw new DomainParseError(name, raw);
  }
  return raw as Brand<string, Name>;
}

export const parseCitySlug = (raw: string): CitySlug => parseSlug("CitySlug", raw);
export const parseSpotSlug = (raw: string): SpotSlug => parseSlug("SpotSlug", raw);
export const parseUserSlug = (raw: string): UserSlug => parseSlug("UserSlug", raw);

export function parsePlaceId(raw: string): PlaceId {
  const value = raw.trim();
  if (value.length < 3 || value.length > 255) {
    throw new DomainParseError("PlaceId", raw);
  }
  return value as PlaceId;
}
