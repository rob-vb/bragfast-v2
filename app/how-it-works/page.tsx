import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import { t } from "@/domain/messages";
import { PageHero, PageHeroTitle } from "@/components/page-hero";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, "howItWorks")} · brag.fast` };
}

export default async function HowItWorksPage() {
  const locale = await getLocale();
  return (
    <main className="flex flex-1 flex-col">
      <PageHero className="flex-1">
        <PageHeroTitle>{t(locale, "howItWorks")}</PageHeroTitle>
      </PageHero>
    </main>
  );
}
