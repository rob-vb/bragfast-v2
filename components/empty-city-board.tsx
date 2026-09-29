import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Egg } from "@/components/visual";
import { t, type Locale } from "@/domain/messages";

export function EmptyCityBoard({ locale }: { locale: Locale }) {
  return (
    <Empty className="mx-auto max-w-xl flex-none border border-milk bg-shell py-14">
      <EmptyHeader>
        <EmptyMedia>
          <Egg size={76} className="-rotate-8 drop-shadow-sticker" />
        </EmptyMedia>
        <EmptyTitle className="font-display text-2xl leading-tight tracking-wide text-berry sm:text-3xl">
          {t(locale, "noSpotsYet")}
        </EmptyTitle>
        <EmptyDescription className="text-base leading-relaxed text-berry/70">
          {t(locale, "emptyBoardAppHint")}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
