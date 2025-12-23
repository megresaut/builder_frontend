import { useCallback, useRef, useState, useEffect } from "react";

type Placement = "bottom" | "top";
type Align = "start" | "center" | "end";

interface UseFloatingLayerProps {
  open: boolean;
  initialPlacement?: Placement;
  initialAlign?: Align;
  offset?: number;
  minSpaceBelow?: number;
  triggerWidth?: boolean;
}

interface FloatingPosition {
  placement: Placement;
  align: Align;
  style: {
    top?: string;
    left?: string;
    position: "fixed";
    zIndex: number;
  };
}

function getMaxAncestorZIndex(el: HTMLElement | null): number {
  let max = 0;
  let node: HTMLElement | null = el;

  while (node) {
    const zIndex = window.getComputedStyle(node).zIndex;
    if (zIndex && zIndex !== "auto") {
      const asNumber = Number.parseInt(zIndex, 10);
      if (Number.isFinite(asNumber)) {
        max = Math.max(max, asNumber);
      }
    }
    node = node.parentElement;
  }

  return max;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * findScrollableAncestors - Find all scrollable ancestor elements
 */
function findScrollableAncestors(el: HTMLElement | null): Element[] {
  const scrollables: Element[] = [];
  let current = el?.parentElement;

  while (current) {
    const style = window.getComputedStyle(current);
    const canScroll =
      current.scrollHeight > current.clientHeight ||
      current.scrollWidth > current.clientWidth;

    const hasScrollStyle =
      style.overflow === "auto" ||
      style.overflow === "scroll" ||
      style.overflowY === "auto" ||
      style.overflowY === "scroll" ||
      style.overflowX === "auto" ||
      style.overflowX === "scroll";

    if (canScroll && hasScrollStyle) {
      scrollables.push(current);
    }

    current = current.parentElement;
  }

  // Always include document and window
  scrollables.push(document.documentElement);

  return scrollables;
}

/**
 * useFloatingLayer - Manages placement, collision detection, and positioning of floating elements
 *
 * Handles:
 * - Automatic placement flipping (bottom ↔ top) based on available space
 * - All scrollable ancestor detection and monitoring
 * - Real-time repositioning on scroll/resize
 * - Optional width syncing to trigger element
 * - Modal-aware z-index stacking
 * - Consistent viewport-based coordinate system
 */
export function useFloatingLayer({
  open,
  initialPlacement = "bottom",
  initialAlign = "start",
  offset = 8,
  minSpaceBelow = 300,
  triggerWidth = false,
}: UseFloatingLayerProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  const [placement, setPlacement] = useState<Placement>(initialPlacement);
  const [align, setAlign] = useState<Align>(initialAlign);
  const [widthValue, setWidthValue] = useState<number | undefined>(undefined);
  const [computedZIndex, setComputedZIndex] = useState(50);

  // Callback to get position style - defined early to maintain hook order
  const getPositionStyle = useCallback((): FloatingPosition["style"] => {
    if (!triggerRef.current) {
      return { position: "fixed", zIndex: computedZIndex };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentEl = contentRef.current;

    // Determine content dimensions
    const contentWidth =
      widthValue ?? contentEl?.offsetWidth ?? Math.round(triggerRect.width);
    const contentHeight = contentEl?.offsetHeight ?? 0;

    const gap = offset;
    const viewportMargin = 8;

    // Calculate Y position based on placement
    let top: number;
    if (placement === "bottom") {
      top = triggerRect.bottom + gap;
    } else {
      top = triggerRect.top - contentHeight - gap;
    }

    // Calculate X position based on alignment
    let left: number;
    if (align === "end") {
      left = triggerRect.right - contentWidth;
    } else if (align === "center") {
      left = triggerRect.left + triggerRect.width / 2 - contentWidth / 2;
    } else {
      left = triggerRect.left;
    }

    // Clamp X to keep within viewport
    left = clamp(left, viewportMargin, window.innerWidth - contentWidth - viewportMargin);

    // Clamp Y but preserve the gap from the trigger
    if (contentHeight > 0) {
      const viewportMinY = viewportMargin;
      const viewportMaxY = window.innerHeight - contentHeight - viewportMargin;

      if (placement === "bottom") {
        const minTop = triggerRect.bottom + gap;
        top = Math.max(viewportMinY, minTop);
        if (top + contentHeight > window.innerHeight - viewportMargin) {
          top = Math.max(viewportMinY, window.innerHeight - contentHeight - viewportMargin);
        }
      } else {
        const maxTop = triggerRect.top - contentHeight - gap;
        top = Math.min(viewportMaxY, maxTop);
        if (top < viewportMinY) {
          top = Math.min(viewportMaxY, viewportMinY);
        }
      }
    }

    return {
      position: "fixed",
      zIndex: computedZIndex,
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
    };
  }, [align, computedZIndex, offset, placement, widthValue]);

  // Main effect for setting up all listeners and observers
  useEffect(() => {
    if (!open || !triggerRef.current) {
      // Reset state when closed
      setPlacement(initialPlacement);
      setAlign(initialAlign);
      setWidthValue(undefined);
      setComputedZIndex(50);
      return;
    }

    // Function to recalculate position based on available space
    const updatePosition = () => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentHeight = contentRef.current?.offsetHeight || minSpaceBelow;

      // Calculate available space
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      // Determine placement
      let newPlacement: Placement = initialPlacement;
      if (initialPlacement === "bottom") {
        const neededSpaceBelow = contentHeight + offset;
        if (spaceBelow < neededSpaceBelow && spaceAbove > contentHeight + offset) {
          newPlacement = "top";
        } else {
          newPlacement = "bottom";
        }
      } else {
        const neededSpaceAbove = contentHeight + offset;
        if (spaceAbove < neededSpaceAbove && spaceBelow > contentHeight + offset) {
          newPlacement = "bottom";
        } else {
          newPlacement = "top";
        }
      }
      setPlacement(newPlacement);

      // Determine horizontal alignment
      let newAlign: Align = initialAlign;
      if (initialAlign === "start") {
        const contentWidth =
          contentRef.current?.offsetWidth ?? widthValue ?? triggerRect.width;
        const spaceRight = window.innerWidth - triggerRect.left;

        if (spaceRight < contentWidth && triggerRect.right < window.innerWidth) {
          newAlign = "end";
        }
      }
      setAlign(newAlign);

      // Sync width if requested
      if (triggerWidth) {
        const nextWidth = Math.round(triggerRect.width);
        setWidthValue((prev) => (prev === nextWidth ? prev : nextWidth));
      } else {
        setWidthValue(undefined);
      }

      // Calculate z-index
      const nextZIndex = Math.max(50, getMaxAncestorZIndex(triggerRef.current) + 1);
      setComputedZIndex((prev) => (prev === nextZIndex ? prev : nextZIndex));
    };

    // Setup ResizeObserver
    const resizeObserver = new ResizeObserver(updatePosition);

    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Observe ancestor levels
    let ancestor = triggerRef.current?.parentElement;
    let depth = 0;
    while (ancestor && depth < 6) {
      resizeObserver.observe(ancestor);
      ancestor = ancestor.parentElement;
      depth++;
    }

    // Find and listen to scrollable ancestors
    const scrollables = findScrollableAncestors(triggerRef.current);
    scrollables.forEach((scrollable) => {
      scrollable.addEventListener("scroll", updatePosition, { capture: true });
    });

    // Listen to window resize
    window.addEventListener("resize", updatePosition);

    // Initial calculation
    updatePosition();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      scrollables.forEach((scrollable) => {
        scrollable.removeEventListener("scroll", updatePosition, { capture: true });
      });
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, initialPlacement, initialAlign, offset, minSpaceBelow, triggerWidth, widthValue]);

  return {
    triggerRef,
    contentRef,
    placement,
    align,
    widthValue,
    getPositionStyle,
  };
}
