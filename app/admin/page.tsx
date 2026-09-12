import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import { getLocale } from "@/lib/i18n";
import { t } from "@/domain/messages";
import { AdminQueue } from "@/components/admin-queue";

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
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.92] tracking-wide text-berry">
        {t(locale, "adminTitle")}
      </h1>
      <AdminQueue
        locale={locale}
        reports={queue.reports}
        spots={queue.spots}
      />
    </main>
  );
}
