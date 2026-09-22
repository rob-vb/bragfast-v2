import type { ReactNode } from "react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function BoardEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Empty className="mx-auto max-w-xl flex-none border border-milk bg-shell py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle className="font-bold text-berry">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className="text-berry/70">
            {description}
          </EmptyDescription>
        ) : null}
      </EmptyHeader>
    </Empty>
  );
}
