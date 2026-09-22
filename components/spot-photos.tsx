"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { t, type Locale } from "@/domain/messages";
import type { SpotPagePhoto } from "@/domain/viewModels";
import { Button } from "@/components/ui/button";

export function SpotPhotos({
  locale,
  photos,
}: {
  locale: Locale;
  photos: SpotPagePhoto[];
}) {
  const viewerId = useQuery(api.photos.viewerId);
  const remove = useMutation(api.photos.deleteOwn);

  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-wide text-berry">
        {t(locale, "photosHeading")}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {photos.map((photo) => {
          const own =
            viewerId !== undefined &&
            viewerId !== null &&
            viewerId === photo.uploadedBy;
          return (
            <li key={photo.id} className="overflow-hidden rounded-slab bg-milk">
              <div className="relative aspect-[4/3] outline outline-1 -outline-offset-1 outline-black/10">
                <img
                  src={photo.url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              {own ? (
                <div className="px-4 py-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void remove({ photoId: photo.id as Id<"photos"> })
                    }
                  >
                    {t(locale, "deletePhoto")}
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
