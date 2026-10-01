import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { LEGAL_DOCS } from "@/domain/legal";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const doc = LEGAL_DOCS.terms[locale];
  return pageMetadata(locale, {
    title: doc.title,
    description: doc.metaDescription,
    path: "/terms",
  });
}

export default async function TermsPage() {
  const locale = await getLocale();
  return <LegalPage doc={LEGAL_DOCS.terms[locale]} />;
}
