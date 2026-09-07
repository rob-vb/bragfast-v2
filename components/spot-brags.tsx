"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { t, type Locale } from "@/domain/messages";
import type { FeedItem } from "@/domain/viewModels";
import { Button } from "@/components/ui/button";

function mediaTypeOf(file: File): "photo" | "video" | null {
  if (file.type.startsWith("image/")) {
    return "photo";
  }
  if (file.type.startsWith("video/")) {
    return "video";
  }
  return null;
}

async function uploadFile(
  generateUrl: () => Promise<string>,
  file: File,
): Promise<{ storageId: Id<"_storage">; mediaType: "photo" | "video" }> {
  const mediaType = mediaTypeOf(file);
  if (!mediaType) {
    throw new Error("Need a photo or short video");
  }
  const uploadUrl = await generateUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error("Upload failed");
  }
  const payload = (await response.json()) as { storageId: Id<"_storage"> };
  return { storageId: payload.storageId, mediaType };
}

function bragWhen(locale: Locale, createdAt: number): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

function HostedBrag({
  locale,
  item,
}: {
  locale: Locale;
  item: FeedItem;
}) {
  if (item.media.kind !== "hosted") {
    return null;
  }
  const { url, mediaType, placeholder } = item.media;
  return (
    <>
      {mediaType === "photo" ? (
        <img
          src={url}
          alt=""
          className={placeholder ? "sr-only" : "h-80 w-full object-cover"}
        />
      ) : (
        <video
          src={url}
          controls
          className={placeholder ? "sr-only" : "h-80 w-full object-cover"}
        />
      )}
      {placeholder ? (
        <div className="flex h-80 flex-col justify-end bg-candy/60 px-5 py-6">
          <p className="font-display text-2xl tracking-wide text-berry">
            {item.makerName}
          </p>
          <p className="mt-1 text-sm font-bold text-berry/70">
            {bragWhen(locale, item.createdAt)}
          </p>
        </div>
      ) : null}
    </>
  );
}

function openSignIn() {
  window.dispatchEvent(new Event("bragfast:open-signin"));
}

export function SpotBrags({
  locale,
  spotId,
  feed,
  closed,
}: {
  locale: Locale;
  spotId: Id<"spots">;
  feed: FeedItem[];
  closed: boolean;
}) {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUser);
  const mine = useQuery(api.brags.mineOnSpot, { spotId }) ?? [];
  const generateUploadUrl = useMutation(api.brags.generateUploadUrl);
  const create = useMutation(api.brags.create);
  const replace = useMutation(api.brags.replace);
  const remove = useMutation(api.brags.remove);
  const report = useMutation(api.brags.report);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mineSet = new Set(mine);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("media") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const uploaded = await uploadFile(generateUploadUrl, file);
      await create({ spotId, ...uploaded });
      input.value = "";
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  async function onReplace(postId: Id<"posts">, file: File) {
    setPending(true);
    setError(null);
    try {
      const uploaded = await uploadFile(generateUploadUrl, file);
      await replace({ postId, ...uploaded });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Replace failed");
    } finally {
      setPending(false);
    }
  }

  async function onRemove(postId: Id<"posts">) {
    setPending(true);
    setError(null);
    try {
      await remove({ postId });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  async function onReport(event: FormEvent<HTMLFormElement>, postId: Id<"posts">) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("reason") as HTMLInputElement;
    const reason = input.value.trim();
    if (!reason) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await report({ postId, reason });
      input.value = "";
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Report failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-10">
      {!closed && user === null ? (
        <Button type="button" onClick={openSignIn}>
          {t(locale, "loginToBrag")}
        </Button>
      ) : null}

      {!closed && user ? (
        <form className="rounded-slab border border-berry/10 bg-white p-5" onSubmit={onCreate}>
          <label className="text-sm font-bold" htmlFor="brag-media">
            {t(locale, "bragCta")}
          </label>
          <p className="mt-1 text-sm text-berry/55">{t(locale, "photoOrVideo")}</p>
          <input
            id="brag-media"
            name="media"
            type="file"
            required
            accept="image/*,video/*"
            className="mt-3 block w-full text-sm"
          />
          <Button className="mt-4" type="submit" disabled={pending}>
            {t(locale, "uploadBrag")}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm font-bold text-blush">
          {error}
        </p>
      ) : null}

      {feed.length === 0 ? (
        <p className="mt-6 text-berry/70">{t(locale, "feedEmpty")}</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {feed.map((item) => (
            <li
              key={item.postId}
              className="overflow-hidden rounded-slab bg-candy/35 shadow-rest"
            >
              {item.media.kind === "hosted" ? (
                <HostedBrag locale={locale} item={item} />
              ) : null}
              {item.media.kind === "embed" ? (
                <div className="px-5 py-4">
                  <p className="font-display text-lg tracking-wide">
                    {t(locale, "instagramEmbed")}
                  </p>
                  <a
                    href={item.media.embed.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-bold text-blush"
                  >
                    {t(locale, "viewOnInstagram")}
                  </a>
                  <p className="mt-2 font-display text-lg text-blush">
                    #bragfast
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 border-t border-berry/8 bg-white px-5 py-3">
                <p className="text-sm font-bold text-berry">
                  {item.makerName}
                  <span className="ml-2 font-semibold text-berry/55">
                    {bragWhen(locale, item.createdAt)}
                  </span>
                </p>
                {user && mineSet.has(item.postId) ? (
                  <>
                    <label className="text-sm font-bold text-blush">
                      {t(locale, "replaceBrag")}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="ml-2 text-sm"
                        disabled={pending}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) {
                            void onReplace(item.postId, file);
                          }
                        }}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => void onRemove(item.postId)}
                    >
                      {t(locale, "deleteBrag")}
                    </Button>
                  </>
                ) : null}
                {user ? (
                  <form
                    className="ml-auto flex min-w-48 flex-1 items-center gap-2"
                    onSubmit={(event) => void onReport(event, item.postId)}
                  >
                    <input
                      name="reason"
                      required
                      maxLength={280}
                      placeholder={t(locale, "reportReason")}
                      className="h-9 min-w-0 flex-1 rounded-full border border-berry/15 px-3 text-sm"
                    />
                    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
                      {t(locale, "reportBrag")}
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
