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
 * Returns array of elements that can scroll (including document/window)
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
 * - Automatic placement flipping (bottom ↔ top) based on available space (no freezing)
 * - All scrollable ancestor detection and monitoring
 * - Real-time repositioning on scroll/resize
 * - Optional width syncing to trigger element
 * - Modal-aware z-index stacking
 * - Consistent coordinate system (all positions use viewport/fixed coordinates)
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
  const [scrollParents, setScrollParents] = useState<Element[]>([]);
  const [computedZIndex, setComputedZIndex] = useState(50);

  /**
   * calculatePosition - Compute placement (top/bottom) based on available space
   * This runs on every scroll/resize and can flip placement both directions
   */
  const calculatePosition = useCallback(() => {
    if (!open || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentHeight = contentRef.current?.offsetHeight || minSpaceBelow;

    // Calculate available space in viewport
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Decide placement based on available space
    // Prefer bottom initially, but flip to top if not enough space below
    let newPlacement: Placement = initialPlacement;

    if (initialPlacement === "bottom") {
      // Check if there's enough space below
      const neededSpaceBelow = contentHeight + offset;
      if (spaceBelow < neededSpaceBelow && spaceAbove > contentHeight + offset) {
        newPlacement = "top";
      } else {
        newPlacement = "bottom";
      }
    } else {
      // initialPlacement === "top"
      const neededSpaceAbove = contentHeight + offset;
      if (spaceAbove < neededSpaceAbove && spaceBelow > contentHeight + offset) {
        newPlacement = "bottom";
      } else {
        newPlacement = "top";
      }
    }

    setPlacement(newPlacement);

    // Calculate horizontal alignment
    let newAlign: Align = initialAlign;
    if (initialAlign === "start") {
      const contentWidth = contentRef.current?.offsetWidth ?? widthValue ?? triggerRect.width;
      const spaceRight = window.innerWidth - triggerRect.left;

      // If not enough space on right, try to shift left
      if (spaceRight < contentWidth && triggerRect.right < window.innerWidth) {
        newAlign = "end";
      }
    }
    setAlign(newAlign);

    // Sync width to trigger if requested
    if (triggerWidth) {
      const nextWidth = Math.round(triggerRect.width);
      setWidthValue((prev) => (prev === nextWidth ? prev : nextWidth));
    } else {
      setWidthValue(undefined);
    }

    // Calculate z-index based on ancestors
    const nextZIndex = Math.max(50, getMaxAncestorZIndex(triggerRef.current) + 1);
    setComputedZIndex((prev) => (prev === nextZIndex ? prev : nextZIndex));
  }, [
    open,
    initialPlacement,
    initialAlign,
    minSpaceBelow,
    triggerWidth,
    widthValue,
    offset,
  ]);

  /**
   * Setup scroll listeners on all scrollable ancestors
   * This ensures position updates whenever ANY ancestor scrolls
   */
  useEffect(() => {
    if (!open) {
      setPlacement(initialPlacement);
      setAlign(initialAlign);
      setWidthValue(undefined);
      setScrollParents([]);
      setComputedZIndex(50);
      return;
    }

    // Find all scrollable ancestors
    const scrollables = findScrollableAncestors(triggerRef.current);
    setScrollParents(scrollables);

    // ResizeObserver to detect content size changes
    const resizeObserver = new ResizeObserver(() => {
      calculatePosition();
    });

    // Observe trigger (in case it changes size)
    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }

    // Observe content (in case it changes size)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Observe a few ancestor levels (for container resizes)
    let ancestor = triggerRef.current?.parentElement;
    let depth = 0;
    while (ancestor && depth < 6) {
      resizeObserver.observe(ancestor);
      ancestor = ancestor.parentElement;
      depth++;
    }

    // Scroll handler - recompute position on every scroll
    const handleScroll = () => {
      calculatePosition();
    };

    // Listen to scroll on all scrollable ancestors (capture phase for reliability)
    scrollables.forEach((scrollable) => {
      scrollable.addEventListener("scroll", handleScroll, { capture: true });
    });

    // Also listen to window resize
    const handleResize = () => {
      calculatePosition();
    };
    window.addEventListener("resize", handleResize);

    // Initial position calculation
    calculatePosition();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      scrollables.forEach((scrollable) => {
        scrollable.removeEventListener("scroll", handleScroll, { capture: true });
      });
      window.removeEventListener("resize", handleResize);
    };
  }, [open, calculatePosition, initialPlacement, initialAlign]);

  /**
   * getPositionStyle - Convert trigger position to fixed coordinates for the dropdown
   * 
   * Uses viewport-based coordinates (position: fixed) since content is portaled to body.
   * Anchors the dropdown to the trigger:
   * - Bottom placement: y = trigger.bottom + offset
   * - Top placement: y = trigger.top - contentHeight - offset
   * - Horizontal: aligned based on trigger position and content width
   */
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
      // Bottom: dropdown sits directly below trigger
      top = triggerRect.bottom + gap;
    } else {
      // Top: dropdown sits directly above trigger
      top = triggerRect.top - contentHeight - gap;
    }

    // Calculate X position based on alignment
    let left: number;
    if (align === "end") {
      left = triggerRect.right - contentWidth;
    } else if (align === "center") {
      left = triggerRect.left + triggerRect.width / 2 - contentWidth / 2;
    } else {
      // "start" (default)
      left = triggerRect.left;
    }

    // Clamp X to keep within viewport
    left = clamp(left, viewportMargin, window.innerWidth - contentWidth - viewportMargin);

    // Clamp Y but preserve the gap from the trigger
    if (contentHeight > 0) {
      const viewportMinY = viewportMargin;
      const viewportMaxY = window.innerHeight - contentHeight - viewportMargin;

      // For bottom placement, don't let it go above the minimum
      // For top placement, don't let it go below the maximum
      if (placement === "bottom") {
        // Keep at least the gap from the trigger bottom, but respect viewport bounds
        const minTop = triggerRect.bottom + gap;
        top = Math.max(viewportMinY, minTop);
        if (top + contentHeight > window.innerHeight - viewportMargin) {
          top = Math.max(viewportMinY, window.innerHeight - contentHeight - viewportMargin);
        }
      } else {
        // Top placement
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

  return {
    triggerRef,
    contentRef,
    placement,
    align,
    widthValue,
    getPositionStyle,
  };
}
