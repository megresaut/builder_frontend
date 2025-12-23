import React, { createContext, useContext, useState, ReactNode } from "react";
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

/**
 * Dropdown - Shared primitive for dropdown/popover/select behavior
 * 
 * Provides:
 * - Open/close state management
 * - Floating layer positioning and collision detection
 * - A11y wiring (aria-controls, aria-expanded, roles)
 * - Child context for Trigger and Content
 * 
 * Usage:
 * ```tsx
 * <Dropdown>
 *   <Dropdown.Trigger>Open</Dropdown.Trigger>
 *   <Dropdown.Content>Menu content</Dropdown.Content>
 * </Dropdown>
 * ```
 */
export const Dropdown = React.forwardRef<
  HTMLDivElement,
  DropdownProps
>(
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

    const triggerId = `dropdown-trigger-${Math.random().toString(36).slice(2)}`;
    const contentId = `dropdown-content-${Math.random().toString(36).slice(2)}`;

    const floatingLayer = useFloatingLayer({
      open: isOpen,
      initialPlacement,
      minSpaceBelow,
      triggerWidth: syncTriggerWidth,
      offset,
    });

    const value: DropdownContextType = {
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
    };

    return (
      <DropdownContext.Provider value={value}>
        <div ref={ref} style={{ position: "relative" }}>{children}</div>
      </DropdownContext.Provider>
    );
  },
);

Dropdown.displayName = "Dropdown";

interface DropdownTriggerProps
  extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  type?: string;
}

/**
 * Dropdown.Trigger - The button/input that opens the dropdown
 *
 * Can be used as button, input, or any interactive element.
 * Automatically wired with:
 * - aria-expanded
 * - aria-controls
 * - onClick/onFocus handler for opening
 */
const DropdownTrigger = React.forwardRef<
  HTMLElement,
  DropdownTriggerProps
>(({ asChild = false, onClick, onFocus, type, ...props }, ref) => {
  const { open, setOpen, triggerId, contentId, triggerRef } =
    useDropdownContext();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setOpen(!open);
    onClick?.(e as any);
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    setOpen(true);
    onFocus?.(e as any);
  };

  const isInput = type && ["text", "email", "number", "password"].includes(type);
  const Element = isInput ? "input" : "button";

  const element = React.createElement(Element, {
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
    type: type || "button",
    ...props,
  });

  return element;
});

DropdownTrigger.displayName = "DropdownTrigger";

interface DropdownContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Close dropdown when clicking outside
   * @default true
   */
  closeOnOutsideClick?: boolean;
  /**
   * Close dropdown when pressing Escape
   * @default true
   */
  closeOnEscape?: boolean;
}

/**
 * Dropdown.Content - The floating menu/content container
 * 
 * Automatically handles:
 * - Positioning based on available space
 * - Click outside detection
 * - Escape key handling
 * - Accessibility attributes (role, aria-labelledby)
 */
const DropdownContent = React.forwardRef<
  HTMLDivElement,
  DropdownContentProps
>(
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
      contentRef,
      getPositionStyle,
      contentWidth,
    } = useDropdownContext();

    React.useEffect(() => {
      if (!open || !closeOnOutsideClick) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node) &&
          contentRef.current?.parentElement &&
          !contentRef.current.parentElement.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open, closeOnOutsideClick, contentRef, setOpen]);

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

    return (
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
  },
);

DropdownContent.displayName = "DropdownContent";

Dropdown.Trigger = DropdownTrigger;
Dropdown.Content = DropdownContent;

export { useDropdownContext };
