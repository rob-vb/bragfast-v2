import { forwardRef } from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

export type InputProps = Omit<InputPrimitive.Props, "className"> & {
  className?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <InputPrimitive
      ref={ref}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-field border border-berry/15 bg-white px-4 text-sm text-berry outline-none transition-colors placeholder:text-berry/45 focus-visible:ring-2 focus-visible:ring-blush disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-blush aria-invalid:ring-2 aria-invalid:ring-blush/30",
        className,
      )}
      {...props}
    />
  );
});
