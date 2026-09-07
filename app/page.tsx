import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import { loadHomepage, loadSearch } from "@/lib/catalog";
import { exactCitySlugFromHits } from "@/domain/searchMatch";
import { HomeView } from "@/components/home-view";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getLocale();
  const query = ((await searchParams).q ?? "").trim();
  const homepage = await loadHomepage();
  const hits = query.length >= 2 ? await loadSearch(query) : [];
  const exactCity = exactCitySlugFromHits(query, hits);
  if (exactCity) {
    redirect(`/nl/${exactCity}`);
  }

  return (
    <HomeView
      locale={locale}
      query={query}
      hits={hits}
      featured={homepage.featured}
    />
  );
}
