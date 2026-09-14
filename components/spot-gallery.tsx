"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { t, type Locale } from "@/domain/messages";
import { Button } from "@/components/ui/button";

export function SpotGallery({
  locale,
  spotId,
  photos,
}: {
  locale: Locale;
  spotId: Id<"spots">;
  photos: { id: Id<"photos">; url: string }[];
}) {
  const live = useQuery(
    api.photos.listForSpot,
    photos.length > 0 ? { spotId } : "skip",
  );
  const deleteOwn = useMutation(api.photos.deleteOwn);
  const rows =
    live ??
    photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      mine: false,
      createdAt: 0,
    }));

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="mt-10" aria-label={t(locale, "gallery")}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((photo) => (
          <li key={photo.id} className="overflow-hidden rounded-field bg-milk">
            <img
              src={photo.url}
              alt=""
              className="aspect-[4/3] w-full object-cover"
            />
            {photo.mine ? (
              <div className="p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void deleteOwn({ photoId: photo.id });
                  }}
                >
                  {t(locale, "deletePhoto")}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
