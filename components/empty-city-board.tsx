import { Camera } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { t, type Locale } from "@/domain/messages";

export function EmptyCityBoard({ locale }: { locale: Locale }) {
  return (
    <Empty className="mx-auto max-w-xl flex-none border border-milk bg-shell py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Camera />
        </EmptyMedia>
        <EmptyTitle className="font-bold text-berry">
          {t(locale, "noSpotsYet")}
        </EmptyTitle>
        <EmptyDescription className="text-berry/70">
          {t(locale, "emptyBoardAppHint")}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
