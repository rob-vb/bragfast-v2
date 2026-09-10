"use client";

import type { ReactElement, ReactNode, RefObject } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  closeLabel: string;
  description?: ReactNode;
  trigger?: ReactElement;
  children: ReactNode;
  className?: string;
  initialFocus?: RefObject<HTMLElement | null>;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  closeLabel,
  description,
  trigger,
  children,
  className,
  initialFocus,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      modal
    >
      {trigger ? <DialogPrimitive.Trigger render={trigger} /> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-slot="dialog-backdrop"
          className="fixed inset-0 z-50 bg-berry/45 backdrop-blur-sm transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0"
        />
        <DialogPrimitive.Popup
          data-slot="dialog-popup"
          initialFocus={initialFocus}
          className={cn(
            "fixed inset-x-3 bottom-3 z-50 w-auto rounded-slab bg-white p-6 text-berry shadow-lift outline-none",
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-8",
            "transition-[opacity,transform] duration-150 data-starting-style:opacity-0 data-starting-style:translate-y-3 data-ending-style:opacity-0 sm:data-starting-style:translate-y-[calc(-50%+0.75rem)]",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-5">
            <div>
              <DialogPrimitive.Title className="font-display text-3xl tracking-wide">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-berry/70">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={closeLabel}
                />
              }
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
