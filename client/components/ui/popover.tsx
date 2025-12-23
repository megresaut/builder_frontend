import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

interface PopoverContextType {
  triggerRef: React.RefObject<HTMLButtonElement | HTMLInputElement>;
  containerRef?: React.RefObject<HTMLDivElement>;
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
  containerRef?: React.RefObject<HTMLDivElement>;
}

const Popover = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Root>, PopoverProps>(
  ({ children, containerRef, ...props }, ref) => {
    const triggerRef = React.useRef<HTMLButtonElement | HTMLInputElement>(null);

    return (
      <PopoverContext.Provider value={{ triggerRef, containerRef }}>
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
    const { triggerRef, containerRef } = usePopoverContext();
    const localRef = React.useRef<React.ElementRef<typeof PopoverPrimitive.Content> | null>(null);
    const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>();

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

    // Get the root Popover context to close it if needed
    const getPopoverRoot = React.useCallback(() => {
      let element = localRef.current?.parentElement;
      while (element) {
        // Find the popover root by looking for the trigger
        if (element.contains(triggerRef.current)) {
          // Search up for the root which should have onOpenChange
          return element;
        }
        element = element.parentElement;
      }
      return null;
    }, [triggerRef]);

    // Monitor if popover is being clipped and close if it can't fit
    React.useEffect(() => {
      if (!localRef.current) return;

      const checkAndHandleOverflow = () => {
        const popoverRect = localRef.current?.getBoundingClientRect();
        const triggerRect = triggerRef.current?.getBoundingClientRect();

        if (!popoverRect || !triggerRect) return;

        // Determine the scroll container (modal or viewport)
        let scrollContainer = containerRef?.current || document.documentElement;
        const containerRect = scrollContainer.getBoundingClientRect?.() || {
          top: 0,
          bottom: window.innerHeight,
          left: 0,
          right: window.innerWidth,
        };

        // Check if popover extends beyond container bounds
        const isOverflowingBottom = popoverRect.bottom > containerRect.bottom - 8;
        const isOverflowingTop = popoverRect.top < containerRect.top + 8;

        // If overflowing in both directions, close the popover
        if (isOverflowingBottom && isOverflowingTop) {
          props.onOpenChange?.(false);
        }
      };

      // Check immediately and on scroll
      const timer = requestAnimationFrame(checkAndHandleOverflow);
      const handleScroll = () => {
        requestAnimationFrame(checkAndHandleOverflow);
      };

      window.addEventListener('scroll', handleScroll, true);
      document.addEventListener('scroll', handleScroll, true);

      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }, [containerRef, triggerRef, props]);


    const setRefs = (node: React.ElementRef<typeof PopoverPrimitive.Content> | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<React.ElementRef<typeof PopoverPrimitive.Content> | null>).current = node;
    };

    const content = (
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
    );

    // If containerRef is provided, render portal inside that container
    // Otherwise, render to document.body
    if (containerRef?.current) {
      return (
        <PopoverPrimitive.Portal container={containerRef.current}>
          {content}
        </PopoverPrimitive.Portal>
      );
    }

    return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>;
  },
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
