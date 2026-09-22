import { getLocale } from "@/lib/i18n";
import { t } from "@/domain/messages";
import { PageHero, PageHeroTitle } from "@/components/page-hero";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <main>
      <PageHero size="compact" width="narrow">
        <PageHeroTitle size="sm">{t(locale, "privacy")}</PageHeroTitle>
      </PageHero>
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12">
        <p className="text-sm text-berry/55">brag.fast · https://brag.fast/</p>
        <div className="mt-8 space-y-5 text-base leading-7 text-berry/80">
        {en ? (
          <>
            <p>
              brag.fast is a breakfast directory. We store the account you create
              (email, Google, or Apple), and the spots and photos published from the
              app.
            </p>
            <p>
              Instagram connect is retired. We do not import Instagram posts and
              we do not store Instagram tokens for new connections.
            </p>
            <p>
              You can ask us to erase your account via the data deletion page. We
              do not sell data.
            </p>
          </>
        ) : (
          <>
            <p>
              brag.fast is een ontbijt-directory. We bewaren het account dat je
              aanmaakt (e-mail, Google of Apple), en de plekken en foto&apos;s die via
              de app binnenkomen.
            </p>
            <p>
              Instagram-koppelen is gestopt. We importeren geen Instagram-posts
              en bewaren geen Instagram-tokens voor nieuwe koppelingen.
            </p>
            <p>
              Je kunt via de gegevenswissen-pagina om wissing van je account
              vragen. We verkopen geen data.
            </p>
          </>
        )}
      </div>
      </div>
    </main>
  );
}
