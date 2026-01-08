import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  compact?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, "aria-invalid": ariaInvalid, compact = false, ...rest }, ref) => {
    // Defensive: prevent accidental non-DOM props from reaching the native input
    const { errorMessage: _errorMessage, errormessage: _errormessage, ...props } =
      rest as any;

    return (
      <input
        type={type}
        aria-invalid={ariaInvalid}
        className={cn(
          "flex w-full rounded-md border border-input bg-background text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          compact ? "h-8 px-3 py-1" : "h-11 px-3 py-2",
          ariaInvalid === true && "border-red-500 border-2",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
