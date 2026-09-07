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
              (email or Google), spots you add, and brags you upload.
            </p>
            <p>
              If you connect Instagram we store your Instagram user id and an
              access token so we can import your posts that include #bragfast.
              We keep the permalink and show Instagram’s official embed. We do
              not download or host Instagram photos or video.
            </p>
            <p>
              A location tag on those posts is matched to a catalog spot. A
              caption-only post waits in the owner queue and is not a vote until
              approved.
            </p>
            <p>
              You can delete an in-app brag, disconnect Instagram, or ask us to
              erase your account via the data deletion page. We do not sell data.
            </p>
          </>
        ) : (
          <>
            <p>
              brag.fast is een ontbijt-directory. We bewaren het account dat je
              aanmaakt (e-mail of Google), plekken die je toevoegt, en brags die
              je uploadt.
            </p>
            <p>
              Koppel je Instagram, dan bewaren we je Instagram-user-id en een
              toegangstoken om je posts met #bragfast te importeren. We bewaren
              de permalink en tonen de officiële embed. We downloaden of hosten
              geen Instagram-foto of -video.
            </p>
            <p>
              Een locatie-tag op die posts matchen we aan een catalogusplek. Een
              post met alleen een caption gaat naar de owner-queue en telt niet
              als stem tot die is goedgekeurd.
            </p>
            <p>
              Je kunt een in-app brag verwijderen, Instagram ontkoppelen, of via
              de gegevenswissen-pagina om wissing vragen. We verkopen geen data.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
