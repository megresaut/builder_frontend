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
    bottom?: string;
    left?: string;
    right?: string;
    position: "absolute" | "fixed";
    zIndex: number;
  };
}

/**
 * useFloatingLayer - Manages placement, collision detection, and positioning of floating elements
 * 
 * Handles:
 * - Automatic placement flipping (bottom ↔ top) based on available space
 * - Scroll parent detection and monitoring
 * - Real-time repositioning on resize/scroll
 * - Optional width syncing to trigger element
 * - Z-index management for modals
 * 
 * @param open - Whether the floating layer is open/visible
 * @param initialPlacement - Initial placement direction (default: "bottom")
 * @param initialAlign - Initial alignment (default: "start")
 * @param offset - Space between trigger and content (default: 8)
 * @param minSpaceBelow - Minimum space required below before flipping (default: 300)
 * @param triggerWidth - Whether content should match trigger width (default: false)
 * 
 * @returns Object with triggerRef, contentRef, position state, and width syncing
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

  // Find all scrollable parent elements
  const findScrollParents = useCallback(() => {
    const parents: Element[] = [];
    let element = triggerRef.current?.parentElement;
    
    while (element) {
      const style = window.getComputedStyle(element);
      const isScrollable =
        (element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth) &&
        (style.overflow === "auto" ||
          style.overflow === "scroll" ||
          style.overflowY === "auto" ||
          style.overflowY === "scroll" ||
          style.overflowX === "auto" ||
          style.overflowX === "scroll");
      
      if (isScrollable || element === document.documentElement) {
        parents.push(element);
      }
      
      element = element.parentElement;
    }
    
    return parents;
  }, []);

  // Calculate position and detect if flip is needed
  const calculatePosition = useCallback(() => {
    if (!open || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentHeight = contentRef.current?.offsetHeight || minSpaceBelow;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const bufferSpace = 20;

    // Find the nearest scrollable container/modal ancestor
    let containerRect: DOMRect | null = null;
    let element = triggerRef.current.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      const isScrollable =
        (element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth) &&
        (style.overflow === "auto" ||
          style.overflow === "scroll" ||
          style.overflowY === "auto" ||
          style.overflowY === "scroll" ||
          style.overflowX === "auto" ||
          style.overflowX === "scroll");

      // Check if this is a modal or dialog (common container patterns)
      const isModal =
        element.getAttribute("role") === "dialog" ||
        element.getAttribute("role") === "alertdialog" ||
        element.classList.contains("modal") ||
        element.classList.contains("dialog") ||
        element.tagName === "DIALOG";

      if (isScrollable || isModal) {
        containerRect = element.getBoundingClientRect();
        break;
      }

      element = element.parentElement;
    }

    // Check container boundaries if a container was found
    let wouldExceedBottom = false;
    let wouldExceedTop = false;

    if (containerRect) {
      // Check if content would exceed container bottom
      const contentBottomPosition = triggerRect.bottom + bufferSpace + contentHeight;
      wouldExceedBottom = contentBottomPosition > containerRect.bottom;

      // Check if content would exceed container top
      const contentTopPosition = triggerRect.top - bufferSpace - contentHeight;
      wouldExceedTop = contentTopPosition < containerRect.top;
    }

    // Determine placement: flip to top if not enough space below or would exceed container
    let newPlacement: Placement = initialPlacement;
    if (
      (spaceBelow < contentHeight + bufferSpace && spaceAbove > contentHeight + bufferSpace) ||
      wouldExceedBottom
    ) {
      newPlacement = "top";
    } else if (wouldExceedTop) {
      newPlacement = "bottom";
    } else {
      newPlacement = initialPlacement;
    }

    setPlacement(newPlacement);

    // Determine alignment based on viewport
    let newAlign: Align = initialAlign;
    if (initialAlign === "start") {
      const spaceRight = window.innerWidth - triggerRect.left;
      const contentWidth = contentRef.current?.offsetWidth || triggerRect.width;
      
      if (spaceRight < contentWidth && triggerRect.right < window.innerWidth) {
        newAlign = "end";
      }
    }
    setAlign(newAlign);

    // Sync width to trigger if enabled
    if (triggerWidth && !widthValue) {
      setWidthValue(triggerRef.current.offsetWidth);
    }

    // Find scroll parents on first open
    if (scrollParents.length === 0) {
      setScrollParents(findScrollParents());
    }
  }, [open, initialPlacement, initialAlign, minSpaceBelow, triggerWidth, widthValue, scrollParents.length, findScrollParents]);

  // Monitor for changes and recalculate position
  useEffect(() => {
    if (!open) return;

    const resizeObserver = new ResizeObserver(calculatePosition);
    const scrollHandler = () => calculatePosition();

    // Observe trigger and content for size changes
    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Observe parent containers
    let parent = triggerRef.current?.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      resizeObserver.observe(parent);
      parent = parent.parentElement;
      depth++;
    }

    // Listen to all scroll parents and global events
    scrollParents.forEach(parent => {
      parent.addEventListener("scroll", scrollHandler, true);
    });
    document.addEventListener("scroll", scrollHandler, true);
    window.addEventListener("resize", calculatePosition);

    // Initial calculation
    calculatePosition();

    return () => {
      resizeObserver.disconnect();
      scrollParents.forEach(parent => {
        parent.removeEventListener("scroll", scrollHandler, true);
      });
      document.removeEventListener("scroll", scrollHandler, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [open, calculatePosition, scrollParents]);

  // Calculate final position style
  const getPositionStyle = (): FloatingPosition["style"] => {
    if (!triggerRef.current) {
      return { position: "absolute", zIndex: 50 };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const triggerHeight = triggerRect.height;
    const style: FloatingPosition["style"] = {
      position: "absolute",
      zIndex: 50,
    };

    if (placement === "bottom") {
      // Add trigger height + offset to position dropdown below
      style.top = `calc(100% + ${triggerHeight + offset}px)`;
    } else {
      // Position dropdown above with offset
      style.bottom = `calc(100% + ${offset}px)`;
    }

    if (align === "start") {
      style.left = "0";
    } else if (align === "end") {
      style.right = "0";
    } else {
      style.left = "50%";
    }

    return style;
  };

  return {
    triggerRef,
    contentRef,
    placement,
    align,
    widthValue,
    getPositionStyle,
  };
}
