"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { likeCountLabel, t, type Locale } from "@/domain/messages";
import { Button } from "@/components/ui/button";
import { requestSignIn } from "@/lib/sign-in-signal";

export function LikeButton({
  locale,
  spotId,
  likeCount,
}: {
  locale: Locale;
  spotId: Id<"spots">;
  likeCount: number;
}) {
  const user = useQuery(api.auth.getCurrentUser);
  const live = useQuery(api.likes.viewerLike, { spotId });
  const toggle = useMutation(api.likes.toggle);
  const liked = live?.liked ?? false;
  const count = live?.likeCount ?? likeCount;
  const pending = user === undefined || live === undefined;

  async function onClick() {
    if (pending) {
      return;
    }
    if (user === null) {
      requestSignIn();
      return;
    }
    await toggle({ spotId });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={liked ? "default" : "outline"}
      aria-pressed={liked}
      aria-label={`${t(locale, "like")}, ${likeCountLabel(locale, count)}`}
      disabled={pending}
      onClick={() => void onClick()}
    >
      {t(locale, "like")} · {count}
    </Button>
  );
}
