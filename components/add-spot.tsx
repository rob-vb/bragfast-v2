"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { t, type Locale, type MessageKey } from "@/domain/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSignIn } from "@/lib/sign-in-signal";

const REJECT_COPY: Record<string, MessageKey> = {
  "disallowed-type": "addSpotTypeRejected",
  "photo-required": "addSpotPhotoRequired",
  "no-woonplaats": "addSpotNoWoonplaats",
};

function addErrorMessage(locale: Locale, caught: unknown): string {
  const data =
    caught && typeof caught === "object" && "data" in caught
      ? (caught as { data?: unknown }).data
      : undefined;
  if (typeof data === "string" && data in REJECT_COPY) {
    return t(locale, REJECT_COPY[data]!);
  }
  const message = caught instanceof Error ? caught.message : "";
  for (const reason of Object.keys(REJECT_COPY)) {
    if (message.includes(reason)) {
      return t(locale, REJECT_COPY[reason]!);
    }
  }
  return message.length > 0 ? message : t(locale, "addSpotPhotoRequired");
}

export function AddSpot({ locale }: { locale: Locale }) {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUser);
  const configured = useQuery(api.places.placesConfigured);
  const autocomplete = useAction(api.places.autocomplete);
  const add = useAction(api.places.add);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const [q, setQ] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [hits, setHits] = useState<
    { placeId: string; name: string; address: string }[]
  >([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === null || configured !== true) {
      return;
    }
    const needle = q.trim();
    if (needle.length < 2) {
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
    if (!photo) {
      setError(t(locale, "addSpotPhotoRequired"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const posted = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photo.type || "image/jpeg" },
        body: photo,
      });
      if (!posted.ok) {
        throw new Error(t(locale, "addSpotPhotoRequired"));
      }
      const payload = (await posted.json()) as { storageId?: string };
      if (!payload.storageId) {
        throw new Error(t(locale, "addSpotPhotoRequired"));
      }
      const result = await add({
        placeId,
        storageId: payload.storageId as Id<"_storage">,
      });
      setQ("");
      setHits([]);
      setPhoto(null);
      router.push(`/nl/${result.placeSlug}/${result.spotSlug}`);
      router.refresh();
    } catch (caught) {
      setError(addErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  if (user === undefined) {
    return null;
  }

  if (user === null) {
    return (
      <div className="mt-8">
        <Button type="button" onClick={requestSignIn}>
          {t(locale, "addSpot")}
        </Button>
      </div>
    );
  }

  if (configured === undefined) {
    return null;
  }

  if (!configured) {
    return (
      <p className="mt-8 text-sm text-berry/70">
        {t(locale, "placesUnavailable")}
      </p>
    );
  }

  const list = q.trim().length < 2 ? [] : hits;

  return (
    <form className="mt-8 max-w-xl" onSubmit={onSubmit}>
      <Label htmlFor="add-spot">{t(locale, "addSpot")}</Label>
      <Input
        id="add-spot"
        value={q}
        onChange={(event) => {
          setError(null);
          setQ(event.target.value);
        }}
        className="mt-2"
        disabled={pending}
      />
      <Label htmlFor="add-spot-photo" className="mt-4 block">
        {t(locale, "addSpotPhoto")}
      </Label>
      <Input
        id="add-spot-photo"
        type="file"
        accept="image/*"
        className="mt-2"
        disabled={pending}
        onChange={(event) => {
          setError(null);
          setPhoto(event.target.files?.[0] ?? null);
        }}
      />
      {list.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-field border border-berry/10 bg-white">
          {list.map((hit) => (
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
