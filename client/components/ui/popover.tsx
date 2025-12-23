import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  syncTriggerWidth?: boolean;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      align = "start",
      sideOffset = 8,
      style,
      syncTriggerWidth = true,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<React.ElementRef<typeof PopoverPrimitive.Content> | null>(null);
    const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>();

    React.useEffect(() => {
      if (!syncTriggerWidth || !localRef.current) return;

      // Find the trigger element (PopoverPrimitive tracks this)
      const trigger = document.querySelector('[data-state="open"][role="button"]') ||
                      document.querySelector('[data-state="open"]');

      if (trigger instanceof HTMLElement) {
        setTriggerWidth(trigger.offsetWidth);
      }
    }, [syncTriggerWidth]);

    const setRefs = (node: React.ElementRef<typeof PopoverPrimitive.Content> | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<React.ElementRef<typeof PopoverPrimitive.Content> | null>).current = node;
    };

    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={setRefs}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-[999] rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className,
          )}
          collisionPadding={8}
          avoidCollisions={false}
          sticky="partial"
          hideWhenDetached={false}
          style={{
            maxHeight: "340px",
            maxWidth: "calc(100vw - 32px)",
            width: triggerWidth ? `${triggerWidth}px` : undefined,
            ...style,
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            height: "auto",
          }}
          {...props}
        />
      </PopoverPrimitive.Portal>
    );
  },
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
