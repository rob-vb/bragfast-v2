"use client";

import type { ComponentProps } from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Combobox = ComboboxPrimitive.Root;

export function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

export function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-4 text-berry/55" />
    </ComboboxPrimitive.Trigger>
  );
}

export function ComboboxClear({
  className,
  ...props
}: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full text-berry/55 hover:text-blush",
        className,
      )}
      {...props}
    >
      <XIcon className="pointer-events-none size-3.5" />
    </ComboboxPrimitive.Clear>
  );
}

export function ComboboxInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        "min-w-0 flex-1 bg-transparent text-base text-berry outline-none placeholder:text-berry/45",
        className,
      )}
      {...props}
    />
  );
}

export function ComboboxInputGroup({
  className,
  ...props
}: ComboboxPrimitive.InputGroup.Props) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn(className)}
      {...props}
    />
  );
}

export function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  collisionAvoidance,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "align" | "alignOffset" | "anchor" | "collisionAvoidance" | "side" | "sideOffset"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        collisionAvoidance={collisionAvoidance}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "group/combobox-content relative z-50 w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-slab bg-white py-1 text-berry shadow-lift outline-none",
            "transition-[opacity,transform] duration-popover ease-out-strong",
            "data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.97] data-ending-style:opacity-0",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

export function ComboboxList({
  className,
  ...props
}: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "max-h-72 scroll-py-1 overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    />
  );
}

export function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 px-4 py-2.5 text-sm font-bold outline-none select-none",
        "data-highlighted:bg-milk data-highlighted:text-berry data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2.5 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none size-3.5 text-blush" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

export function ComboboxGroup({
  className,
  ...props
}: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

export function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("px-3 py-1.5 text-xs font-bold text-berry/55", className)}
      {...props}
    />
  );
}

export function ComboboxCollection({
  ...props
}: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

export function ComboboxEmpty({
  className,
  ...props
}: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full px-4 py-3 text-sm font-semibold text-berry/80 group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

export function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("pointer-events-none my-1 h-px bg-berry/12", className)}
      {...props}
    />
  );
}

export function ComboboxChips({
  className,
  ...props
}: ComponentProps<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1.5 rounded-field border border-berry/15 bg-white px-2.5 py-1.5 text-sm text-berry",
        "focus-within:ring-2 focus-within:ring-yolk",
        className,
      )}
      {...props}
    />
  );
}

export function ComboboxChip({
  className,
  children,
  ...props
}: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-6 w-fit items-center justify-center gap-1 rounded-full bg-milk px-2 text-xs font-bold text-berry",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ChipRemove
        className="text-berry/55 hover:text-blush"
        data-slot="combobox-chip-remove"
      >
        <XIcon className="pointer-events-none size-3" />
      </ComboboxPrimitive.ChipRemove>
    </ComboboxPrimitive.Chip>
  );
}

export function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn(
        "min-w-16 flex-1 bg-transparent text-sm text-berry outline-none",
        className,
      )}
      {...props}
    />
  );
}
