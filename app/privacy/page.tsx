import { getLocale } from "@/lib/i18n";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl tracking-wide">
        {en ? "Privacy" : "Privacy"}
      </h1>
      <p className="mt-6 text-sm text-berry/55">brag.fast · http://77.42.31.66/</p>
      <div className="mt-8 space-y-5 text-base leading-7 text-berry/80">
        {en ? (
          <>
            <p>
              brag.fast is a breakfast directory. We store the account you create
              (email or Google), spots you add, and photos you upload onto those
              spots.
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
              aanmaakt (e-mail of Google), plekken die je toevoegt, en foto&apos;s
              die je op die plekken zet.
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
    </main>
  );
}
