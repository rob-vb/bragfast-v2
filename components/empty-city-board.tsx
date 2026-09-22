import { Camera } from "lucide-react";
import { BoardEmpty } from "@/components/board-empty";
import { t, type Locale } from "@/domain/messages";

export function EmptyCityBoard({ locale }: { locale: Locale }) {
  return (
    <BoardEmpty
      icon={<Camera />}
      title={t(locale, "noSpotsYet")}
      description={t(locale, "emptyBoardAppHint")}
    />
  );
}
