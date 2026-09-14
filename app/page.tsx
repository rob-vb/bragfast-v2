import { headers } from "next/headers";
import { getLocale } from "@/lib/i18n";
import { loadHomepage } from "@/lib/catalog";
import { HomeView } from "@/components/home-view";
import { clientIpFrom } from "@/domain/clientIp";

export default async function HomePage() {
  const locale = await getLocale();
  const homepage = await loadHomepage(clientIpFrom(await headers()));
  return <HomeView locale={locale} homepage={homepage} />;
}
