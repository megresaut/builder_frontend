import React, {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useFloatingLayer } from "@/hooks/useFloatingLayer";

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  contentId: string;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLElement>;
  placement: "bottom" | "top";
  align: "start" | "center" | "end";
  contentWidth?: number;
  getPositionStyle: () => any;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within <Dropdown>");
  }
  return context;
}

interface DropdownProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialPlacement?: "bottom" | "top";
  syncTriggerWidth?: boolean;
  minSpaceBelow?: number;
  offset?: number;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      children,
      open: controlledOpen,
      onOpenChange,
      initialPlacement = "bottom",
      syncTriggerWidth = false,
      minSpaceBelow = 300,
      offset = 8,
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    };

    const id = useId();
    const triggerId = `dropdown-trigger-${id}`;
    const contentId = `dropdown-content-${id}`;

    const floatingLayer = useFloatingLayer({
      open: isOpen,
      initialPlacement,
      minSpaceBelow,
      triggerWidth: syncTriggerWidth,
      offset,
    });

    const value: DropdownContextType = useMemo(
      () => ({
        open: isOpen,
        setOpen: handleOpenChange,
        triggerId,
        contentId,
        triggerRef: floatingLayer.triggerRef,
        contentRef: floatingLayer.contentRef,
        placement: floatingLayer.placement,
        align: floatingLayer.align,
        contentWidth: floatingLayer.widthValue,
        getPositionStyle: floatingLayer.getPositionStyle,
      }),
      [
        isOpen,
        triggerId,
        contentId,
        floatingLayer.triggerRef,
        floatingLayer.contentRef,
        floatingLayer.placement,
        floatingLayer.align,
        floatingLayer.widthValue,
        floatingLayer.getPositionStyle,
      ],
    );

    return (
      <DropdownContext.Provider value={value}>
        <div ref={ref} style={{ width: "100%" }}>
          {children}
        </div>
      </DropdownContext.Provider>
    );
  },
);

Dropdown.displayName = "Dropdown";

interface DropdownTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  type?: string;
}

const DropdownTrigger = React.forwardRef<HTMLElement, DropdownTriggerProps>(
  ({ asChild = false, onClick, onFocus, type, children, ...props }, ref) => {
    const { open, setOpen, triggerId, contentId, triggerRef } =
      useDropdownContext();

    const isInput = type &&
      ["text", "email", "number", "password"].includes(type);

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      if (isInput) {
        setOpen(true);
      } else {
        setOpen(!open);
      }
      onClick?.(e as any);
    };

    const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
      if (isInput) {
        setOpen(true);
      }
      onFocus?.(e as any);
    };

    const Element = isInput ? "input" : "button";

    const element = React.createElement(
      Element as any,
      {
        ref: (el: HTMLElement) => {
          // @ts-ignore - ref forwarding complexity
          triggerRef.current = el;
          if (typeof ref === "function") {
            ref(el);
          } else if (ref) {
            ref.current = el;
          }
        },
        id: triggerId,
        "aria-expanded": open,
        "aria-controls": contentId,
        onClick: handleClick,
        onFocus: isInput ? handleFocus : undefined,
        onMouseDown: isInput
          ? (e: React.MouseEvent<HTMLElement>) => {
              if (e.button === 0) {
                setOpen(true);
              }
            }
          : undefined,
        type: type || "button",
        ...props,
      },
      children,
    );

    return element;
  },
);

DropdownTrigger.displayName = "DropdownTrigger";

interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  (
    {
      children,
      closeOnOutsideClick = true,
      closeOnEscape = true,
      onClick,
      ...props
    },
    ref,
  ) => {
    const {
      open,
      setOpen,
      contentId,
      triggerId,
      triggerRef,
      contentRef,
      getPositionStyle,
      contentWidth,
    } = useDropdownContext();

    const [, forceReposition] = React.useReducer((x) => x + 1, 0);

    React.useEffect(() => {
      if (!open) return;
      const id = window.requestAnimationFrame(() => forceReposition());
      return () => window.cancelAnimationFrame(id);
    }, [open]);

    React.useEffect(() => {
      if (!open || !closeOnOutsideClick) return;

      const handlePointerDownOutside = (e: MouseEvent | PointerEvent) => {
        const target = e.target as Node | null;
        if (!target) return;

        const inContent = !!contentRef.current?.contains(target);
        const inTrigger = !!triggerRef.current?.contains(target);

        if (!inContent && !inTrigger) {
          setOpen(false);
        }
      };

      document.addEventListener("pointerdown", handlePointerDownOutside);
      return () => {
        document.removeEventListener("pointerdown", handlePointerDownOutside);
      };
    }, [open, closeOnOutsideClick, contentRef, triggerRef, setOpen]);

    React.useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }, [open, closeOnEscape, setOpen]);

    if (!open) return null;

    const positionStyle = getPositionStyle();

    const node = (
      <div
        ref={(el) => {
          // @ts-ignore - ref forwarding complexity
          contentRef.current = el;
          if (typeof ref === "function") {
            ref(el);
          } else if (ref) {
            ref.current = el;
          }
        }}
        id={contentId}
        role="menu"
        aria-labelledby={triggerId}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        style={{
          ...positionStyle,
          width: contentWidth ? `${contentWidth}px` : undefined,
          ...props.style,
        }}
        {...props}
      >
        {children}
      </div>
    );

    if (typeof document === "undefined") return node;
    return createPortal(node, document.body);
  },
);

DropdownContent.displayName = "DropdownContent";

Dropdown.Trigger = DropdownTrigger;
Dropdown.Content = DropdownContent;

export { useDropdownContext };
