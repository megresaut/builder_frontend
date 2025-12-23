import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    {
      className,
      align = "center",
      sideOffset = 4,
      style,
      onWheel,
      onWheelCapture,
      onTouchMove,
      onTouchMoveCapture,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<React.ElementRef<typeof PopoverPrimitive.Content> | null>(null);
    const [isPositioned, setIsPositioned] = React.useState(false);
    const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

    const setRefs = (node: React.ElementRef<typeof PopoverPrimitive.Content> | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<React.ElementRef<typeof PopoverPrimitive.Content> | null>).current =
          node;
    };

    React.useLayoutEffect(() => {
      // Mount hidden, compute constraints, then reveal (prevents flash at 0,0)
      const dialogContents = Array.from(
        document.querySelectorAll<HTMLElement>("[data-ra-dialog-content]"),
      );
      setPortalContainer(dialogContents.length ? dialogContents[dialogContents.length - 1] : null);
      setIsPositioned(true);
      return () => {
        setIsPositioned(false);
        setPortalContainer(null);
      };
    }, []);

    const collisionBoundary =
      (props as React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>).collisionBoundary ??
      portalContainer ??
      undefined;

    return (
      <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
        <PopoverPrimitive.Content
          ref={setRefs}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className,
          )}
          collisionBoundary={collisionBoundary}
          collisionPadding={
            (props as React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>).collisionPadding ??
            8
          }
          avoidCollisions={
            (props as React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>).avoidCollisions ??
            true
          }
          sticky={
            (props as React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>).sticky ?? "always"
          }
          hideWhenDetached={
            (props as React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>).hideWhenDetached ??
            true
          }
          style={{
            maxHeight: "calc(100vh - 40px)",
            maxWidth: "calc(100vw - 32px)",
            ...style,
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            visibility: isPositioned ? "visible" : "hidden",
          }}
          onWheel={(e) => {
            onWheel?.(e);
            e.stopPropagation();
          }}
          onWheelCapture={(e) => {
            onWheelCapture?.(e);
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            onTouchMove?.(e);
            e.stopPropagation();
          }}
          onTouchMoveCapture={(e) => {
            onTouchMoveCapture?.(e);
            e.stopPropagation();
          }}
          {...props}
        />
      </PopoverPrimitive.Portal>
    );
  },
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
