import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Egg } from "@/components/visual";

/** A designed empty state: the egg, a Bagel title and what to do next. */
export function EggEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="mx-auto max-w-xl flex-none border border-milk bg-shell py-14">
      <EmptyHeader>
        <EmptyMedia>
          <Egg size={76} className="-rotate-8 drop-shadow-sticker" />
        </EmptyMedia>
        <EmptyTitle className="font-display text-2xl leading-tight tracking-wide text-berry sm:text-3xl">
          {title}
        </EmptyTitle>
        <EmptyDescription className="text-base leading-relaxed text-berry/70">
          {description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
