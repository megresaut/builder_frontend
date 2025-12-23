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
    position: "fixed";
    transform: string;
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
 * findScrollableAncestors - Find ALL scrollable ancestor elements
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

  // Always include document.documentElement
  scrollables.push(document.documentElement);

  return scrollables;
}

/**
 * useFloatingLayer - Manages placement, collision detection, and positioning
 *
 * MODE A: Portaled to document.body
 * - Uses position: fixed
 * - Positions via transform: translate3d(x, y, 0) in viewport coordinates
 * - Listens to all scrollable ancestors for repositioning
 * - Flips placement dynamically as space changes
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
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  // Setup listeners and observers
  useEffect(() => {
    if (!open || !triggerRef.current) {
      setPlacement(initialPlacement);
      setAlign(initialAlign);
      setWidthValue(undefined);
      setComputedZIndex(50);
      return;
    }

    // Define calculatePosition INSIDE the effect so it has proper closure
    const calculatePosition = () => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const floatingEl = contentRef.current;
      const floatingHeight = floatingEl?.offsetHeight ?? 0;
      const floatingWidth = floatingEl?.offsetWidth ?? triggerRect.width;

      // Find the scroll container (modal, container with overflow)
      let boundsRect: DOMRect | { top: number; bottom: number; left: number; right: number };
      let ancestor = triggerRef.current.parentElement;
      while (ancestor) {
        const style = window.getComputedStyle(ancestor);
        if (
          ancestor.scrollHeight > ancestor.clientHeight ||
          ancestor.scrollWidth > ancestor.clientWidth
        ) {
          const isScrollable =
            style.overflow === "auto" ||
            style.overflow === "scroll" ||
            style.overflowY === "auto" ||
            style.overflowY === "scroll";

          if (isScrollable) {
            boundsRect = ancestor.getBoundingClientRect();
            break;
          }
        }
        ancestor = ancestor.parentElement;
      }

      if (!boundsRect) {
        // Use viewport bounds
        boundsRect = {
          top: 0,
          bottom: window.innerHeight,
          left: 0,
          right: window.innerWidth,
        };
      }

      // Calculate available space
      const availableBelow = boundsRect!.bottom - triggerRect.bottom;
      const availableAbove = triggerRect.top - boundsRect!.top;
      const gap = offset;

      // Determine placement based on available space
      let newPlacement: Placement = initialPlacement;
      if (initialPlacement === "bottom") {
        if (availableBelow < floatingHeight + gap && availableAbove >= floatingHeight + gap) {
          newPlacement = "top";
        } else {
          newPlacement = "bottom";
        }
      } else {
        // initialPlacement === "top"
        if (availableAbove < floatingHeight + gap && availableBelow >= floatingHeight + gap) {
          newPlacement = "bottom";
        } else {
          newPlacement = "top";
        }
      }
      setPlacement(newPlacement);

      // Calculate X position (viewport coords)
      let x = triggerRect.left;
      if (initialAlign === "end") {
        x = triggerRect.right - floatingWidth;
      } else if (initialAlign === "center") {
        x = triggerRect.left + triggerRect.width / 2 - floatingWidth / 2;
      }

      // Clamp X to viewport with margin
      const margin = 8;
      x = clamp(x, margin, window.innerWidth - floatingWidth - margin);

      // Calculate Y position (viewport coords)
      let y: number;
      if (newPlacement === "bottom") {
        y = triggerRect.bottom + gap;
      } else {
        y = triggerRect.top - floatingHeight - gap;
      }

      // Clamp Y but preserve gap from trigger
      const minY = margin;
      const maxY = window.innerHeight - floatingHeight - margin;

      if (newPlacement === "bottom") {
        const minAllowedY = triggerRect.bottom + gap;
        y = Math.max(minY, minAllowedY);
      } else {
        const maxAllowedY = triggerRect.top - floatingHeight - gap;
        y = Math.min(maxY, maxAllowedY);
      }

      setTranslateX(Math.round(x));
      setTranslateY(Math.round(y));

      // Sync width if requested
      if (triggerWidth) {
        const nextWidth = Math.round(triggerRect.width);
        setWidthValue((prev) => (prev === nextWidth ? prev : nextWidth));
      }

      // Calculate z-index
      const nextZIndex = Math.max(50, getMaxAncestorZIndex(triggerRef.current) + 1);
      setComputedZIndex((prev) => (prev === nextZIndex ? prev : nextZIndex));
    };

    // Find all scrollable ancestors
    const scrollables = findScrollableAncestors(triggerRef.current);

    // Setup ResizeObserver to detect content size changes
    const resizeObserver = new ResizeObserver(() => {
      calculatePosition();
    });

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

    // Scroll and resize handler
    const handleUpdate = () => {
      calculatePosition();
    };

    // Add scroll listeners to all scrollable ancestors (capture phase)
    scrollables.forEach((scrollable) => {
      scrollable.addEventListener("scroll", handleUpdate, { capture: true, passive: true });
    });

    // Window resize listener
    window.addEventListener("resize", handleUpdate, { passive: true });

    // Initial position calculation
    calculatePosition();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      scrollables.forEach((scrollable) => {
        scrollable.removeEventListener("scroll", handleUpdate, { capture: true });
      });
      window.removeEventListener("resize", handleUpdate);
    };
  }, [open, initialPlacement, initialAlign, offset, minSpaceBelow, triggerWidth]);

  /**
   * getPositionStyle - Returns fixed positioning with transform
   */
  const getPositionStyle = useCallback((): FloatingPosition["style"] => {
    return {
      position: "fixed",
      transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
      zIndex: computedZIndex,
    };
  }, [translateX, translateY, computedZIndex]);

  return {
    triggerRef,
    contentRef,
    placement,
    align,
    widthValue,
    getPositionStyle,
  };
}
