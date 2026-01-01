import React from "react";
import { cn } from "@/lib/utils";

/**
 * CompactInput - Base compact input for inline editing
 *
 * Optimized for inline edit contexts with:
 * - Height: 32px (vs standard 44px)
 * - Padding: 6px 12px (vs standard 8px 12px)
 * - Font size: 14px
 * - Maintains all standard input functionality
 *
 * Used as foundation for CompactCurrencyInput, CompactDateField, etc.
 */
const CompactInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", "aria-invalid": ariaInvalid, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={ariaInvalid}
      className={cn(
        "flex w-full rounded-lg border border-input bg-background text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        ariaInvalid === true && "border-red-500 border-2",
        className,
      )}
      style={{
        height: "32px",
        padding: "6px 12px",
        fontSize: "14px",
        fontWeight: 400,
        letterSpacing: "-0.28px",
        lineHeight: 1.4,
        fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
        color: "var(--color-text-primary)",
        boxSizing: "border-box",
      }}
      {...props}
    />
  );
});
CompactInput.displayName = "CompactInput";

export { CompactInput };
