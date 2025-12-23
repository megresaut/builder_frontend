import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

interface PopoverContextType {
  triggerRef: React.RefObject<HTMLButtonElement | HTMLInputElement>;
}

const PopoverContext = React.createContext<PopoverContextType | undefined>(undefined);

const usePopoverContext = () => {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("PopoverContent must be used within Popover");
  }
  return context;
};

interface PopoverProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> {
  children?: React.ReactNode;
}

const Popover = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Root>, PopoverProps>(
  ({ children, ...props }, ref) => {
    const triggerRef = React.useRef<HTMLButtonElement | HTMLInputElement>(null);

    return (
      <PopoverContext.Provider value={{ triggerRef }}>
        <PopoverPrimitive.Root {...props} ref={ref}>
          {children}
        </PopoverPrimitive.Root>
      </PopoverContext.Provider>
    );
  }
);
Popover.displayName = "Popover";

interface PopoverTriggerProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> {}

const PopoverTrigger = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Trigger>, PopoverTriggerProps>(
  (props, ref) => {
    const { triggerRef } = usePopoverContext();

    const setRefs = (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    };

    return <PopoverPrimitive.Trigger {...props} ref={setRefs} />;
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

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
    const { triggerRef } = usePopoverContext();
    const localRef = React.useRef<React.ElementRef<typeof PopoverPrimitive.Content> | null>(null);
    const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>();
    const rootContext = React.useContext(PopoverPrimitive.PopoverContext);

    React.useEffect(() => {
      if (!syncTriggerWidth || !triggerRef.current) return;

      const trigger = triggerRef.current;
      const updateWidth = () => {
        setTriggerWidth(trigger.offsetWidth);
      };

      // Initial measurement
      updateWidth();

      // Use ResizeObserver to track trigger width changes
      const resizeObserver = new ResizeObserver(() => {
        updateWidth();
      });

      resizeObserver.observe(trigger);

      return () => {
        resizeObserver.disconnect();
      };
    }, [syncTriggerWidth, triggerRef]);

    // Monitor if popover is being clipped by the viewport
    React.useEffect(() => {
      if (!localRef.current) return;

      const checkOverflow = () => {
        const popoverRect = localRef.current?.getBoundingClientRect();
        if (!popoverRect) return;

        // Get the scrollable parent (modal or viewport)
        let parent = localRef.current?.parentElement;
        let isClipped = false;

        while (parent) {
          const parentRect = parent.getBoundingClientRect();
          const style = window.getComputedStyle(parent);

          // Check if this is a scrollable container (has overflow)
          if (style.overflow === 'auto' || style.overflow === 'hidden' || style.overflowY === 'auto' || style.overflowY === 'hidden') {
            // Check if popover extends beyond parent bounds
            if (popoverRect.bottom > parentRect.bottom || popoverRect.top < parentRect.top) {
              isClipped = true;
              break;
            }
          }
          parent = parent.parentElement;
        }

        // Also check viewport
        if (popoverRect.bottom > window.innerHeight) {
          isClipped = true;
        }

        // If clipped, close the popover
        if (isClipped && rootContext?.open) {
          rootContext?.onOpenChange?.(false);
        }
      };

      const timer = setTimeout(checkOverflow, 50);
      const scrollListener = () => checkOverflow();

      window.addEventListener('scroll', scrollListener, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', scrollListener, true);
      };
    }, [rootContext]);

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
          side="bottom"
          sideOffset={sideOffset}
          className={cn(
            "z-[999] rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className,
          )}
          collisionPadding={16}
          avoidCollisions={true}
          sticky="never"
          hideWhenDetached={true}
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
