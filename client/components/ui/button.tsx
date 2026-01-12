import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button styling variants using class-variance-authority
 *
 * @param variant - Button style variant
 *   - default: Primary blue button
 *   - destructive: Red button for dangerous actions
 *   - outline: Bordered button with transparent background
 *   - secondary: Light button for secondary actions
 *   - ghost: No border or background
 *   - link: Text link style
 *   - mainBlue: Main action button with prominent blue (#2463eb) background
 *
 * @param size - Button size
 *   - default: Standard button height
 *   - sm: Smaller button
 *   - lg: Larger button
 *   - icon: Square icon button
 *
 * @example
 * <Button variant="default">Click me</Button>
 * <Button variant="destructive" size="sm">Delete</Button>
 * <Button variant="outline">Cancel</Button>
 * <Button asChild><a href="/path">Link</a></Button>
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        mainBlue: "h-9 px-3 rounded-lg border border-white bg-[#2463eb] text-white shadow-[0_0_0_1px_#1e4fb0] transition-colors hover:bg-[#1a52c4] font-medium text-base leading-normal",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Props for the Button component
 *
 * @property variant - Button style variant (default: "default")
 * @property size - Button size (default: "default")
 * @property asChild - If true, renders as child element for polymorphic usage
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Button component - Core button element
 *
 * A flexible button component that supports multiple variants and sizes.
 * Uses Radix Slot for polymorphic rendering when asChild={true}.
 *
 * @param props - Button props
 * @param ref - Forward ref for accessing DOM element
 *
 * @example
 * // Basic button
 * <Button>Click me</Button>
 *
 * // With variant and size
 * <Button variant="destructive" size="lg">Delete Item</Button>
 *
 * // As different element
 * <Button asChild>
 *   <a href="/page">Navigate</a>
 * </Button>
 *
 * // Icon button
 * <Button size="icon">
 *   <Icon />
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
