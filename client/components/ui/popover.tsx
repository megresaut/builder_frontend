import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

interface PopoverContextType {
  triggerRef: React.RefObject<HTMLButtonElement | HTMLInputElement>;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const PopoverContext = React.createContext<PopoverContextType | undefined>(
  undefined,
);

const usePopoverContext = () => {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("PopoverContent must be used within Popover");
  }
  return context;
};

interface PopoverProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> {
  children?: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const Popover = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Root>,
  PopoverProps
>(({ children, containerRef, ...props }, ref) => {
  const triggerRef = React.useRef<HTMLButtonElement | HTMLInputElement>(null);

  return (
    <PopoverContext.Provider value={{ triggerRef, containerRef }}>
      <PopoverPrimitive.Root {...props} ref={ref}>
        {children}
      </PopoverPrimitive.Root>
    </PopoverContext.Provider>
  );
});
Popover.displayName = "Popover";

interface PopoverTriggerProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> {}

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  PopoverTriggerProps
>((props, ref) => {
  const { triggerRef } = usePopoverContext();

  const setRefs = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref)
      (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  };

  return <PopoverPrimitive.Trigger {...props} ref={setRefs} />;
});
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  syncTriggerWidth?: boolean;
  scrollable?: boolean; // Enable internal scrolling (default: true)
  maxHeight?: string | number; // Custom max height (default: 280px)
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
      scrollable = true,
      maxHeight = "280px",
      onWheelCapture,
      onTouchMoveCapture,
      ...props
    },
    ref,
  ) => {
    const { triggerRef, containerRef } = usePopoverContext();
    const localRef = React.useRef<React.ElementRef<
      typeof PopoverPrimitive.Content
    > | null>(null);
    const [triggerWidth, setTriggerWidth] = React.useState<
      number | undefined
    >();

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

    const setRefs = (
      node: React.ElementRef<typeof PopoverPrimitive.Content> | null,
    ) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (
          ref as React.MutableRefObject<React.ElementRef<
            typeof PopoverPrimitive.Content
          > | null>
        ).current = node;
    };

    const handleWheelCapture: React.WheelEventHandler<
      React.ElementRef<typeof PopoverPrimitive.Content>
    > = (e) => {
      onWheelCapture?.(e);
      if (!e.defaultPrevented) {
        e.stopPropagation();
      }
    };

    const handleTouchMoveCapture: React.TouchEventHandler<
      React.ElementRef<typeof PopoverPrimitive.Content>
    > = (e) => {
      onTouchMoveCapture?.(e);
      if (!e.defaultPrevented) {
        e.stopPropagation();
      }
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
        collisionPadding={32}
        avoidCollisions={true}
        sticky="never"
        hideWhenDetached={true}
        onWheelCapture={handleWheelCapture}
        onTouchMoveCapture={handleTouchMoveCapture}
        style={{
          maxHeight:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          maxWidth: "calc(100vw - 32px)",
          width: triggerWidth ? `${triggerWidth}px` : undefined,
          ...style,
          ...(scrollable && {
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }),
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

/**
 * PopoverScroll - Wrapper component for scrollable content inside PopoverContent
 *
 * Use this to explicitly mark content that should scroll when the popover is full.
 * The popover itself handles scrolling via the scrollable prop on PopoverContent.
 * This component is useful for custom scroll styling or nested scrollable areas.
 */
const PopoverScroll = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("overflow-y-auto", className)}
    style={{
      overflowY: "auto",
      overflowX: "hidden",
      overscrollBehavior: "contain",
      WebkitOverflowScrolling: "touch",
    }}
    {...props}
  >
    {children}
  </div>
));
PopoverScroll.displayName = "PopoverScroll";

export { Popover, PopoverTrigger, PopoverContent, PopoverScroll, usePopoverContext };


