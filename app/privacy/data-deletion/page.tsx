import { getLocale } from "@/lib/i18n";
import { t } from "@/domain/messages";
import { PageHero, PageHeroTitle } from "@/components/page-hero";

export default async function DataDeletionPage() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <main>
      <PageHero size="compact" width="narrow">
        <PageHeroTitle size="sm">{t(locale, "dataDeletion")}</PageHeroTitle>
      </PageHero>
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="space-y-5 text-base leading-7 text-berry/80">
        {en ? (
          <>
            <p>
              To erase the whole account, email the owner from the address on
              the account. We will delete the brag.fast user and hosted uploads.
            </p>
            <p>
              Instagram connect is retired. There is no Instagram data-deletion
              callback anymore.
            </p>
          </>
        ) : (
          <>
            <p>
              Heel het account wissen: mail de owner vanaf het adres van het
              account. Dan gaan de brag.fast-user en geüploade media weg.
            </p>
            <p>
              Instagram-koppelen is gestopt. Er is geen Instagram
              data-deletion callback meer.
            </p>
          </>
        )}
      </div>
      </div>
    </main>
  );
}
