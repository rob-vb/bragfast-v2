import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import { t } from "@/domain/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, "howItWorks")} · brag.fast` };
}

export default async function HowItWorksPage() {
  const locale = await getLocale();
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl tracking-wide">
        {t(locale, "howItWorks")}
      </h1>
    </main>
  );
}
