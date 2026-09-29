"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Heart } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { likeCountLabel, t, type Locale } from "@/domain/messages";
import { Button } from "@/components/ui/button";
import { requestSignIn } from "@/lib/sign-in-signal";
import { cn } from "@/lib/utils";

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
  const toggle = useMutation(api.likes.toggle).withOptimisticUpdate(
    (store, args) => {
      const current = store.getQuery(api.likes.viewerLike, args);
      if (current === undefined) {
        return;
      }
      store.setQuery(api.likes.viewerLike, args, {
        liked: !current.liked,
        likeCount: Math.max(0, current.likeCount + (current.liked ? -1 : 1)),
      });
    },
  );
  const [pops, setPops] = useState(0);
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
    if (!liked) {
      setPops((n) => n + 1);
    }
    await toggle({ spotId });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={liked ? "default" : "outline"}
      className="relative gap-1.5 pr-3.5 pl-3 text-sm after:absolute after:-inset-1.5 after:content-['']"
      aria-pressed={liked}
      aria-label={`${t(locale, "like")}, ${likeCountLabel(locale, count)}`}
      aria-busy={pending}
      onClick={() => void onClick()}
    >
      <Heart
        key={pops}
        strokeWidth={2.5}
        className={cn(
          "size-4",
          liked ? "fill-current" : "text-blush",
          pops > 0 && "like-pop",
        )}
      />
      <span className="tabular-nums">{count}</span>
    </Button>
  );
}
