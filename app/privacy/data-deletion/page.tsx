import { getLocale } from "@/lib/i18n";

export default async function DataDeletionPage() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl tracking-wide">
        {en ? "Delete my data" : "Gegevens wissen"}
      </h1>
      <div className="mt-8 space-y-5 text-base leading-7 text-berry/80">
        {en ? (
          <>
            <p>
              Signed in, use Disconnect Instagram to drop the Instagram user id
              and access token. Delete each in-app brag from the spot page.
            </p>
            <p>
              To erase the whole account, email the owner from the address on
              the account. We will delete the brag.fast user, votes, and hosted
              uploads. Instagram embeds already on a spot stay as permalinks to
              content you posted on Instagram.
            </p>
            <p>
              Meta can also send a data-deletion request to our callback. We
              then unlink Instagram from that account.
            </p>
          </>
        ) : (
          <>
            <p>
              Ingelogd: gebruik Ontkoppel Instagram om user-id en token te
              wissen. Verwijder in-app brags op de spotpagina.
            </p>
            <p>
              Heel het account wissen: mail de owner vanaf het adres van het
              account. Dan gaan de brag.fast-user, stemmen en geüploade media
              weg. Instagram-embeds die al op een plek staan blijven permalinks
              naar wat jij op Instagram zette.
            </p>
            <p>
              Meta kan ook een data-deletion request naar onze callback sturen.
              Dan ontkoppelen we Instagram van dat account.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
