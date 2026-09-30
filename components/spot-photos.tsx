"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Camera, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  othersLabel,
  photoLikesLabel,
  photoPosition,
  shortDate,
  t,
  type Locale,
} from "@/domain/messages";
import { photoCredits } from "@/domain/photo";
import type { SpotPagePhoto } from "@/domain/viewModels";
import { LikeButton } from "@/components/like-button";
import { notify } from "@/components/ui/toast";
import { photoSrc } from "@/lib/photo-src";
import { cn } from "@/lib/utils";

/** Names a credit line spells out before it counts the rest. */
const CREDITS_NAMED = 5;

/**
 * The spot's photos as prints on milk slabs. A print opens the lightbox; the
 * last cell is an open slot that points at the app, where photos are added.
 */
export function SpotPhotos({
  locale,
  name,
  spotId,
  likeCount,
  photos,
}: {
  locale: Locale;
  name: string;
  spotId: Id<"spots">;
  likeCount: number;
  photos: SpotPagePhoto[];
}) {
  const viewerId = useQuery(api.photos.viewerId);
  const brought = useQuery(api.likes.likesBrought, { spotId });
  const remove = useMutation(api.photos.deleteOwn);
  const router = useRouter();
  const [gone, setGone] = useState<ReadonlySet<string>>(() => new Set());
  const [open, setOpen] = useState<number | null>(null);
  // Live counts once the query lands; the server render's until then
  const counts = brought && new Map(brought.map((row) => [row.photoId, row.count]));
  const shown = photos
    .filter((photo) => !gone.has(photo.id))
    .map((photo) =>
      counts ? { ...photo, likesBrought: counts.get(photo.id) ?? 0 } : photo,
    );

  async function onDelete(photo: SpotPagePhoto) {
    setGone((prev) => new Set(prev).add(photo.id));
    try {
      await remove({ photoId: photo.id as Id<"photos"> });
      // The hero may have moved to the next photo
      router.refresh();
    } catch {
      setGone((prev) => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
      notify(t(locale, "deletePhotoFailed"));
    }
  }

  return (
    <section aria-labelledby="photos-heading">
      <h2
        id="photos-heading"
        className="flex items-baseline gap-3 font-display text-3xl tracking-wide text-berry sm:text-4xl"
      >
        {t(locale, "photosHeading")}
        {shown.length > 0 ? (
          <span className="font-body text-lg font-extrabold text-berry/50 tabular-nums">
            {shown.length}
          </span>
        ) : null}
      </h2>
      <PhotoCredits locale={locale} slugs={photoCredits(shown)} />
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {shown.map((photo, index) => {
          const own =
            viewerId !== undefined &&
            viewerId !== null &&
            viewerId === photo.uploadedBy;
          return (
            <li key={photo.id} className="relative">
              <button
                type="button"
                onClick={() => setOpen(index)}
                aria-label={photoPosition(locale, index + 1, shown.length)}
                className="group/tile block w-full rounded-slab bg-milk p-2 transition-[translate,scale,box-shadow] duration-300 ease-out-strong focus-visible:outline-offset-2 active:scale-[0.985] pointer-fine:hover:-translate-y-1 pointer-fine:hover:shadow-lift"
              >
                <span className="relative block aspect-square overflow-hidden rounded-[1.25rem] bg-candy/40">
                  <img
                    {...photoSrc(photo.url, "(min-width: 72rem) 20rem, (min-width: 64rem) 29vw, 50vw")}
                    alt=""
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-strong pointer-fine:group-hover/tile:scale-[1.045]"
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-berry/10 ring-inset" />
                </span>
              </button>
              {own ? (
                <DeletePhoto locale={locale} onConfirm={() => void onDelete(photo)} />
              ) : null}
            </li>
          );
        })}
        <li className="@container odd:col-span-2">
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-slab border-2 border-dashed border-candy/70 bg-shell px-4 py-6 text-center @md:flex-row @md:justify-start @md:gap-5 @md:px-7 @md:text-left">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-yolk shadow-stamp">
              <Camera aria-hidden className="size-5 text-blush" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-display text-lg leading-tight tracking-wide text-balance text-berry @[12rem]:text-xl">
                {t(locale, "appRowPhotosTitle")}
              </span>
              <span className="mt-1 hidden text-sm font-semibold text-berry/70 @[12rem]:block">
                {t(locale, "appRowPhotosBody")}
              </span>
            </span>
          </div>
        </li>
      </ul>
      <Lightbox
        locale={locale}
        name={name}
        spotId={spotId}
        likeCount={likeCount}
        photos={shown}
        index={open}
        onIndex={setOpen}
      />
    </section>
  );
}

/** "In beeld dankzij @anna, @bram en 3 anderen": who the gallery is thanks to. */
function PhotoCredits({ locale, slugs }: { locale: Locale; slugs: string[] }) {
  if (slugs.length === 0) {
    return null;
  }
  // Never "and 1 other": a sixth name fits where that would
  const named =
    slugs.length > CREDITS_NAMED + 1 ? slugs.slice(0, CREDITS_NAMED) : slugs;
  const rest = slugs.length - named.length;
  const parts = [
    ...named.map((slug) => (
      <Link
        key={slug}
        href={`/u/${slug}`}
        className="font-bold text-berry transition-colors duration-press ease-out-strong pointer-fine:hover:text-blush"
      >
        <span className="text-blush">@</span>
        {slug}
      </Link>
    )),
    ...(rest > 0 ? [<span key="rest">{othersLabel(locale, rest)}</span>] : []),
  ];
  return (
    <p className="mt-2 text-base font-semibold text-berry/70">
      {t(locale, "photoCreditsLead")}{" "}
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i === 0 ? null : i === parts.length - 1 ? ` ${t(locale, "and")} ` : ", "}
          {part}
        </Fragment>
      ))}
    </p>
  );
}

/** Two presses to delete: the first arms the pill, the second deletes. */
function DeletePhoto({
  locale,
  onConfirm,
}: {
  locale: Locale;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) {
      return;
    }
    const id = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
      aria-label={t(locale, armed ? "confirmDeletePhoto" : "deletePhoto")}
      className={cn(
        "absolute top-4 right-4 z-10 inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-bold shadow-[0_4px_12px_rgb(74_21_52/0.22)] transition-[background-color,color,transform] duration-press ease-out-strong active:scale-[0.97] after:absolute after:-inset-1 after:content-['']",
        armed
          ? "bg-blush pr-3.5 text-white"
          : "bg-white/92 text-berry pointer-fine:hover:text-blush",
      )}
    >
      <Trash2 aria-hidden className="size-4" strokeWidth={2.5} />
      {armed ? <span aria-hidden>{t(locale, "confirmDeletePhoto")}</span> : null}
    </button>
  );
}

function Lightbox({
  locale,
  name,
  spotId,
  likeCount,
  photos,
  index,
  onIndex,
}: {
  locale: Locale;
  name: string;
  spotId: Id<"spots">;
  likeCount: number;
  photos: SpotPagePhoto[];
  index: number | null;
  onIndex: (index: number | null) => void;
}) {
  const [step, setStep] = useState(0);
  const press = useRef<number | null>(null);
  const total = photos.length;
  const at = index === null || total === 0 ? null : Math.min(index, total - 1);
  // Hold the last photo on screen while the lightbox fades out
  const [held, setHeld] = useState<number | null>(at);
  if (at !== null && at !== held) {
    setHeld(at);
  }
  const heldAt = held === null ? null : Math.min(held, total - 1);
  const shown =
    heldAt !== null && photos[heldAt]
      ? { photo: photos[heldAt], at: heldAt }
      : null;

  function go(by: number) {
    if (at === null || total < 2) {
      return;
    }
    setStep(by);
    onIndex((at + by + total) % total);
  }

  function onPointerDown(event: PointerEvent) {
    press.current = event.pointerType === "mouse" ? null : event.clientX;
  }

  function onPointerUp(event: PointerEvent) {
    if (press.current === null) {
      return;
    }
    const dx = event.clientX - press.current;
    press.current = null;
    if (Math.abs(dx) > 48) {
      go(dx < 0 ? 1 : -1);
    }
  }

  const arrow =
    "grid size-12 place-items-center rounded-full bg-white/12 text-white transition-[background-color,transform] duration-press ease-out-strong active:scale-[0.94] pointer-fine:hover:bg-white/22";

  return (
    <DialogPrimitive.Root
      open={at !== null}
      onOpenChange={(next) => {
        if (!next) {
          setStep(0);
          onIndex(null);
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-slot="dialog-backdrop"
          className="fixed inset-0 z-50 bg-berry/94 backdrop-blur-md transition-opacity duration-modal ease-out-strong data-starting-style:opacity-0 data-ending-style:opacity-0"
        />
        <DialogPrimitive.Popup
          data-slot="dialog-popup"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              go(1);
            } else if (event.key === "ArrowLeft") {
              go(-1);
            }
          }}
          className="fixed inset-0 z-50 flex flex-col text-white outline-none transition-[opacity,scale] duration-modal ease-out-strong data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.97] data-ending-style:opacity-0"
        >
          {shown ? (
            <>
              <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-5">
                <DialogPrimitive.Title className="text-sm font-bold text-milk tabular-nums">
                  {photoPosition(locale, shown.at + 1, total)}
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  aria-label={t(locale, "close")}
                  className={arrow}
                >
                  <X aria-hidden className="size-5" strokeWidth={2.5} />
                </DialogPrimitive.Close>
              </div>
              <div
                className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-4 py-4 sm:px-24"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
              >
                <img
                  key={shown.photo.id}
                  {...photoSrc(shown.photo.url, "100vw")}
                  alt={`${name}, ${photoPosition(locale, shown.at + 1, total)}`}
                  draggable={false}
                  style={{ "--from": step } as CSSProperties}
                  className="lightbox-photo max-h-[calc(100svh-14rem)] max-w-full rounded-[1.25rem] object-contain select-none"
                />
                {total > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label={t(locale, "previousPhoto")}
                      className={cn(arrow, "absolute top-1/2 left-6 hidden -translate-y-1/2 sm:grid")}
                    >
                      <ChevronLeft aria-hidden className="size-6" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label={t(locale, "nextPhoto")}
                      className={cn(arrow, "absolute top-1/2 right-6 hidden -translate-y-1/2 sm:grid")}
                    >
                      <ChevronRight aria-hidden className="size-6" strokeWidth={2.5} />
                    </button>
                  </>
                ) : null}
              </div>
              <div className="flex min-h-20 items-center justify-between gap-4 px-4 pb-5 sm:justify-center sm:px-6">
                {total > 1 ? (
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label={t(locale, "previousPhoto")}
                    className={cn(arrow, "sm:hidden")}
                  >
                    <ChevronLeft aria-hidden className="size-6" strokeWidth={2.5} />
                  </button>
                ) : null}
                <div className="flex min-w-0 flex-col items-center gap-3">
                  <p className="min-w-0 text-center text-sm font-semibold text-milk">
                    {shown.photo.uploaderSlug ? (
                      <>
                        <Link
                          href={`/u/${shown.photo.uploaderSlug}`}
                          className="font-display text-lg tracking-wide text-white transition-colors duration-press ease-out-strong pointer-fine:hover:text-yolk"
                        >
                          <span className="text-candy">@</span>
                          {shown.photo.uploaderSlug}
                        </Link>
                        <span aria-hidden className="mx-2 text-milk/50">
                          ·
                        </span>
                      </>
                    ) : null}
                    <time
                      dateTime={new Date(shown.photo.createdAt).toISOString()}
                      className="tabular-nums"
                    >
                      {shortDate(locale, shown.photo.createdAt)}
                    </time>
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    <LikeButton
                      locale={locale}
                      spotId={spotId}
                      photoId={shown.photo.id}
                      likeCount={likeCount}
                      size="lg"
                    />
                    {shown.photo.likesBrought > 0 ? (
                      <p className="text-sm font-bold text-milk tabular-nums">
                        {photoLikesLabel(locale, shown.photo.likesBrought)}
                      </p>
                    ) : null}
                  </div>
                </div>
                {total > 1 ? (
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label={t(locale, "nextPhoto")}
                    className={cn(arrow, "sm:hidden")}
                  >
                    <ChevronRight aria-hidden className="size-6" strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
