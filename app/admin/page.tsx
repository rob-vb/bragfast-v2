import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import { getLocale } from "@/lib/i18n";
import { t } from "@/domain/messages";
import { AdminQueue } from "@/components/admin-queue";
import { PageHero, PageHeroTitle } from "@/components/page-hero";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Beheer · brag.fast",
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage() {
  const locale = await getLocale();
  const queue = await fetchAuthQuery(api.admin.queue);
  if (queue === null) {
    notFound();
  }

  return (
    <main>
      <PageHero>
        <PageHeroTitle>{t(locale, "adminTitle")}</PageHeroTitle>
      </PageHero>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <AdminQueue
          locale={locale}
          reports={queue.reports}
          spots={queue.spots}
        />
      </div>
    </main>
  );
}
