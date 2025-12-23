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
 * useFloatingLayer - Manages placement, collision detection, and positioning of floating elements
 *
 * Handles:
 * - Automatic placement flipping (bottom ↔ top) based on available space
 * - Scroll parent detection and monitoring
 * - Real-time repositioning on resize/scroll
 * - Optional width syncing to trigger element
 * - Modal-aware z-index stacking
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
  const lockedPlacementRef = useRef<Placement | null>(null);
  const [widthValue, setWidthValue] = useState<number | undefined>(undefined);
  const [scrollParents, setScrollParents] = useState<Element[]>([]);
  const [computedZIndex, setComputedZIndex] = useState(50);

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

  useEffect(() => {
    if (open) return;
    lockedPlacementRef.current = null;
    setPlacement(initialPlacement);
    setAlign(initialAlign);
  }, [open, initialPlacement, initialAlign]);

  const calculatePosition = useCallback(() => {
    if (!open || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentHeight = contentRef.current?.offsetHeight || minSpaceBelow;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const bufferSpace = 20;

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

    let wouldExceedBottom = false;
    let wouldExceedTop = false;

    if (containerRect) {
      const contentBottomPosition =
        triggerRect.bottom + offset + contentHeight + bufferSpace;
      wouldExceedBottom = contentBottomPosition > containerRect.bottom;

      const contentTopPosition =
        triggerRect.top - offset - contentHeight - bufferSpace;
      wouldExceedTop = contentTopPosition < containerRect.top;
    }

    let newPlacement: Placement = initialPlacement;
    if (
      (spaceBelow < contentHeight + offset + bufferSpace &&
        spaceAbove > contentHeight + offset + bufferSpace) ||
      wouldExceedBottom
    ) {
      newPlacement = "top";
    } else if (wouldExceedTop) {
      newPlacement = "bottom";
    } else {
      newPlacement = initialPlacement;
    }

    if (lockedPlacementRef.current) {
      newPlacement = lockedPlacementRef.current;
    } else if (newPlacement !== initialPlacement) {
      lockedPlacementRef.current = newPlacement;
    }

    setPlacement(newPlacement);

    let newAlign: Align = initialAlign;
    if (initialAlign === "start") {
      const spaceRight = window.innerWidth - triggerRect.left;
      const contentWidth =
        contentRef.current?.offsetWidth || widthValue || triggerRect.width;

      if (spaceRight < contentWidth && triggerRect.right < window.innerWidth) {
        newAlign = "end";
      }
    }
    setAlign(newAlign);

    if (triggerWidth) {
      const nextWidth = Math.round(triggerRect.width);
      setWidthValue((prev) => (prev === nextWidth ? prev : nextWidth));
    } else {
      setWidthValue(undefined);
    }

    const nextZIndex = Math.max(50, getMaxAncestorZIndex(triggerRef.current) + 1);
    setComputedZIndex((prev) => (prev === nextZIndex ? prev : nextZIndex));

    if (scrollParents.length === 0) {
      setScrollParents(findScrollParents());
    }
  }, [
    open,
    initialPlacement,
    initialAlign,
    minSpaceBelow,
    triggerWidth,
    widthValue,
    scrollParents.length,
    findScrollParents,
    offset,
  ]);

  useEffect(() => {
    if (!open) return;

    const resizeObserver = new ResizeObserver(calculatePosition);
    const scrollHandler = () => calculatePosition();

    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    let parent = triggerRef.current?.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      resizeObserver.observe(parent);
      parent = parent.parentElement;
      depth++;
    }

    scrollParents.forEach((parentEl) => {
      parentEl.addEventListener("scroll", scrollHandler, true);
    });
    document.addEventListener("scroll", scrollHandler, true);
    window.addEventListener("resize", calculatePosition);

    calculatePosition();

    return () => {
      resizeObserver.disconnect();
      scrollParents.forEach((parentEl) => {
        parentEl.removeEventListener("scroll", scrollHandler, true);
      });
      document.removeEventListener("scroll", scrollHandler, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [open, calculatePosition, scrollParents]);

  const getPositionStyle = (): FloatingPosition["style"] => {
    if (!triggerRef.current) {
      return { position: "fixed", zIndex: computedZIndex };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentEl = contentRef.current;

    const contentWidth =
      widthValue ?? contentEl?.offsetWidth ?? Math.round(triggerRect.width);
    const contentHeight = contentEl?.offsetHeight ?? 0;

    const margin = 8;

    let top =
      placement === "bottom"
        ? triggerRect.bottom + offset
        : triggerRect.top - contentHeight - offset;

    let left = triggerRect.left;
    if (align === "end") {
      left = triggerRect.right - contentWidth;
    } else if (align === "center") {
      left = triggerRect.left + triggerRect.width / 2 - contentWidth / 2;
    }

    left = clamp(left, margin, window.innerWidth - contentWidth - margin);
    if (contentHeight > 0) {
      top = clamp(top, margin, window.innerHeight - contentHeight - margin);
    } else {
      top = clamp(top, margin, window.innerHeight - margin);
    }

    return {
      position: "fixed",
      zIndex: computedZIndex,
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
    };
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
