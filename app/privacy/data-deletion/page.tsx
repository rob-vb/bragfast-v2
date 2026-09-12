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
    </main>
  );
}
