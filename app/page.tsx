import { getLocale } from "@/lib/i18n";
import { loadHomepage } from "@/lib/catalog";
import { HomeView } from "@/components/home-view";

export default async function HomePage() {
  const locale = await getLocale();
  const homepage = await loadHomepage();
  return <HomeView locale={locale} featured={homepage.featured} />;
}
