"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAction, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { t, type Locale } from "@/domain/messages";
import { Button } from "@/components/ui/button";

function openSignIn() {
  window.dispatchEvent(new Event("bragfast:open-signin"));
}

export function AddSpot({
  locale,
  citySlug,
}: {
  locale: Locale;
  citySlug: string;
}) {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUser);
  const configured = useQuery(api.places.placesConfigured);
  const autocomplete = useAction(api.places.autocomplete);
  const add = useAction(api.places.add);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<
    { placeId: string; name: string; address: string }[]
  >([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === null || configured !== true) {
      setHits([]);
      return;
    }
    const needle = q.trim();
    if (needle.length < 2) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void autocomplete({ q: needle })
        .then(setHits)
        .catch((caught: unknown) => {
          setHits([]);
          setError(caught instanceof Error ? caught.message : "Search failed");
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [autocomplete, configured, q, user]);

  async function pick(placeId: string) {
    setPending(true);
    setError(null);
    try {
      await add({ placeId, citySlug });
      setQ("");
      setHits([]);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Add failed");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  if (user === undefined || configured === undefined) {
    return null;
  }

  if (user === null) {
    return (
      <div className="mt-8">
        <Button type="button" onClick={openSignIn}>
          {t(locale, "addSpot")}
        </Button>
      </div>
    );
  }

  if (!configured) {
    return (
      <p className="mt-8 text-sm text-berry/70">
        {t(locale, "placesUnavailable")}
      </p>
    );
  }

  return (
    <form className="mt-8 max-w-xl" onSubmit={onSubmit}>
      <label className="text-sm font-bold" htmlFor="add-spot">
        {t(locale, "addSpot")}
      </label>
      <input
        id="add-spot"
        value={q}
        onChange={(event) => {
          setError(null);
          setQ(event.target.value);
        }}
        className="mt-2 h-12 w-full rounded-field border border-berry/15 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-blush"
        disabled={pending}
      />
      {hits.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-field border border-berry/10 bg-white">
          {hits.map((hit) => (
            <li key={hit.placeId}>
              <button
                type="button"
                className="block w-full px-4 py-3 text-left hover:bg-milk"
                disabled={pending}
                onClick={() => void pick(hit.placeId)}
              >
                <span className="block font-bold">{hit.name}</span>
                {hit.address ? (
                  <span className="mt-0.5 block text-sm text-berry/55">
                    {hit.address}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm font-bold text-blush">
          {error}
        </p>
      ) : null}
    </form>
  );
}
