import type {
  AppStores,
  CityCard,
  CitySpotCard,
  LocalFavoriteCard,
  LocalFavorites,
  StoreButton,
} from "./viewModels";

function toCard(spot: CitySpotCard): LocalFavoriteCard {
  return {
    slug: spot.slug,
    citySlug: spot.citySlug,
    name: spot.name,
    photoUrl: spot.photoUrl,
    likeCount: spot.likeCount,
  };
}

export function planLocalFavorites(
  city: CityCard,
  spots: readonly CitySpotCard[],
): LocalFavorites {
  if (spots.length < 3) {
    return { kind: "omit" };
  }
  const [a, b, c, ...rest] = spots.slice(0, 6).map(toCard);
  if (a === undefined || b === undefined || c === undefined) {
    return { kind: "omit" };
  }
  return { kind: "board", city, spots: [a, b, c, ...rest] };
}

export function planStoreButton(href: string | undefined): StoreButton {
  const trimmed = href?.trim() ?? "";
  if (trimmed === "") {
    return { kind: "comingSoon" };
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { kind: "live", href: trimmed };
    }
  } catch {
    return { kind: "comingSoon" };
  }
  return { kind: "comingSoon" };
}

export function planAppStores(env: {
  ios?: string;
  android?: string;
}): AppStores {
  return {
    ios: planStoreButton(env.ios),
    android: planStoreButton(env.android),
  };
}
